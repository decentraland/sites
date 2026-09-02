import React from 'react'
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

const mockIsTouchWidth = jest.fn()

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

    useTheme: () => ({ breakpoints: { down: () => '(max-width:0px)' } }),
    useMediaQuery: () => mockIsTouchWidth(),

    // Stands in for the shared card, mirroring only what this component can be
    // held to: which slot each node lands in, and the click contract. The
    // card's own frame, hover lift and hover reveal are covered in ui2.
    EventSmallCard: ({
      image,
      imageFallbackColor,
      thumbnailOverlay,
      title,
      creatorName,
      creatorAvatarUrl,
      creatorAvatarBackgroundColor,
      byLabel,
      bottomPill,
      hoverActions,
      onClick,
      disableHover
    }: {
      image?: string
      imageFallbackColor?: string
      thumbnailOverlay?: React.ReactNode
      title?: string
      creatorName?: string
      creatorAvatarUrl?: string
      creatorAvatarBackgroundColor?: string
      byLabel?: string
      bottomPill?: React.ReactNode
      hoverActions?: React.ReactNode
      onClick?: () => void
      disableHover?: boolean
    }) =>
      React.createElement(
        'div',
        {
          role: 'button',
          tabIndex: 0,
          onClick,
          'data-disable-hover': String(Boolean(disableHover)),
          'data-image-fallback': imageFallbackColor,
          'data-avatar-bg': creatorAvatarBackgroundColor
        },
        // The real card marks the cover decorative (alt=""), so identify it by
        // role instead of alt text.
        image ? React.createElement('img', { key: 'cover', 'data-testid': 'cover', src: image, alt: '' }) : null,
        thumbnailOverlay,
        React.createElement('div', { key: 'title' }, title),
        creatorName
          ? React.createElement(
              'span',
              { key: 'by' },
              creatorAvatarUrl ? React.createElement('img', { key: 'avatar', src: creatorAvatarUrl, alt: creatorName }) : null,
              `${byLabel} `,
              React.createElement('span', { key: 'name' }, creatorName)
            )
          : null,
        bottomPill,
        hoverActions
      ),

    dclColors: {
      base: { primary: '#ff2d55', primaryDark1: '#e6284c' },
      neutral: { softWhite: '#fcfcfc', gray5: '#ecebed', gray3: '#a09ba8', softBlack1: '#161518', white: '#ffffff' }
    }
  }
})

// Enter/Space activation is no longer this component's: the shared card attaches
// role, tabIndex and its own keydown handler whenever it gets an onClick, which
// is why the local handler went away and no keyboard test lives here.
//
// The shared card is the element carrying the props this component hands down;
// role="button" alone is ambiguous because the JUMP IN CTA is one too.
function sharedCard(): HTMLElement {
  const card = screen.getByText('Wonder Museum').closest('[data-disable-hover]')
  if (!card) throw new Error('shared card not rendered')
  return card as HTMLElement
}

function createPlace(overrides: Partial<DiscoverPlace> = {}): DiscoverPlace {
  return {
    id: 'featured-1',
    title: 'Wonder Museum',
    description: 'A curated art space',
    image: 'https://example.com/cover.png',
    positions: ['12,34'],
    base_position: '12,34',
    owner: '0xabc',
    contact_name: 'CuratorName',
    categories: ['poi'],
    user_count: 0,
    ...overrides
  }
}

describe('FeaturedCard', () => {
  beforeEach(() => {
    mockUseGetProfileQuery.mockReturnValue({ data: undefined })
    // Off by default so every legacy assertion below keeps describing production.
    mockNewLayout.mockReturnValue(false)
    mockIsTouchWidth.mockReturnValue(false)
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

      expect(mockNavigate).toHaveBeenCalledWith('/places/place/12,34', { state: { place: expect.any(Object) } })
    })

    it('should navigate using the first parcel when base_position is missing', () => {
      render(<FeaturedCard place={createPlace({ base_position: undefined, positions: ['5,6'] })} />)

      fireEvent.click(screen.getByText('Wonder Museum'))

      expect(mockNavigate).toHaveBeenCalledWith('/places/place/5,6', { state: { place: expect.any(Object) } })
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

      expect(mockNavigate).toHaveBeenCalledWith('/places/world/artworld', { state: { place: expect.any(Object) } })
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

  describe('when handing the shared card its cover', () => {
    it('should pass a fallback color so a cover that 404s leaves a solid tile', () => {
      render(<FeaturedCard place={createPlace()} />)

      expect(sharedCard()).toHaveAttribute('data-image-fallback', '#2a2435')
    })

    it('should hand over the place cover as the card image', () => {
      render(<FeaturedCard place={createPlace()} />)

      expect(screen.getByTestId('cover')).toHaveAttribute('src', 'https://example.com/cover.png')
    })

    it('should withhold the cover when the place only has the map placeholder', () => {
      render(<FeaturedCard place={createPlace({ image: 'https://api.decentraland.org/v2/map.png?center=1,2' })} />)

      expect(screen.queryByTestId('cover')).not.toBeInTheDocument()
    })

    it('should pass the deterministic avatar background through (ADR-292)', () => {
      render(<FeaturedCard place={createPlace()} />)

      // usePlaceOwnerAvatar derives it from the name, so identity hue matches in-world.
      expect(sharedCard().getAttribute('data-avatar-bg')).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should keep the hover lift on pointer widths', () => {
      render(<FeaturedCard place={createPlace()} />)

      expect(sharedCard()).toHaveAttribute('data-disable-hover', 'false')
    })

    it('should disable the hover lift on touch widths so it does not stick after a tap', () => {
      mockIsTouchWidth.mockReturnValue(true)
      render(<FeaturedCard place={createPlace()} />)

      expect(sharedCard()).toHaveAttribute('data-disable-hover', 'true')
    })
  })

  describe('when rendering the creator identity', () => {
    it('should render the by-line with the creator name and the coordinates', () => {
      render(<FeaturedCard place={createPlace()} />)

      expect(screen.getByText(/discover\.card\.by/)).toBeInTheDocument()
      expect(screen.getByText('CuratorName')).toBeInTheDocument()
      expect(screen.getByText('12,34')).toBeInTheDocument()
    })

    it('should render the owner face256 only when the scene names no contact', () => {
      mockUseGetProfileQuery.mockReturnValue({
        data: {
          avatars: [
            { name: 'LandOwner', hasClaimedName: false, avatar: { snapshots: { face256: 'https://peer.decentraland.org/face256.png' } } }
          ]
        }
      })
      render(<FeaturedCard place={createPlace({ contact_name: undefined })} />)

      expect(screen.getByAltText('LandOwner')).toHaveAttribute('src', 'https://peer.decentraland.org/face256.png')
    })

    it('should NOT put the land owner face next to a contact name', () => {
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ name: 'LandOwner', hasClaimedName: true, avatar: { snapshots: { face256: 'https://peer/face.png' } } }] }
      })
      render(<FeaturedCard place={createPlace()} />)

      expect(screen.getByText('CuratorName')).toBeInTheDocument()
      expect(screen.queryByText('LandOwner')).not.toBeInTheDocument()
      expect(screen.getByAltText('CuratorName').getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    })

    it('should skip the profile request and use a synthetic avatar when there is no owner', () => {
      render(<FeaturedCard place={createPlace({ owner: null })} />)

      expect(mockUseGetProfileQuery).toHaveBeenCalledWith(undefined, { skip: true })
      expect(screen.getByAltText('CuratorName').getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    })

    it('should render no by-line when the place has no creator name', () => {
      render(<FeaturedCard place={createPlace({ contact_name: undefined, owner: null })} />)

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

  describe('when the new layout is on', () => {
    beforeEach(() => {
      mockNewLayout.mockReturnValue(true)
    })

    it('should show LIVE for a featured scene hosting an event with nobody in it yet', () => {
      render(<FeaturedCard place={createPlace({ user_count: 0, live: true })} />)

      expect(screen.getByText('LIVE')).toBeInTheDocument()
    })

    it('should stay badge-free when no event is running', () => {
      render(<FeaturedCard place={createPlace({ live: false })} />)

      expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
    })
  })
})
