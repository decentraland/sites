import { fireEvent, render, screen } from '@testing-library/react'
import type { DiscoverPlace } from '../../../features/discover'
import { SegmentEvent } from '../../../modules/segment.types'
// Import through the barrel so the re-export contract is exercised too.
import { LiveEventCard } from '.'

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

// Run the real *.styled.ts modules through the shared styled shim instead of
// the emotion engine (decentraland-ui2 ships ESM Jest can't transform).
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: actual.Box,
    BadgeGroup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    LiveBadge: () => <div>LIVE</div>,
    UserCountBadge: ({ count }: { count?: number }) => <div>{count}</div>,

    // Default to the desktop (hover-swap) path in tests; the mobile card path is
    // covered by the browser-verified layout.
    useTheme: () => ({ breakpoints: { down: () => '(max-width:0px)' } }),
    useMediaQuery: () => false,
    dclColors: {
      base: { primary: '#ff2d55', primaryDark1: '#e6284c' },
      neutral: { softWhite: '#fcfcfc', gray5: '#ecebed', gray3: '#a09ba8', softBlack1: '#161518', white: '#ffffff' }
    }
  }
})

function createPlace(overrides: Partial<DiscoverPlace> = {}): DiscoverPlace {
  return {
    id: 'live-1',
    title: 'Live Concert',
    description: 'A live music event',
    image: 'https://example.com/cover.png',
    positions: ['1,2'],
    base_position: '1,2',
    owner: '0xabc',
    user_name: 'DJName',
    contact_name: 'ContactName',
    categories: ['music'],
    user_count: 42,
    ...overrides
  }
}

describe('LiveEventCard', () => {
  let originalLocation: Location
  let assignedHrefs: string[]

  beforeEach(() => {
    assignedHrefs = []
    originalLocation = window.location
    // Redefine location so the JUMP IN handler's href assignment is observable
    // and does not trigger jsdom's "navigation not implemented" warning.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        get href() {
          return 'https://decentraland.org/discover'
        },
        set href(value: string) {
          assignedHrefs.push(value)
        }
      }
    })
    mockUseGetProfileQuery.mockReturnValue({ data: undefined })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    jest.resetAllMocks()
  })

  describe('when the live place is featured', () => {
    it('should NOT show a Featured badge (this rail carries LIVE + count only)', () => {
      render(<LiveEventCard place={createPlace({ highlighted: true })} />)

      expect(screen.queryByText('discover.card.featured')).not.toBeInTheDocument()
    })
  })

  describe('when rendered', () => {
    it('should show the LIVE badge and the player count', () => {
      render(<LiveEventCard place={createPlace()} />)

      expect(screen.getByText('LIVE')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should show the By row and no JUMP IN button', () => {
      render(<LiveEventCard place={createPlace()} />)

      expect(screen.getByText('DJName')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'discover.card.jump_in' })).not.toBeInTheDocument()
    })

    it('should default the player count to 0 when user_count is missing', () => {
      render(<LiveEventCard place={createPlace({ user_count: undefined })} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('when the card is hovered', () => {
    it('should swap the By row for the JUMP IN button', () => {
      render(<LiveEventCard place={createPlace()} />)

      fireEvent.mouseEnter(screen.getByText('Live Concert'))

      expect(screen.getByRole('button', { name: 'discover.card.jump_in' })).toBeInTheDocument()
      expect(screen.queryByText('DJName')).not.toBeInTheDocument()
    })

    it('should restore the By row when the pointer leaves', () => {
      render(<LiveEventCard place={createPlace()} />)
      const title = screen.getByText('Live Concert')

      fireEvent.mouseEnter(title)
      fireEvent.mouseLeave(title)

      expect(screen.getByText('DJName')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'discover.card.jump_in' })).not.toBeInTheDocument()
    })
  })

  describe('when the card is clicked', () => {
    it('should navigate to the parcel detail route', () => {
      render(<LiveEventCard place={createPlace()} />)

      fireEvent.click(screen.getByText('Live Concert'))

      expect(mockNavigate).toHaveBeenCalledWith('/discover/place/1,2', { state: { place: expect.any(Object) } })
    })

    it('should navigate to the lowercased world detail route for worlds', () => {
      render(<LiveEventCard place={createPlace({ world: true, world_name: 'PartyWorld' })} />)

      fireEvent.click(screen.getByText('Live Concert'))

      expect(mockNavigate).toHaveBeenCalledWith('/discover/world/partyworld', { state: { place: expect.any(Object) } })
    })

    it('should navigate using the first parcel when base_position is missing', () => {
      render(<LiveEventCard place={createPlace({ base_position: undefined, positions: ['7,8'] })} />)

      fireEvent.click(screen.getByText('Live Concert'))

      expect(mockNavigate).toHaveBeenCalledWith('/discover/place/7,8', { state: { place: expect.any(Object) } })
    })

    it('should not navigate when the place has no coordinates', () => {
      render(<LiveEventCard place={createPlace({ base_position: undefined, positions: [] })} />)

      fireEvent.click(screen.getByText('Live Concert'))

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('when JUMP IN is clicked while hovered', () => {
    it('should hand the place to the shared launcher without navigating', () => {
      const place = createPlace()
      render(<LiveEventCard place={place} />)

      fireEvent.mouseEnter(screen.getByText('Live Concert'))
      fireEvent.click(screen.getByRole('button', { name: 'discover.card.jump_in' }))

      expect(mockJumpIn).toHaveBeenCalledWith(place, 'live-card')
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('when rendering the creator identity', () => {
    it('should render the real face256 avatar when the owner profile has one', () => {
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ hasClaimedName: true, avatar: { snapshots: { face256: 'https://peer.decentraland.org/face256.png' } } }] }
      })
      const { container } = render(<LiveEventCard place={createPlace()} />)

      expect(container.querySelector('img')).toHaveAttribute('src', 'https://peer.decentraland.org/face256.png')
    })

    it('should skip the profile request and use a synthetic avatar when there is no owner', () => {
      const { container } = render(<LiveEventCard place={createPlace({ owner: null })} />)

      expect(mockUseGetProfileQuery).toHaveBeenCalledWith(undefined, { skip: true })
      expect(container.querySelector('img')?.getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    })

    it('should fall back to the contact name when user_name is missing', () => {
      render(<LiveEventCard place={createPlace({ user_name: undefined })} />)

      expect(screen.getByText('ContactName')).toBeInTheDocument()
    })

    it('should render an empty By row when the place has no creator name', () => {
      const { container } = render(<LiveEventCard place={createPlace({ user_name: undefined, contact_name: undefined, owner: null })} />)

      expect(screen.queryByText(/discover\.card\.by/)).not.toBeInTheDocument()
      expect(container.querySelector('img')).not.toBeInTheDocument()
    })
  })

  describe('when tracking discover events', () => {
    it('should track the card click with the place payload', () => {
      render(<LiveEventCard place={createPlace()} />)

      fireEvent.click(screen.getByText(createPlace().title))

      expect(mockTrack).toHaveBeenCalledWith(
        SegmentEvent.DISCOVER_CLICK_LIVE_CARD,
        expect.objectContaining({ place_id: expect.any(String) })
      )
    })

    it('should delegate JUMP IN to the shared launcher with the live-card surface', () => {
      const place = createPlace()
      render(<LiveEventCard place={place} />)
      fireEvent.mouseEnter(screen.getByText(place.title))

      fireEvent.click(screen.getByRole('button', { name: 'discover.card.jump_in' }))

      expect(mockJumpIn).toHaveBeenCalledWith(place, 'live-card')
    })
  })
})
