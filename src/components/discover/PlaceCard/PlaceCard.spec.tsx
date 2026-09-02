import { fireEvent, render, screen } from '@testing-library/react'
import type { DiscoverPlace } from '../../../features/discover'
import { SegmentEvent } from '../../../modules/segment.types'
// Import through the barrel so the re-export contract is exercised too.
import { PlaceCard } from '.'

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

const mockNewLayout = jest.fn()
jest.mock('../../../features/discover/discover.flags', () => ({
  useNewPlacesLayout: () => mockNewLayout()
}))

jest.mock('../../../features/profile/profile.client', () => ({
  useGetProfileQuery: (...args: unknown[]) => mockUseGetProfileQuery(...args)
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null) => id ?? ''
}))

// Run the real PlaceCard.styled.ts through the shared styled shim instead of
// the emotion engine (decentraland-ui2 ships ESM Jest can't transform).
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
    id: 'place-1',
    title: 'Genesis Plaza',
    description: 'The heart of Decentraland',
    image: 'https://example.com/cover.png',
    positions: ['-9,-9'],
    base_position: '-9,-9',
    owner: '0xabc',
    contact_name: 'CreatorName',
    categories: [],
    user_count: 0,
    ...overrides
  }
}

describe('PlaceCard', () => {
  beforeEach(() => {
    mockUseGetProfileQuery.mockReturnValue({ data: undefined })
    // Off by default so every legacy assertion below keeps describing production.
    mockNewLayout.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the scene has players', () => {
    let place: DiscoverPlace

    beforeEach(() => {
      place = createPlace({ user_count: 5 })
    })

    it('should render the LIVE badge', () => {
      render(<PlaceCard place={place} />)

      expect(screen.getByText('LIVE')).toBeInTheDocument()
    })

    it('should render the live player count', () => {
      render(<PlaceCard place={place} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should navigate to the parcel detail route when the card is clicked', () => {
      render(<PlaceCard place={place} />)

      fireEvent.click(screen.getByText('Genesis Plaza'))

      expect(mockNavigate).toHaveBeenCalledWith('/places/place/-9,-9', { state: { place: expect.any(Object) } })
    })

    it('should navigate instead of calling onEmptyClick because the scene is live', () => {
      const onEmptyClick = jest.fn()
      render(<PlaceCard place={place} onEmptyClick={onEmptyClick} />)

      fireEvent.click(screen.getByText('Genesis Plaza'))

      expect(onEmptyClick).not.toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/places/place/-9,-9', { state: { place: expect.any(Object) } })
    })
  })

  describe('when the scene is empty', () => {
    let place: DiscoverPlace

    beforeEach(() => {
      place = createPlace({ user_count: 0 })
    })

    it('should not render the LIVE badge', () => {
      render(<PlaceCard place={place} />)

      expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
    })

    it('should call onEmptyClick with the place instead of navigating', () => {
      const onEmptyClick = jest.fn()
      render(<PlaceCard place={place} onEmptyClick={onEmptyClick} />)

      fireEvent.click(screen.getByText('Genesis Plaza'))

      expect(onEmptyClick).toHaveBeenCalledWith(place)
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should navigate to the detail route when onEmptyClick is not provided', () => {
      render(<PlaceCard place={place} />)

      fireEvent.click(screen.getByText('Genesis Plaza'))

      expect(mockNavigate).toHaveBeenCalledWith('/places/place/-9,-9', { state: { place: expect.any(Object) } })
    })
  })

  describe('when the place is highlighted (curated Featured set)', () => {
    it('should render the FEATURED badge', () => {
      render(<PlaceCard place={createPlace({ highlighted: true })} />)

      expect(screen.getByText('discover.card.featured')).toBeInTheDocument()
    })

    it('should not render the FEATURED badge when not highlighted', () => {
      render(<PlaceCard place={createPlace({ categories: ['music'] })} />)

      expect(screen.queryByText('discover.card.featured')).not.toBeInTheDocument()
    })
  })

  describe('when the place is a world', () => {
    let place: DiscoverPlace

    beforeEach(() => {
      place = createPlace({ world: true, world_name: 'MyWorld', user_count: 3 })
    })

    it('should navigate to the lowercased world detail route when clicked', () => {
      render(<PlaceCard place={place} />)

      fireEvent.click(screen.getByText('Genesis Plaza'))

      expect(mockNavigate).toHaveBeenCalledWith('/places/world/myworld', { state: { place: expect.any(Object) } })
    })

    it('should show the world name in the location pill', () => {
      render(<PlaceCard place={place} />)

      expect(screen.getByText('MyWorld')).toBeInTheDocument()
    })

    it('should hand the place to the shared launcher when JUMP IN is clicked', () => {
      render(<PlaceCard place={place} />)

      // The CTA is revealed by hover, so reach it the way a pointer does.
      fireEvent.mouseEnter(screen.getByText('MyWorld'))
      fireEvent.click(screen.getByRole('button', { name: 'discover.card.jump_in' }))

      expect(mockJumpIn).toHaveBeenCalledWith(place, 'place-card')
    })
  })

  describe('when the card is activated from the keyboard', () => {
    it.each(['Enter', ' '])('should navigate to the detail route on %s', key => {
      render(<PlaceCard place={createPlace()} />)
      const card = screen.getByText('Genesis Plaza').closest('[role="button"]')

      fireEvent.keyDown(card as HTMLElement, { key })

      expect(mockNavigate).toHaveBeenCalledWith('/places/place/-9,-9', { state: { place: expect.any(Object) } })
    })

    it('should ignore any other key', () => {
      render(<PlaceCard place={createPlace()} />)
      const card = screen.getByText('Genesis Plaza').closest('[role="button"]')

      fireEvent.keyDown(card as HTMLElement, { key: 'Tab' })

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('when the place has no base position', () => {
    it('should navigate using the first parcel in positions', () => {
      render(<PlaceCard place={createPlace({ base_position: undefined, positions: ['10,20'] })} />)

      fireEvent.click(screen.getByText('Genesis Plaza'))

      expect(mockNavigate).toHaveBeenCalledWith('/places/place/10,20', { state: { place: expect.any(Object) } })
    })
  })

  describe('when the place has no coordinates at all', () => {
    it('should not navigate on click', () => {
      render(<PlaceCard place={createPlace({ base_position: undefined, positions: [] })} />)

      fireEvent.click(screen.getByText('Genesis Plaza'))

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('when JUMP IN is clicked on a parcel place', () => {
    it('should hand the place to the shared launcher without triggering the card navigation', () => {
      const place = createPlace({ user_count: 2 })
      render(<PlaceCard place={place} />)

      fireEvent.mouseEnter(screen.getByText('Genesis Plaza'))
      fireEvent.click(screen.getByRole('button', { name: 'discover.card.jump_in' }))

      expect(mockJumpIn).toHaveBeenCalledWith(place, 'place-card')
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should keep the parked CTA out of the accessibility tree and out of Tab order', () => {
      render(<PlaceCard place={createPlace({ user_count: 2 })} />)

      const cta = screen.getByText('discover.card.jump_in').closest('button')

      expect(cta).toHaveAttribute('aria-hidden', 'true')
      expect(cta).toHaveAttribute('tabindex', '-1')
    })

    it('should stay revealed when the pointer leaves while the CTA holds focus', () => {
      render(<PlaceCard place={createPlace({ user_count: 2 })} />)
      const title = screen.getByText('Genesis Plaza')
      fireEvent.mouseEnter(title)

      const cta = screen.getByRole('button', { name: 'discover.card.jump_in' })
      fireEvent.focus(cta)
      fireEvent.mouseLeave(title)

      expect(cta).not.toHaveAttribute('aria-hidden')
      expect(cta).toHaveAttribute('tabindex', '0')
    })

    it('should park the CTA again once it loses focus', () => {
      render(<PlaceCard place={createPlace({ user_count: 2 })} />)
      const title = screen.getByText('Genesis Plaza')
      fireEvent.mouseEnter(title)
      const cta = screen.getByRole('button', { name: 'discover.card.jump_in' })

      fireEvent.focus(cta)
      fireEvent.mouseLeave(title)
      fireEvent.blur(cta)

      expect(screen.queryByRole('button', { name: 'discover.card.jump_in' })).not.toBeInTheDocument()
    })
  })

  describe('when the pointer enters and leaves the card', () => {
    it('should keep the card clickable after the hover cycle', () => {
      render(<PlaceCard place={createPlace({ user_count: 1 })} />)
      const card = screen.getByText('Genesis Plaza')

      fireEvent.mouseEnter(card)
      fireEvent.mouseLeave(card)
      fireEvent.click(card)

      expect(mockNavigate).toHaveBeenCalledWith('/places/place/-9,-9', { state: { place: expect.any(Object) } })
    })
  })

  describe('when the scene names no contact and the owner has a catalyst profile', () => {
    it('should render the owner face256', () => {
      mockUseGetProfileQuery.mockReturnValue({
        data: {
          avatars: [
            { name: 'LandOwner', hasClaimedName: true, avatar: { snapshots: { face256: 'https://peer.decentraland.org/face256.png' } } }
          ]
        }
      })
      const { container } = render(<PlaceCard place={createPlace({ contact_name: undefined })} />)

      expect(container.querySelector('img')).toHaveAttribute('src', 'https://peer.decentraland.org/face256.png')
    })

    it('should request the profile for the owner address', () => {
      render(<PlaceCard place={createPlace()} />)

      expect(mockUseGetProfileQuery).toHaveBeenCalledWith('0xabc', { skip: false })
    })
  })

  describe('when the place has no owner address', () => {
    it('should skip the profile request', () => {
      render(<PlaceCard place={createPlace({ owner: null })} />)

      expect(mockUseGetProfileQuery).toHaveBeenCalledWith(undefined, { skip: true })
    })

    it('should fall back to a synthetic avatar for the creator name', () => {
      const { container } = render(<PlaceCard place={createPlace({ owner: null })} />)

      expect(container.querySelector('img')?.getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    })
  })

  describe('when the place declares a contact name', () => {
    it('should render the by-line with the creator name', () => {
      render(<PlaceCard place={createPlace()} />)

      expect(screen.getByText(/discover\.card\.by/)).toBeInTheDocument()
      expect(screen.getByText('CreatorName')).toBeInTheDocument()
    })
  })

  describe('when the place has no creator name at all', () => {
    it('should render neither the by-line nor an avatar', () => {
      const { container } = render(<PlaceCard place={createPlace({ contact_name: undefined, owner: null })} />)

      expect(screen.queryByText(/discover\.card\.by/)).not.toBeInTheDocument()
      expect(container.querySelector('img')).not.toBeInTheDocument()
    })
  })

  describe('when tracking discover events', () => {
    it('should track the card click with the place payload', () => {
      render(<PlaceCard place={createPlace({ user_count: 5 })} />)

      fireEvent.click(screen.getByText('Genesis Plaza'))

      expect(mockTrack).toHaveBeenCalledWith(
        SegmentEvent.DISCOVER_CLICK_PLACE_CARD,
        expect.objectContaining({ place_id: 'place-1', place_title: 'Genesis Plaza', world: false, position: '-9,-9' })
      )
    })
  })

  describe('when the new layout is on', () => {
    beforeEach(() => {
      mockNewLayout.mockReturnValue(true)
    })

    it('should show LIVE for an event even with nobody in the scene', () => {
      render(<PlaceCard place={createPlace({ user_count: 0, live: true })} />)

      expect(screen.getByText('LIVE')).toBeInTheDocument()
    })

    it('should not show LIVE for a crowd with no event, however big', () => {
      render(<PlaceCard place={createPlace({ user_count: 40, live: false })} />)

      expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
      expect(screen.getByText('40')).toBeInTheDocument()
    })
  })
})
