import { skipToken } from '@reduxjs/toolkit/query/react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { DiscoverPlace } from '../../features/discover'
import { SegmentEvent } from '../../modules/segment.types'
import { DiscoverHomePage } from './DiscoverHomePage'

const mockNavigate = jest.fn()
const mockTrack = jest.fn()
const mockUseAuthIdentity = jest.fn()
const mockUseAdvancedUserAgentData = jest.fn()
const mockUsePageViewTracking = jest.fn()
const mockDestinationsQuery = jest.fn()
const mockFavoritesQuery = jest.fn()
// Repetition ON is what production shipped before the flag existed, so it is the default here.
const mockRepeat = jest.fn()
const mockLiveMinUsers = jest.fn()
const mockHideFeatured = jest.fn()

jest.mock('react-helmet-async', () => ({
  Helmet: () => null
}))

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

jest.mock('@dcl/hooks', () => ({
  useAdvancedUserAgentData: () => mockUseAdvancedUserAgentData()
}))

// The barrel re-exports the RTK Query clients (import.meta env access Jest
// can't parse); keep the pure helpers real and stub only the query hooks.
jest.mock('../../features/discover', () => ({
  ...jest.requireActual('../../features/discover/discover.helpers'),
  useGetDiscoverDestinationsQuery: (...args: unknown[]) => mockDestinationsQuery(...args),
  useGetDiscoverFavoritesQuery: (...args: unknown[]) => mockFavoritesQuery(...args)
}))

jest.mock('../../features/discover/discover.flags', () => ({
  useRepeatAcrossSections: () => mockRepeat(),
  useLiveMinUsers: () => mockLiveMinUsers(),
  useHideFeaturedPlaces: () => mockHideFeatured()
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null) => id ?? ''
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => mockUseAuthIdentity()
}))

jest.mock('../../hooks/usePageViewTracking', () => ({
  usePageViewTracking: (...args: unknown[]) => mockUsePageViewTracking(...args)
}))

jest.mock('../../hooks/useDeferredTrack', () => ({
  useDeferredTrack: () => mockTrack
}))

// Card stubs — the real cards have their own specs; here they only need to
// surface the title and forward the empty-click contract.
jest.mock('../../components/discover/LiveEventCard', () => ({
  LiveEventCard: ({ place }: { place: DiscoverPlace }) => <div data-testid="live-card">{place.title}</div>
}))
jest.mock('../../components/discover/FeaturedCard', () => ({
  FeaturedCard: ({ place, onEmptyClick }: { place: DiscoverPlace; onEmptyClick?: (p: DiscoverPlace) => void }) => (
    <div data-testid="featured-card" data-users={place.user_count ?? ''}>
      <button type="button" onClick={() => onEmptyClick?.(place)}>
        {place.title}
      </button>
    </div>
  )
}))
jest.mock('../../components/discover/PlaceCard', () => ({
  PlaceCard: ({ place, onEmptyClick }: { place: DiscoverPlace; onEmptyClick?: (p: DiscoverPlace) => void }) => (
    <div data-testid="place-card">
      <button type="button" onClick={() => onEmptyClick?.(place)}>
        {place.title}
      </button>
    </div>
  )
}))
jest.mock('../../components/discover/SceneJumpInModal', () => ({
  SceneJumpInModal: ({ place, onClose }: { place: DiscoverPlace; onClose: () => void }) => (
    <div role="dialog" aria-label={place.title}>
      <button type="button" onClick={onClose}>
        close-scene-modal
      </button>
    </div>
  )
}))

// Run the real styled files through the shared styled shim. MUI Select /
// Drawer / TextField drive the toolbar interactivity, so `styled(Component)`
// must render the (stubbed) component itself — the shim's plain-div output
// can't emit change events — while still executing every style callback.
jest.mock('decentraland-ui2', () => {
  const react = jest.requireActual<typeof import('react')>('react')
  const actual = jest.requireActual('../../__test-utils__/styledMock')

  const styled = (tag: string | React.ComponentType<Record<string, unknown>>, options?: { shouldForwardProp?: (p: string) => boolean }) => {
    const passthroughFactory = actual.styled(typeof tag === 'string' ? tag : 'div', options)
    return (style: unknown) => {
      const Passthrough = passthroughFactory(style)
      if (typeof tag === 'string') return Passthrough
      const Wrapped = react.forwardRef<unknown, Record<string, unknown>>((props, ref) => react.createElement(tag, { ...props, ref }))
      Wrapped.displayName = 'StyledWrapperMock'
      return Wrapped
    }
  }

  const Select = (props: {
    children?: React.ReactNode
    value?: unknown
    onChange?: React.ChangeEventHandler<HTMLSelectElement>
    'aria-label'?: string
  }) => (
    <select value={String(props.value)} onChange={props.onChange} aria-label={props['aria-label']}>
      {props.children}
    </select>
  )

  return {
    ...actual,
    styled,
    useTheme: () => ({ breakpoints: { up: () => '(min-width:0px)' } }),
    useMediaQuery: () => false,
    Typography: actual.Box,
    Select,
    MenuItem: ({ value, children }: { value?: unknown; children?: React.ReactNode }) => <option value={String(value)}>{children}</option>,
    Drawer: ({ open, onClose, children }: { open?: boolean; onClose?: () => void; children?: React.ReactNode }) =>
      open ? (
        <div role="dialog">
          <button type="button" aria-label="drawer-backdrop" onClick={onClose} />
          {children}
        </div>
      ) : null,
    IconButton: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <button type="button" {...rest}>
        {children}
      </button>
    ),
    TextField: (props: {
      value?: string
      onChange?: React.ChangeEventHandler<HTMLInputElement>
      placeholder?: string
      autoComplete?: string
    }) => <input value={props.value} onChange={props.onChange} placeholder={props.placeholder} autoComplete={props.autoComplete} />,
    InputAdornment: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    CircularProgress: () => <div role="progressbar" />,
    dclColors: {
      base: { primary: '#ff2d55', primaryDark1: '#e6284c' },
      neutral: {
        softWhite: '#fcfcfc',
        gray1: '#43404a',
        gray3: '#a09ba8',
        gray4: '#cfcdd4',
        gray5: '#ecebed',
        softBlack1: '#161518',
        softBlack2: '#242129',
        trueWhite: '#ffffff',
        white: '#ffffff'
      },
      blackTransparent: { backdrop: 'rgba(0,0,0,0.6)', blurry: 'rgba(0,0,0,0.4)' },
      whiteTransparent: { blurry: 'rgba(255,255,255,0.2)', subtle: 'rgba(255,255,255,0.1)' }
    }
  }
})

function createPlace(overrides: Partial<DiscoverPlace> = {}): DiscoverPlace {
  return {
    id: 'p-1',
    title: 'Some Place',
    description: 'a described place',
    image: 'https://img.test/x.png',
    positions: ['0,0'],
    base_position: '0,0',
    owner: '0xowner',
    contact_name: 'Creator',
    ...overrides
  }
}

interface QueryState<T> {
  data: T | undefined
  isLoading: boolean
  isError?: boolean
  refetch?: () => void
}

describe('DiscoverHomePage', () => {
  let intersectionCallback: IntersectionObserverCallback | undefined
  let browseDestinations: QueryState<{ ok: boolean; total: number; data: DiscoverPlace[] }>
  let featuredPlaces: QueryState<{ ok: boolean; total: number; data: DiscoverPlace[] }>
  let liveFeed: QueryState<{ ok: boolean; total: number; data: DiscoverPlace[] }>
  let myDestinations: QueryState<{ ok: boolean; total: number; data: DiscoverPlace[] }>
  let favorites: QueryState<{ ok: boolean; total: number; data: DiscoverPlace[] }>

  beforeEach(() => {
    browseDestinations = {
      data: {
        ok: true,
        total: 3,
        data: [
          createPlace({ id: 'quiet-1', title: 'Quiet Gallery', positions: ['30,30'], base_position: '30,30' }),
          createPlace({ id: 'road-1', title: 'interactive-text test deploy', positions: ['40,40'], base_position: '40,40' }),
          createPlace({ id: 'quiet-w', title: 'Quiet World', world: true, world_name: 'QuietWorld' })
        ]
      },
      isLoading: false
    }
    featuredPlaces = {
      data: {
        ok: true,
        total: 1,
        data: [createPlace({ id: 'feat-1', title: 'Featured Museum', highlighted: true, positions: ['60,60'], base_position: '60,60' })]
      },
      isLoading: false
    }
    // The Live Now rail's own page of the feed (`limit: LIVE_FEED_LIMIT`). Served out of head-count
    // order on purpose: the rail has to sort it, and a fixture already sorted would pass without.
    liveFeed = {
      data: {
        ok: true,
        total: 4,
        data: [
          createPlace({ id: 'w-alice', title: 'Alice World', world: true, world_name: 'AliceWorld', positions: [], user_count: 8 }),
          createPlace({ id: 'live-a', title: 'Live Plaza', positions: ['0,0', '0,1'], base_position: '0,0', user_count: 9 }),
          createPlace({ id: 'w-ghost', title: 'GhostWorld', world: true, world_name: 'GhostWorld', positions: [], user_count: 6 }),
          createPlace({ id: 'live-b', title: 'Live Beach', positions: ['5,5'], base_position: '5,5', user_count: 7 })
        ]
      },
      isLoading: false
    }
    myDestinations = { data: { ok: true, total: 0, data: [] }, isLoading: false }
    favorites = { data: undefined, isLoading: false }

    mockDestinationsQuery.mockImplementation((args: unknown) => {
      if (args === skipToken) return { data: undefined, isLoading: false }
      const a = args as { only_highlighted?: boolean; owner?: string; limit?: number }
      if (a.only_highlighted) return featuredPlaces
      if (a.owner) return myDestinations
      // The rail and the grid are different cache entries (different `limit`); keying the stub the
      // same way is what lets a test notice the rail reading the wrong one.
      if (a.limit === 40) return liveFeed
      return browseDestinations
    })
    mockFavoritesQuery.mockImplementation((args: unknown) => (args === skipToken ? { data: undefined, isLoading: false } : favorites))
    mockUseAuthIdentity.mockReturnValue({ identity: undefined, hasValidIdentity: false, address: undefined })
    mockUseAdvancedUserAgentData.mockReturnValue([false, { mobile: false }])
    mockRepeat.mockReturnValue(true)
    mockLiveMinUsers.mockReturnValue(1)
    mockHideFeatured.mockReturnValue(false)
    // jsdom has no IntersectionObserver — capture the sentinel callback so the
    // pagination test can fire it manually.
    intersectionCallback = undefined
    window.IntersectionObserver = jest.fn((cb: IntersectionObserverCallback) => {
      intersectionCallback = cb
      return { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() } as unknown as IntersectionObserver
    }) as unknown as typeof IntersectionObserver
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the first paint is still loading', () => {
    beforeEach(() => {
      browseDestinations = { data: undefined, isLoading: true }
    })

    it('should render only the centered spinner', () => {
      render(<DiscoverHomePage />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.queryByText('discover.live.heading')).not.toBeInTheDocument()
    })
  })

  describe('when the default explore view renders', () => {
    it('should render the Live Now rail from the destinations feed, busiest first', () => {
      render(<DiscoverHomePage />)

      expect(screen.getByText('discover.live.heading')).toBeInTheDocument()
      const liveTitles = screen.getAllByTestId('live-card').map(card => card.textContent)
      // Sorted by presence: 9, 8, 7, 6. Places and worlds come from the one feed.
      expect(liveTitles).toEqual(['Live Plaza', 'Alice World', 'Live Beach', 'GhostWorld'])
    })

    it('should render the Featured rail from the curated highlighted set', () => {
      render(<DiscoverHomePage />)

      expect(screen.getByText('discover.explore.section.featured')).toBeInTheDocument()
      expect(within(screen.getByTestId('featured-card')).getByText('Featured Museum')).toBeInTheDocument()
    })

    it('should include highlighted worlds in the Featured rail AND repeat them in the grid', () => {
      const towerOfMadness = createPlace({
        id: 'fw-1',
        title: 'Tower of Madness',
        highlighted: true,
        world: true,
        world_name: 'towerofmadness.dcl.eth'
      })
      featuredPlaces = { data: { ok: true, total: 1, data: [towerOfMadness] }, isLoading: false }
      browseDestinations = {
        data: {
          ok: true,
          total: 2,
          data: [
            towerOfMadness,
            createPlace({ id: 'fw-2', title: 'Plain World', highlighted: false, world: true, world_name: 'plain.dcl.eth' })
          ]
        },
        isLoading: false
      }
      render(<DiscoverHomePage />)

      const railTitles = screen.getAllByTestId('featured-card').map(card => card.textContent)
      expect(railTitles).toContain('Tower of Madness')
      expect(railTitles).not.toContain('Plain World')
      // The grid repeats EVERYTHING (a filtering user must find all scenes),
      // so featured entries appear in both places.
      const gridTitles = screen.getAllByTestId('place-card').map(card => card.textContent)
      expect(gridTitles).toContain('Tower of Madness')
      expect(gridTitles).toContain('Plain World')
    })

    it('should collapse the rail to two rows and expand every highlighted place behind the toggle', () => {
      featuredPlaces = {
        data: {
          ok: true,
          total: 10,
          data: Array.from({ length: 10 }, (_, i) =>
            createPlace({ id: `feat-${i}`, title: `Featured ${i}`, highlighted: true, positions: [`${i},9`], base_position: `${i},9` })
          )
        },
        isLoading: false
      }
      render(<DiscoverHomePage />)

      // Mocked media queries resolve to the single-column layout → 2 rows = 2 cards.
      expect(screen.getAllByTestId('featured-card')).toHaveLength(2)

      fireEvent.click(screen.getByRole('button', { name: 'discover.featured.view_all' }))
      expect(screen.getAllByTestId('featured-card')).toHaveLength(10)

      fireEvent.click(screen.getByRole('button', { name: 'discover.featured.view_less' }))
      expect(screen.getAllByTestId('featured-card')).toHaveLength(2)
    })

    it('should drop the whole section when the featured flag hides it', () => {
      mockHideFeatured.mockReturnValue(true)

      render(<DiscoverHomePage />)

      expect(screen.queryByText('discover.explore.section.featured')).not.toBeInTheDocument()
      expect(screen.queryAllByTestId('featured-card')).toHaveLength(0)
    })

    it('should skip the featured request entirely while the section is hidden', () => {
      mockHideFeatured.mockReturnValue(true)

      render(<DiscoverHomePage />)

      expect(mockDestinationsQuery).not.toHaveBeenCalledWith(expect.objectContaining({ only_highlighted: true }), expect.anything())
    })

    describe('and a curated place also sits in the browse feed', () => {
      beforeEach(() => {
        // /destinations returns `highlighted DESC` first, so the curated set is
        // at the head of the same feed the grid reads.
        const curated = createPlace({ id: 'cur-1', title: 'Curated Pick', highlighted: true })
        featuredPlaces = { data: { ok: true, total: 1, data: [curated] }, isLoading: false }
        browseDestinations = {
          data: { ok: true, total: 2, data: [curated, createPlace({ id: 'plain-1', title: 'Plain Place' })] },
          isLoading: false
        }
      })

      it('should leave it in the explore grid when the section is hidden', () => {
        // The two flags are independent: dedupe subtracts whatever the rails
        // rendered, and with no rail there is nothing to subtract.
        mockRepeat.mockReturnValue(false)
        mockHideFeatured.mockReturnValue(true)

        render(<DiscoverHomePage />)

        expect(screen.getAllByTestId('place-card').map(card => card.textContent)).toEqual(
          expect.arrayContaining([expect.stringContaining('Curated Pick')])
        )
      })

      it('should subtract it from the grid while the section is shown', () => {
        mockRepeat.mockReturnValue(false)
        mockHideFeatured.mockReturnValue(false)

        render(<DiscoverHomePage />)

        expect(screen.getAllByTestId('place-card').map(card => card.textContent)).not.toEqual(
          expect.arrayContaining([expect.stringContaining('Curated Pick')])
        )
      })

      it('should repeat it in both places while repetition is on, hidden or not', () => {
        mockRepeat.mockReturnValue(true)
        mockHideFeatured.mockReturnValue(false)

        render(<DiscoverHomePage />)

        expect(screen.getAllByTestId('featured-card').map(c => c.textContent)).toEqual(
          expect.arrayContaining([expect.stringContaining('Curated Pick')])
        )
        expect(screen.getAllByTestId('place-card').map(c => c.textContent)).toEqual(
          expect.arrayContaining([expect.stringContaining('Curated Pick')])
        )
      })
    })

    it('should not render the toggle when the curated set fits in two rows', () => {
      render(<DiscoverHomePage />)

      expect(screen.queryByRole('button', { name: 'discover.featured.view_all' })).not.toBeInTheDocument()
    })

    it('should render the explore grid without junk listings', () => {
      render(<DiscoverHomePage />)

      const gridTitles = screen.getAllByTestId('place-card').map(card => card.textContent)
      expect(gridTitles).toContain('Quiet Gallery')
      expect(gridTitles).toContain('Quiet World')
      expect(gridTitles).not.toContain('interactive-text test deploy')
    })

    it('should fire the discover page view through the tracking-exempt hook', () => {
      render(<DiscoverHomePage />)

      expect(mockUsePageViewTracking).toHaveBeenCalledWith({ name: 'discover.home.page_title' })
    })
  })

  describe('when the category filter changes on desktop', () => {
    it('should track the filter and collapse the curated rails', () => {
      render(<DiscoverHomePage />)

      fireEvent.change(screen.getByRole('combobox', { name: 'discover.explore.category.all' }), { target: { value: 'art' } })

      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.DISCOVER_FILTER_CATEGORY, { category: 'art' })
      expect(screen.queryByText('discover.live.heading')).not.toBeInTheDocument()
      expect(mockDestinationsQuery).toHaveBeenCalledWith(expect.objectContaining({ categories: ['art'] }))
    })
  })

  describe('when the user types into the search field', () => {
    it('should query the server with the term and hide the rails', () => {
      render(<DiscoverHomePage />)

      fireEvent.change(screen.getByPlaceholderText('discover.explore.search_placeholder'), { target: { value: 'gallery' } })

      expect(mockDestinationsQuery).toHaveBeenCalledWith(expect.objectContaining({ search: 'gallery' }))
      expect(screen.queryByText('discover.live.heading')).not.toBeInTheDocument()
    })

    it('should disable browser autofill so the saved-searches dropdown cannot repaint the bar (#721)', () => {
      render(<DiscoverHomePage />)

      expect(screen.getByPlaceholderText('discover.explore.search_placeholder')).toHaveAttribute('autocomplete', 'off')
    })
  })

  describe('when the mobile filter drawer is used', () => {
    it('should open on the filter button and close from its header button', () => {
      render(<DiscoverHomePage />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.explore.filters' }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.close' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should close when the backdrop asks for dismissal', () => {
      render(<DiscoverHomePage />)
      fireEvent.click(screen.getByRole('button', { name: 'discover.explore.filters' }))

      fireEvent.click(screen.getByRole('button', { name: 'drawer-backdrop' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should track category changes made inside the drawer', () => {
      render(<DiscoverHomePage />)
      fireEvent.click(screen.getByRole('button', { name: 'discover.explore.filters' }))

      const drawer = screen.getByRole('dialog')
      fireEvent.change(within(drawer).getByRole('combobox', { name: 'discover.explore.category.all' }), { target: { value: 'music' } })

      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.DISCOVER_FILTER_CATEGORY, { category: 'music' })
    })
  })

  describe('when active-filter chips are visible', () => {
    it('should clear the category back to all from its chip', () => {
      render(<DiscoverHomePage />)
      fireEvent.change(screen.getByRole('combobox', { name: 'discover.explore.category.all' }), { target: { value: 'art' } })

      fireEvent.click(screen.getByRole('button', { name: 'discover.explore.remove_filter' }))

      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.DISCOVER_FILTER_CATEGORY, { category: 'all' })
      // Rails come back once the category filter is dropped.
      expect(screen.getByText('discover.live.heading')).toBeInTheDocument()
    })
  })

  describe('when an empty scene card is clicked', () => {
    it('should open the JUMP IN modal in place on desktop and close it again', () => {
      render(<DiscoverHomePage />)

      fireEvent.click(screen.getByRole('button', { name: 'Quiet Gallery' }))
      expect(screen.getByRole('dialog', { name: 'Quiet Gallery' })).toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalled()

      fireEvent.click(screen.getByRole('button', { name: 'close-scene-modal' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should navigate to the scene route instead on mobile', () => {
      mockUseAdvancedUserAgentData.mockReturnValue([false, { mobile: true }])
      render(<DiscoverHomePage />)

      fireEvent.click(screen.getByRole('button', { name: 'Quiet Gallery' }))

      expect(mockNavigate).toHaveBeenCalledWith('/places/place/30,30', { state: { place: expect.objectContaining({ id: 'quiet-1' }) } })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('when the Live Now carousel scrolls on mobile', () => {
    let scrollIntoView: jest.Mock

    beforeEach(() => {
      // The dots are named after the rail's places; keep those places out of the grid so the name
      // resolves to the dot alone.
      mockRepeat.mockReturnValue(false)
      scrollIntoView = jest.fn()
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
    })

    it('should mark the dot of the nearest snapped slide as current', () => {
      render(<DiscoverHomePage />)

      const rail = screen.getAllByTestId('live-card')[0].parentElement?.parentElement as HTMLElement
      const slides = Array.from(rail.children) as HTMLElement[]
      slides.forEach((slide, i) => {
        Object.defineProperty(slide, 'offsetLeft', { configurable: true, value: i * 400 })
        Object.defineProperty(slide, 'offsetWidth', { configurable: true, value: 400 })
      })
      Object.defineProperty(rail, 'clientWidth', { configurable: true, value: 400 })
      rail.scrollLeft = 800

      fireEvent.scroll(rail)

      expect(screen.getByRole('button', { name: 'Live Beach' })).toHaveAttribute('aria-current', 'true')
      expect(screen.getByRole('button', { name: 'Live Plaza' })).toHaveAttribute('aria-current', 'false')
    })

    it('should smooth-scroll to the slide whose dot is clicked', () => {
      render(<DiscoverHomePage />)

      fireEvent.click(screen.getByRole('button', { name: 'GhostWorld' }))

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    })
  })

  describe('when the Favourites tab is selected', () => {
    it('should ask signed-out visitors to sign in', () => {
      render(<DiscoverHomePage />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.explore.tab.favourites' }))

      expect(screen.getByText('discover.explore.signin_favourites')).toBeInTheDocument()
      expect(mockFavoritesQuery).toHaveBeenCalledWith(skipToken)
    })

    describe('and the visitor is signed in', () => {
      beforeEach(() => {
        mockUseAuthIdentity.mockReturnValue({ identity: {}, hasValidIdentity: true, address: '0xAbC' })
      })

      it('should render the favourite places from the signed query', () => {
        favorites = { data: { ok: true, total: 1, data: [createPlace({ id: 'fav-1', title: 'Saved Spot' })] }, isLoading: false }
        render(<DiscoverHomePage />)

        fireEvent.click(screen.getByRole('button', { name: 'discover.explore.tab.favourites' }))

        expect(mockFavoritesQuery).toHaveBeenCalledWith({ address: '0xAbC' })
        expect(screen.getByRole('button', { name: 'Saved Spot' })).toBeInTheDocument()
      })

      it('should show the empty-favourites message when nothing is saved', () => {
        favorites = { data: { ok: true, total: 0, data: [] }, isLoading: false }
        render(<DiscoverHomePage />)

        fireEvent.click(screen.getByRole('button', { name: 'discover.explore.tab.favourites' }))

        expect(screen.getByText('discover.explore.empty_favourites')).toBeInTheDocument()
      })

      it('should show a spinner while the favourites resolve', () => {
        favorites = { data: undefined, isLoading: true }
        render(<DiscoverHomePage />)

        fireEvent.click(screen.getByRole('button', { name: 'discover.explore.tab.favourites' }))

        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      })
    })
  })

  describe('when switching between tabs', () => {
    it('should keep the curated rails visible on the signed-in tabs', () => {
      render(<DiscoverHomePage />)
      fireEvent.click(screen.getByRole('button', { name: 'discover.explore.tab.favourites' }))
      expect(screen.getByText('discover.live.heading')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'discover.explore.tab.explore_all' }))

      expect(screen.getByText('discover.live.heading')).toBeInTheDocument()
      expect(screen.getAllByTestId('place-card').length).toBeGreaterThan(0)
    })

    it('should re-anchor the toolbar when a tab switch pushes it down the viewport (#720)', () => {
      // Simulate the shrunk-page clamp pushing the toolbar well below the navbar.
      const rectSpy = jest
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue({ top: 500, bottom: 540, left: 0, right: 0, width: 0, height: 40, x: 0, y: 500, toJSON: () => ({}) })
      const scrollIntoView = jest.fn()
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
      render(<DiscoverHomePage />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.explore.tab.favourites' }))

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
      rectSpy.mockRestore()
    })

    it('should not scroll when the toolbar is already comfortably in place', () => {
      const rectSpy = jest
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue({ top: 20, bottom: 60, left: 0, right: 0, width: 0, height: 40, x: 0, y: 20, toJSON: () => ({}) })
      const scrollIntoView = jest.fn()
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
      render(<DiscoverHomePage />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.explore.tab.favourites' }))

      expect(scrollIntoView).not.toHaveBeenCalled()
      rectSpy.mockRestore()
    })

    it('should not scroll on the initial render (no tab interaction yet)', () => {
      const scrollIntoView = jest.fn()
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
      render(<DiscoverHomePage />)

      expect(scrollIntoView).not.toHaveBeenCalled()
    })
  })

  describe('when the My Places tab is selected', () => {
    it('should ask signed-out visitors to sign in', () => {
      render(<DiscoverHomePage />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.explore.tab.my_places' }))

      expect(screen.getByText('discover.explore.signin_my_places')).toBeInTheDocument()
    })

    describe('and the visitor is signed in', () => {
      beforeEach(() => {
        mockUseAuthIdentity.mockReturnValue({ identity: {}, hasValidIdentity: true, address: '0xAbC' })
      })

      it('should list the wallet-owned destinations', () => {
        myDestinations = { data: { ok: true, total: 1, data: [createPlace({ id: 'mine-1', title: 'My Parcel' })] }, isLoading: false }
        render(<DiscoverHomePage />)

        fireEvent.click(screen.getByRole('button', { name: 'discover.explore.tab.my_places' }))

        expect(mockDestinationsQuery).toHaveBeenCalledWith(expect.objectContaining({ owner: '0xAbC' }))
        expect(screen.getByRole('button', { name: 'My Parcel' })).toBeInTheDocument()
      })

      it('should query owned destinations without any order params (/destinations ignores them)', () => {
        render(<DiscoverHomePage />)

        fireEvent.click(screen.getByRole('button', { name: 'discover.explore.tab.my_places' }))

        expect(mockDestinationsQuery).toHaveBeenCalledWith({ owner: '0xAbC' })
      })

      it('should show the empty state for wallets with no places', () => {
        render(<DiscoverHomePage />)

        fireEvent.click(screen.getByRole('button', { name: 'discover.explore.tab.my_places' }))

        expect(screen.getByText('discover.explore.empty_my_places')).toBeInTheDocument()
      })
    })
  })

  describe('when the explore sentinel enters the viewport', () => {
    it('should fetch the next /destinations page and reset to page one on filter change', () => {
      browseDestinations = {
        data: { ok: true, total: 96, data: [createPlace({ id: 'p-0', title: 'Quiet Gallery' })] },
        isLoading: false
      }
      render(<DiscoverHomePage />)

      expect(mockDestinationsQuery).toHaveBeenCalledWith(expect.objectContaining({ offset: 0, limit: 48 }))

      act(() => {
        intersectionCallback?.([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver)
      })
      expect(mockDestinationsQuery).toHaveBeenCalledWith(expect.objectContaining({ offset: 48 }))

      // Changing the search filter starts over at offset 0 for the new set.
      fireEvent.change(screen.getByPlaceholderText('discover.explore.search_placeholder'), { target: { value: 'gallery' } })
      expect(mockDestinationsQuery).toHaveBeenCalledWith(expect.objectContaining({ offset: 0, search: 'gallery' }))
    })
  })

  describe('when the browse query fails', () => {
    it('should show a retryable error state instead of the misleading empty copy', () => {
      const refetch = jest.fn()
      browseDestinations = { data: undefined, isLoading: false, isError: true, refetch }
      render(<DiscoverHomePage />)

      expect(screen.getByText('discover.explore.error')).toBeInTheDocument()
      expect(screen.queryByText('discover.explore.empty')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'discover.explore.retry' }))
      expect(refetch).toHaveBeenCalled()
    })
  })

  describe('when the same place lands in the live rail, in featured and in the browse feed', () => {
    beforeEach(() => {
      featuredPlaces = {
        data: {
          ok: true,
          total: 2,
          data: [
            createPlace({ id: 'live-a', title: 'Live Plaza', highlighted: true, positions: ['0,0'], base_position: '0,0' }),
            createPlace({ id: 'feat-1', title: 'Featured Museum', highlighted: true, positions: ['60,60'], base_position: '60,60' })
          ]
        },
        isLoading: false
      }
      browseDestinations = {
        data: {
          ok: true,
          total: 3,
          data: [
            // The rail reads presence straight off this feed, so the head count lives here.
            createPlace({ id: 'live-a', title: 'Live Plaza', positions: ['0,0'], base_position: '0,0', user_count: 9 }),
            createPlace({ id: 'feat-1', title: 'Featured Museum', positions: ['60,60'], base_position: '60,60' }),
            createPlace({ id: 'quiet-1', title: 'Quiet Gallery', positions: ['30,30'], base_position: '30,30' })
          ]
        },
        isLoading: false
      }
    })

    const titles = (testId: string) => screen.getAllByTestId(testId).map(card => card.textContent)

    describe('and repetition is on', () => {
      it('should ask the feed for live events on every request', () => {
        render(<DiscoverHomePage />)

        const argsSent = mockDestinationsQuery.mock.calls.map(call => call[0]).filter(a => a !== skipToken)
        expect(argsSent.length).toBeGreaterThan(0)
        argsSent.forEach(a => expect(a).toHaveProperty('with_live_events', true))
      })

      it('should render the same card in all three sections', () => {
        render(<DiscoverHomePage />)

        expect(titles('live-card')).toContain('Live Plaza')
        expect(titles('featured-card')).toContain('Live Plaza')
        expect(titles('place-card')).toContain('Live Plaza')
      })

      it('should repeat the featured places at the head of the grid', () => {
        render(<DiscoverHomePage />)

        expect(titles('place-card')).toContain('Featured Museum')
      })
    })

    describe('and repetition is off', () => {
      beforeEach(() => {
        mockRepeat.mockReturnValue(false)
      })

      it('should keep a busy featured place only in the live rail', () => {
        render(<DiscoverHomePage />)

        expect(titles('live-card')).toContain('Live Plaza')
        expect(titles('featured-card')).not.toContain('Live Plaza')
        expect(titles('place-card')).not.toContain('Live Plaza')
      })

      it('should drop the featured places from the grid but keep the featured rail', () => {
        render(<DiscoverHomePage />)

        expect(titles('featured-card')).toContain('Featured Museum')
        expect(titles('place-card')).not.toContain('Featured Museum')
      })

      it('should still render a place that only exists in the grid', () => {
        render(<DiscoverHomePage />)

        expect(titles('place-card')).toContain('Quiet Gallery')
      })

      it('should stop hiding anything once a search collapses the rails', () => {
        render(<DiscoverHomePage />)

        fireEvent.change(screen.getByPlaceholderText('discover.explore.search_placeholder'), { target: { value: 'plaza' } })

        expect(screen.queryByText('discover.live.heading')).not.toBeInTheDocument()
        expect(titles('place-card')).toContain('Live Plaza')
        expect(titles('place-card')).toContain('Featured Museum')
      })
    })
  })

  describe('when the LIVE section is built from the feed', () => {
    beforeEach(() => {
      mockRepeat.mockReturnValue(false)
      featuredPlaces = { data: { ok: true, total: 0, data: [] }, isLoading: false }
      // The rail reads its own page of the feed and the grid reads the paginated one; both see
      // the same six rows here, so the rail's cut and the grid's subtraction can be asserted together.
      const rows = [
        createPlace({ id: 'b-20', title: 'Twenty', positions: ['1,1'], base_position: '1,1', user_count: 20 }),
        createPlace({ id: 'b-5', title: 'Five', positions: ['2,2'], base_position: '2,2', user_count: 5 }),
        createPlace({ id: 'b-4', title: 'Four', positions: ['3,3'], base_position: '3,3', user_count: 4 }),
        createPlace({ id: 'b-2', title: 'Two', positions: ['4,4'], base_position: '4,4', user_count: 2 }),
        createPlace({ id: 'b-1', title: 'One', positions: ['5,5'], base_position: '5,5', user_count: 1 }),
        createPlace({ id: 'b-0', title: 'Nobody', positions: ['6,6'], base_position: '6,6', user_count: 0 })
      ]
      liveFeed = { data: { ok: true, total: rows.length, data: rows }, isLoading: false }
      browseDestinations = { data: { ok: true, total: rows.length, data: rows }, isLoading: false }
    })

    const titles = (testId: string) => screen.getAllByTestId(testId).map(card => card.textContent)

    it('should rank the four busiest scenes by head count', () => {
      render(<DiscoverHomePage />)

      expect(titles('live-card')).toEqual(['Twenty', 'Five', 'Four', 'Two'])
    })

    it('should admit a scene with a single person by default', () => {
      const quiet = liveFeed.data!.data.filter(p => (p.user_count ?? 0) <= 1)
      liveFeed.data!.data = quiet
      browseDestinations.data!.data = quiet

      render(<DiscoverHomePage />)

      expect(titles('live-card')).toEqual(['One'])
    })

    it('should raise the cut to whatever the flag variant says', () => {
      mockLiveMinUsers.mockReturnValue(5)

      render(<DiscoverHomePage />)

      expect(titles('live-card')).toEqual(['Twenty', 'Five'])
      // The scenes below the cut are not lost: they stay in the grid.
      expect(titles('place-card')).toEqual(expect.arrayContaining(['Four', 'Two', 'One']))
    })

    it('should leave empty scenes out of the section while the cut is at least one', () => {
      render(<DiscoverHomePage />)

      expect(titles('live-card')).not.toContain('Nobody')
    })

    it('should admit empty scenes when the cut is zero, so the rail never goes blank', () => {
      mockLiveMinUsers.mockReturnValue(0)
      liveFeed.data!.data = liveFeed.data!.data.filter(p => (p.user_count ?? 0) <= 1)

      render(<DiscoverHomePage />)

      expect(titles('live-card')).toEqual(['One', 'Nobody'])
    })

    it('should keep the promoted scenes out of the grid, in the order the feed returned', () => {
      render(<DiscoverHomePage />)

      expect(titles('place-card')).toEqual(['One', 'Nobody'])
    })

    it("should keep the API's head count on a featured card the rail did not take", () => {
      featuredPlaces = {
        data: {
          ok: true,
          total: 1,
          data: [createPlace({ id: 'f-2', title: 'Two Here', highlighted: true, positions: ['9,9'], base_position: '9,9', user_count: 2 })]
        },
        isLoading: false
      }

      render(<DiscoverHomePage />)

      // 2 people, but the rail is already full with 20 / 5 / 4 / 2 — the legacy join would have
      // zeroed this to 0 because hot-scenes never saw it.
      expect(screen.getByTestId('featured-card')).toHaveAttribute('data-users', '2')
    })

    it('should give the LIVE section its own small feed read that refreshes on focus and reconnect', () => {
      render(<DiscoverHomePage />)

      expect(mockDestinationsQuery).toHaveBeenCalledWith(
        { limit: 40, order_by: 'most_active', with_realms_detail: true, with_live_events: true },
        expect.objectContaining({ refetchOnFocus: true, refetchOnReconnect: true })
      )
    })

    it('should refresh featured presence on focus and reconnect too', () => {
      render(<DiscoverHomePage />)

      expect(mockDestinationsQuery).toHaveBeenCalledWith(
        expect.objectContaining({ only_highlighted: true, with_realms_detail: true, with_live_events: true }),
        expect.objectContaining({ refetchOnFocus: true, refetchOnReconnect: true })
      )
    })

    it('should ask the feed for presence and live events in one request', () => {
      render(<DiscoverHomePage />)

      expect(mockDestinationsQuery).toHaveBeenCalledWith(
        expect.objectContaining({ order_by: 'most_active', with_realms_detail: true, with_live_events: true })
      )
    })
  })

  describe('when there is nothing to explore at all', () => {
    beforeEach(() => {
      browseDestinations = { data: { ok: true, total: 0, data: [] }, isLoading: false }
      featuredPlaces = { data: { ok: true, total: 0, data: [] }, isLoading: false }
    })

    it('should render the explore empty state', () => {
      render(<DiscoverHomePage />)

      expect(screen.getByText('discover.explore.empty')).toBeInTheDocument()
    })
  })
})
