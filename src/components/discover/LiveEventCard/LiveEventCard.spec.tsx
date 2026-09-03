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

// Desktop (hover-reveal) by default; the mobile card shows both rows at once.
const mockIsMobileCard = jest.fn()

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
    // LiveEventBadge wraps the badge in this when the row carries an event title.
    Tooltip: ({ title, children }: { title?: React.ReactNode; children?: React.ReactNode }) => (
      <div data-testid="tooltip" data-title={String(title ?? '')}>
        {children}
      </div>
    ),
    UserCountBadge: ({ count }: { count?: number }) => <div>{count}</div>,

    useTheme: () => ({ breakpoints: { down: () => '(max-width:0px)' } }),
    useMediaQuery: () => mockIsMobileCard(),
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
    contact_name: 'DJName',
    categories: ['music'],
    user_count: 42,
    ...overrides
  }
}

// The By row and the CTA both stay mounted so the CTA can slide in, so being
// "hidden" means being out of the accessibility tree, not out of the DOM.
function isHiddenFromA11yTree(element: HTMLElement): boolean {
  return element.closest('[aria-hidden="true"]') !== null
}

// The whole card is the role="button" wrapper around the title.
function cardOf(title: string): HTMLElement {
  const card = screen.getByText(title).closest('[role="button"]')
  if (!card) throw new Error(`no card found for ${title}`)
  return card as HTMLElement
}

describe('LiveEventCard', () => {
  beforeEach(() => {
    mockUseGetProfileQuery.mockReturnValue({ data: undefined })
    mockIsMobileCard.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered', () => {
    it('should show the player count, and LIVE only when an event is running', () => {
      render(<LiveEventCard place={createPlace()} />)

      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
    })

    it('should expose the By row and keep the JUMP IN button out of the accessibility tree', () => {
      render(<LiveEventCard place={createPlace()} />)

      expect(isHiddenFromA11yTree(screen.getByText('DJName'))).toBe(false)
      expect(screen.queryByRole('button', { name: 'discover.card.jump_in' })).not.toBeInTheDocument()
    })

    it('should keep the JUMP IN button mounted and untabbable while parked', () => {
      render(<LiveEventCard place={createPlace()} />)

      // The button has to stay in the DOM across the whole hover so it can
      // slide up rather than pop in; aria-hidden + tabIndex keep it out of
      // reach while it is parked below the card.
      const cta = screen.getByText('discover.card.jump_in').closest('button')

      expect(cta).toBeInTheDocument()
      expect(cta).toHaveAttribute('aria-hidden', 'true')
      expect(cta).toHaveAttribute('tabindex', '-1')
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
      expect(isHiddenFromA11yTree(screen.getByText('DJName'))).toBe(true)
    })

    it('should make the JUMP IN button tabbable once it is revealed', () => {
      render(<LiveEventCard place={createPlace()} />)

      fireEvent.mouseEnter(screen.getByText('Live Concert'))

      const cta = screen.getByRole('button', { name: 'discover.card.jump_in' })

      expect(cta).not.toHaveAttribute('aria-hidden')
      expect(cta).toHaveAttribute('tabindex', '0')
    })

    it('should stay revealed when the pointer leaves while the button holds focus', () => {
      render(<LiveEventCard place={createPlace()} />)
      const title = screen.getByText('Live Concert')
      fireEvent.mouseEnter(title)

      // Clicking the CTA focuses it and the launcher modal takes the pointer,
      // so mouseleave arrives while focus is still on the button. Parking it
      // then would aria-hide a focused node and leave Enter re-firing it.
      const cta = screen.getByRole('button', { name: 'discover.card.jump_in' })
      fireEvent.focus(cta)
      fireEvent.mouseLeave(title)

      expect(cta).not.toHaveAttribute('aria-hidden')
      expect(cta).toHaveAttribute('tabindex', '0')
    })

    it('should park the button again once it loses focus', () => {
      render(<LiveEventCard place={createPlace()} />)
      const title = screen.getByText('Live Concert')
      fireEvent.mouseEnter(title)
      const cta = screen.getByRole('button', { name: 'discover.card.jump_in' })

      fireEvent.focus(cta)
      fireEvent.mouseLeave(title)
      fireEvent.blur(cta)

      expect(screen.queryByRole('button', { name: 'discover.card.jump_in' })).not.toBeInTheDocument()
    })

    it('should restore the By row when the pointer leaves', () => {
      render(<LiveEventCard place={createPlace()} />)
      const title = screen.getByText('Live Concert')

      fireEvent.mouseEnter(title)
      fireEvent.mouseLeave(title)

      expect(isHiddenFromA11yTree(screen.getByText('DJName'))).toBe(false)
      expect(screen.queryByRole('button', { name: 'discover.card.jump_in' })).not.toBeInTheDocument()
    })
  })

  describe('when rendered on a mobile viewport', () => {
    beforeEach(() => {
      mockIsMobileCard.mockReturnValue(true)
    })

    it('should expose both the By row and a reachable JUMP IN button', () => {
      render(<LiveEventCard place={createPlace()} />)

      expect(isHiddenFromA11yTree(screen.getByText('DJName'))).toBe(false)
      expect(screen.getByRole('button', { name: 'discover.card.jump_in' })).toHaveAttribute('tabindex', '0')
    })

    it('should keep both rows exposed even while hovered', () => {
      render(<LiveEventCard place={createPlace()} />)

      fireEvent.mouseEnter(screen.getByText('Live Concert'))

      expect(isHiddenFromA11yTree(screen.getByText('DJName'))).toBe(false)
      expect(screen.getByRole('button', { name: 'discover.card.jump_in' })).not.toHaveAttribute('aria-hidden')
    })
  })

  describe('when the card is clicked', () => {
    it('should navigate to the parcel detail route', () => {
      render(<LiveEventCard place={createPlace()} />)

      fireEvent.click(screen.getByText('Live Concert'))

      expect(mockNavigate).toHaveBeenCalledWith('/places/place/1,2', { state: { place: expect.any(Object) } })
    })

    it('should navigate to the lowercased world detail route for worlds', () => {
      render(<LiveEventCard place={createPlace({ world: true, world_name: 'PartyWorld' })} />)

      fireEvent.click(screen.getByText('Live Concert'))

      expect(mockNavigate).toHaveBeenCalledWith('/places/world/partyworld', { state: { place: expect.any(Object) } })
    })

    it('should navigate using the first parcel when base_position is missing', () => {
      render(<LiveEventCard place={createPlace({ base_position: undefined, positions: ['7,8'] })} />)

      fireEvent.click(screen.getByText('Live Concert'))

      expect(mockNavigate).toHaveBeenCalledWith('/places/place/7,8', { state: { place: expect.any(Object) } })
    })

    it('should not navigate when the place has no coordinates', () => {
      render(<LiveEventCard place={createPlace({ base_position: undefined, positions: [] })} />)

      fireEvent.click(screen.getByText('Live Concert'))

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('when the card is activated from the keyboard', () => {
    it.each(['Enter', ' '])('should navigate to the detail route on %s', key => {
      render(<LiveEventCard place={createPlace()} />)

      fireEvent.keyDown(cardOf('Live Concert'), { key })

      expect(mockNavigate).toHaveBeenCalledWith('/places/place/1,2', { state: { place: expect.any(Object) } })
    })

    it('should ignore any other key', () => {
      render(<LiveEventCard place={createPlace()} />)

      fireEvent.keyDown(cardOf('Live Concert'), { key: 'Tab' })

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
    it('should render the owner face256 only when the scene names no contact', () => {
      mockUseGetProfileQuery.mockReturnValue({
        data: {
          avatars: [
            { name: 'LandOwner', hasClaimedName: true, avatar: { snapshots: { face256: 'https://peer.decentraland.org/face256.png' } } }
          ]
        }
      })
      const { container } = render(<LiveEventCard place={createPlace({ contact_name: undefined })} />)

      expect(container.querySelector('img')).toHaveAttribute('src', 'https://peer.decentraland.org/face256.png')
    })

    it('should NOT put the land owner face next to a contact name', () => {
      // The owner of the land is not the author as soon as a studio deploys
      // from a shared wallet, so their picture cannot ride along.
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ name: 'LandOwner', hasClaimedName: true, avatar: { snapshots: { face256: 'https://peer/face.png' } } }] }
      })
      const { container } = render(<LiveEventCard place={createPlace()} />)

      expect(screen.getByText('DJName')).toBeInTheDocument()
      expect(screen.queryByText('LandOwner')).not.toBeInTheDocument()
      expect(container.querySelector('img')?.getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    })

    it('should skip the profile request and use a synthetic avatar when there is no owner', () => {
      const { container } = render(<LiveEventCard place={createPlace({ owner: null })} />)

      expect(mockUseGetProfileQuery).toHaveBeenCalledWith(undefined, { skip: true })
      expect(container.querySelector('img')?.getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    })

    it('should credit the scene contact rather than the land owner', () => {
      render(<LiveEventCard place={createPlace()} />)

      expect(screen.getByText('DJName')).toBeInTheDocument()
    })

    it('should render an empty By row when the place has no creator name', () => {
      const { container } = render(<LiveEventCard place={createPlace({ contact_name: undefined, owner: null })} />)

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

  describe('when deciding the badges', () => {
    it('should carry the Featured badge, since a busy featured scene renders only here', () => {
      render(<LiveEventCard place={createPlace({ highlighted: true })} />)

      expect(screen.getByText('discover.card.featured')).toBeInTheDocument()
    })

    it('should show LIVE only when an event is running at the place', () => {
      render(<LiveEventCard place={createPlace({ live: true })} />)

      expect(screen.getByText('LIVE')).toBeInTheDocument()
    })

    it('should hang the event title off the LIVE badge as a tooltip', () => {
      render(<LiveEventCard place={createPlace({ live: true, live_event_name: 'Watch Party Wednesdays' })} />)

      const tooltip = screen.getByTestId('tooltip')

      expect(tooltip).toHaveAttribute('data-title', 'Watch Party Wednesdays')
      expect(tooltip).toContainElement(screen.getByText('LIVE'))
    })

    it('should leave the badge bare while the row carries no event title', () => {
      // Every row looks like this until the places-api field reaches the
      // environment being read.
      render(<LiveEventCard place={createPlace({ live: true })} />)

      expect(screen.getByText('LIVE')).toBeInTheDocument()
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
    })

    it('should show the head count without LIVE when people are there but no event is', () => {
      render(<LiveEventCard place={createPlace({ user_count: 12, live: false })} />)

      expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
    })
  })
})
