import { fireEvent, render, screen } from '@testing-library/react'
import type { DiscoverPlace } from '../../../features/discover'
import { SegmentEvent } from '../../../modules/segment.types'
// Import through the barrel so the re-export contract is exercised too.
import { FeaturedCard } from '.'

const mockNavigate = jest.fn()
const mockUseGetProfileQuery = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

const mockJumpIn = jest.fn()
jest.mock('../DiscoverJumpInProvider', () => ({
  useDiscoverJumpIn: () => ({ jumpIn: mockJumpIn })
}))

const mockTrack = jest.fn()
jest.mock('../../../hooks/useDeferredTrack', () => ({
  useDeferredTrack: () => mockTrack
}))

// The barrel re-exports the RTK Query clients (import.meta env access Jest
// can't parse); the card only consumes the pure helpers, so alias to them.
jest.mock('../../../features/discover', () => jest.requireActual('../../../features/discover/discover.helpers'))

jest.mock('../../../features/profile/profile.client', () => ({
  useGetProfileQuery: (...args: unknown[]) => mockUseGetProfileQuery(...args)
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null) => id ?? ''
}))

// Run the real FeaturedCard.styled.ts through the shared styled shim instead
// of the emotion engine (decentraland-ui2 ships ESM Jest can't transform).
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: actual.Box,
    BadgeGroup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    LiveBadge: () => <div>LIVE</div>,
    UserCountBadge: ({ count }: { count?: number }) => <div>{count}</div>,

    dclColors: {
      base: { primary: '#ff2d55', primaryDark1: '#e6284c' },
      neutral: { softWhite: '#fcfcfc', gray5: '#ecebed', gray3: '#a09ba8', softBlack1: '#161518', white: '#ffffff' }
    }
  }
})

function createPlace(overrides: Partial<DiscoverPlace> = {}): DiscoverPlace {
  return {
    id: 'featured-1',
    title: 'Wonder Museum',
    description: 'A curated art space',
    image: 'https://example.com/cover.png',
    positions: ['12,34'],
    base_position: '12,34',
    owner: '0xabc',
    user_name: 'CuratorName',
    contact_name: 'ContactName',
    categories: ['poi'],
    user_count: 0,
    ...overrides
  }
}

describe('FeaturedCard', () => {
  beforeEach(() => {
    mockUseGetProfileQuery.mockReturnValue({ data: undefined })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendering the card chrome', () => {
    it('should NOT show a Featured tag (the section title already says it)', () => {
      render(<FeaturedCard place={createPlace({ highlighted: true })} />)

      expect(screen.queryByRole('img', { name: 'discover.card.featured' })).not.toBeInTheDocument()
      expect(screen.queryByText('discover.card.featured')).not.toBeInTheDocument()
    })

    it('should show only the presence count when people are in the scene — never LIVE / Featured tags', () => {
      render(<FeaturedCard place={createPlace({ user_count: 7 })} />)

      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
      expect(screen.queryByText('discover.card.featured')).not.toBeInTheDocument()
    })

    it('should show the count even below the LIVE threshold (any presence counts)', () => {
      render(<FeaturedCard place={createPlace({ user_count: 3 })} />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should show NO count when the scene is empty', () => {
      render(<FeaturedCard place={createPlace({ user_count: 0 })} />)

      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })
  })

  describe('when onEmptyClick is provided', () => {
    it('should always call it with the place instead of navigating', () => {
      const onEmptyClick = jest.fn()
      const place = createPlace()
      render(<FeaturedCard place={place} onEmptyClick={onEmptyClick} />)

      fireEvent.click(screen.getByText('Wonder Museum'))

      expect(onEmptyClick).toHaveBeenCalledWith(place)
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('when onEmptyClick is not provided', () => {
    it('should navigate to the parcel detail route on click', () => {
      render(<FeaturedCard place={createPlace()} />)

      fireEvent.click(screen.getByText('Wonder Museum'))

      expect(mockNavigate).toHaveBeenCalledWith('/discover/place/12,34', { state: { place: expect.any(Object) } })
    })

    it('should navigate using the first parcel when base_position is missing', () => {
      render(<FeaturedCard place={createPlace({ base_position: undefined, positions: ['5,6'] })} />)

      fireEvent.click(screen.getByText('Wonder Museum'))

      expect(mockNavigate).toHaveBeenCalledWith('/discover/place/5,6', { state: { place: expect.any(Object) } })
    })

    it('should not navigate when the place has no coordinates', () => {
      render(<FeaturedCard place={createPlace({ base_position: undefined, positions: [] })} />)

      fireEvent.click(screen.getByText('Wonder Museum'))

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('when the place is a world', () => {
    it('should navigate to the lowercased world detail route', () => {
      render(<FeaturedCard place={createPlace({ world: true, world_name: 'ArtWorld' })} />)

      fireEvent.click(screen.getByText('Wonder Museum'))

      expect(mockNavigate).toHaveBeenCalledWith('/discover/world/artworld', { state: { place: expect.any(Object) } })
    })

    it('should show the world name as the location label', () => {
      render(<FeaturedCard place={createPlace({ world: true, world_name: 'ArtWorld' })} />)

      expect(screen.getByText('ArtWorld')).toBeInTheDocument()
    })
  })

  describe('when JUMP IN is clicked', () => {
    it('should hand the place to the shared launcher without triggering the card click', () => {
      const onEmptyClick = jest.fn()
      const place = createPlace()
      render(<FeaturedCard place={place} onEmptyClick={onEmptyClick} />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.card.jump_in' }))

      expect(mockJumpIn).toHaveBeenCalledWith(place, 'featured-card')
      expect(onEmptyClick).not.toHaveBeenCalled()
    })
  })

  describe('when the pointer enters and leaves the card', () => {
    it('should keep the card clickable after the hover cycle', () => {
      render(<FeaturedCard place={createPlace()} />)
      const card = screen.getByText('Wonder Museum')

      fireEvent.mouseEnter(card)
      fireEvent.mouseLeave(card)
      fireEvent.click(card)

      expect(mockNavigate).toHaveBeenCalledWith('/discover/place/12,34', { state: { place: expect.any(Object) } })
    })
  })

  describe('when rendering the creator identity', () => {
    it('should render the by-line with the creator name and the coordinates', () => {
      render(<FeaturedCard place={createPlace()} />)

      expect(screen.getByText(/discover\.card\.by/)).toBeInTheDocument()
      expect(screen.getByText('CuratorName')).toBeInTheDocument()
      expect(screen.getByText('12,34')).toBeInTheDocument()
    })

    it('should render the real face256 avatar when the owner profile has one', () => {
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ hasClaimedName: false, avatar: { snapshots: { face256: 'https://peer.decentraland.org/face256.png' } } }] }
      })
      const { container } = render(<FeaturedCard place={createPlace()} />)

      expect(container.querySelector('img')).toHaveAttribute('src', 'https://peer.decentraland.org/face256.png')
    })

    it('should skip the profile request and use a synthetic avatar when there is no owner', () => {
      const { container } = render(<FeaturedCard place={createPlace({ owner: null })} />)

      expect(mockUseGetProfileQuery).toHaveBeenCalledWith(undefined, { skip: true })
      expect(container.querySelector('img')?.getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    })

    it('should fall back to the contact name when user_name is missing', () => {
      render(<FeaturedCard place={createPlace({ user_name: undefined })} />)

      expect(screen.getByText('ContactName')).toBeInTheDocument()
    })

    it('should render no by-line when the place has no creator name', () => {
      render(<FeaturedCard place={createPlace({ user_name: undefined, contact_name: undefined, owner: null })} />)

      expect(screen.queryByText(/discover\.card\.by/)).not.toBeInTheDocument()
    })
  })

  describe('when tracking discover events', () => {
    it('should track the card click with the place payload', () => {
      render(<FeaturedCard place={createPlace()} />)

      fireEvent.click(screen.getByText(createPlace().title))

      expect(mockTrack).toHaveBeenCalledWith(
        SegmentEvent.DISCOVER_CLICK_FEATURED_CARD,
        expect.objectContaining({ place_id: expect.any(String), place_title: createPlace().title })
      )
    })
  })
})
