/* eslint-disable @typescript-eslint/naming-convention -- places-api query args (with_realms_detail, only_highlighted, …) are snake_case */
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import type { SelectChangeEvent } from '@mui/material'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { CircularProgress, InputAdornment, MenuItem, dclColors } from 'decentraland-ui2'
import { CenteredBox } from '../../App.styled'
import { CardGrid, Empty, ErrorBox, ErrorText, PageContent, RetryButton } from '../../components/places/_shared'
import { LiveHeadingGlyph } from '../../components/places/_shared/CardIcons'
import { DiscoverSignInPrompt } from '../../components/places/_shared/DiscoverSignInPrompt'
import { BrowseGlyph, FavoriteGlyph, MyPlacesGlyph, SearchGlyph } from '../../components/places/_shared/ToolbarIcons'
import { LiveEventCard } from '../../components/places/LiveEventCard'
import { PlaceCard } from '../../components/places/PlaceCard'
import { SceneJumpInModal } from '../../components/places/SceneJumpInModal'
import {
  DISCOVER_CATEGORY_OPTIONS,
  FEATURED_CATEGORY,
  buildDetailPath,
  categoryQueryArgs,
  isHiddenFeaturedPlace,
  isHiddenPlace,
  parseCategoryParam,
  placePlayers,
  useGetDiscoverDestinationsQuery,
  useGetDiscoverFavoritesQuery
} from '../../features/discover'
import type { DiscoverCategoryFilter, DiscoverPlace, ExploreSection } from '../../features/discover'
import { useLiveMinUsers, useRepeatAcrossSections } from '../../features/discover/discover.flags'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useDeferredTrack } from '../../hooks/useDeferredTrack'
import { useInfiniteScrollSentinel } from '../../hooks/useInfiniteScrollSentinel'
import { usePageViewTracking } from '../../hooks/usePageViewTracking'
import { useRailEdges } from '../../hooks/useRailEdges'
import { SegmentEvent } from '../../modules/segment.types'
import {
  CarouselDot,
  CarouselDots,
  CarouselSlide,
  ChipCloseIcon,
  ControlsRow,
  DesktopFilters,
  DrawerCloseButton,
  DrawerHeader,
  DrawerSection,
  DrawerSectionLabel,
  DrawerSelect,
  DrawerTitle,
  ExploreBand,
  ExploreBandContent,
  ExploreToolbar,
  FilterButton,
  FilterChip,
  FilterChipsRow,
  FilterDrawer,
  FilterSelect,
  LiveGrid,
  LiveHeading,
  LiveNavButton,
  LiveNowSection,
  LiveRailLayer,
  LoadMoreSentinel,
  SearchSlot,
  TabPill,
  TabsRow,
  ToolbarSearchField
} from './DiscoverHomePage.styled'

// Unified /discover landing, matching the "Places - Desktop" Figma:
//   1. LIVE NOW      — glowing rounded rail with the 4 busiest scenes.
//   2. TOOLBAR       — Explore all / Favourites / My places tabs + search +
//                      the category dropdown (All, Featured, then the categories).
//   3. EXPLORE ALL   — the main grid: the /destinations feed as-is, deduped
//                      against the Live Now rail above.
// Searching collapses Live Now to the grid; a category leaves it in place. Favourites is a signed
// places-api read; My places lists the signed-in wallet's own places + worlds.
//
// NOTE: no periodic polling — the LIVE feed loads once per mount and only
// re-fetches when the tab regains focus or the connection returns, so the
// network stays quiet while the page is idle (30s polling removed on request).
const LIVE_REFRESH_OPTIONS = {
  refetchOnFocus: true,
  refetchOnReconnect: true
} as const

// One /destinations page feeds the whole grid (places + worlds mixed); the
// endpoint caps limit at 100 server-side.
const BROWSE_LIMIT = 48

// Live Now rail cap — the Figma shows one row of 4.
const LIVE_NOW_LIMIT = 4

// How many feed rows the LIVE section reads to find its top four. The feed puts every highlighted
// row first (22 today), so this must comfortably exceed that count or the busiest non-featured
// scene could fall off the end.
const LIVE_FEED_LIMIT = 40

// `?tab=favourites` / `?tab=my`, the param the signed-out prompts round-trip
// through SSO. Anything else opens the default tab.
function readSectionParam(tab: string | null): ExploreSection {
  return tab === 'favourites' || tab === 'my' ? tab : 'all'
}

function DiscoverHomePage() {
  const t = useFormatMessage()
  const [searchParams] = useSearchParams()

  // `/places/*` is in `isPageTrackingExempt`, so the Layout's route-level
  // `page()` is suppressed. Fire it from the page so Segment still records a
  // page view. Static name — no async data, so it fires immediately.
  usePageViewTracking({ name: t('discover.home.page_title') })

  // `useDeferredValue` keeps typing snappy while debouncing the actual filter pass.
  const [searchInput, setSearchInput] = useState('')
  // Infinite scroll: `browseOffset` walks the /destinations feed in
  // BROWSE_LIMIT pages; the endpoint's `merge` accumulates them into one cache
  // entry per filter set. Filter handlers reset it synchronously.
  const [browseOffset, setBrowseOffset] = useState(0)
  const search = useDeferredValue(searchInput.trim())
  const [activeCategory, setActiveCategory] = useState<DiscoverCategoryFilter>(() => parseCategoryParam(searchParams.get('category')))
  // Track filter changes for the DISCOVER analytics funnel. Single handlers so
  // every surface that changes them (desktop dropdowns, mobile drawer, chips)
  // emits the same event shape.
  const track = useDeferredTrack()
  const changeCategory = useCallback(
    (next: DiscoverCategoryFilter) => {
      track(SegmentEvent.DISCOVER_FILTER_CATEGORY, { category: next })
      setActiveCategory(next)
      // Reset pagination in the SAME commit — the effect below would lag one
      // render, letting a stale offset seed the new filter's cache entry.
      setBrowseOffset(0)
    },
    [track]
  )
  const changeSearch = useCallback((value: string) => {
    setSearchInput(value)
    setBrowseOffset(0)
  }, [])
  // Seeded once from `?tab=`, which is how the signed-out prompts get the user
  // back to the tab they were on. Read-only on purpose: the search box and the
  // category filter are component state too, and mirroring the tab into the URL
  // on every click would put three entries in the history for one glance.
  // `?category=` follows the same rule: it seeds the filter on mount only, so a client-side navigation
  // to /places?category=featured on an already-mounted page does not change it.
  const [section, setSection] = useState<ExploreSection>(() => readSectionParam(searchParams.get('tab')))
  // Switching tabs swaps the big Explore grid for the (often much shorter)
  // Favourites / My Places content, collapsing the page height — the browser
  // clamps the scroll and the toolbar drops down the viewport, so the user
  // appears to jump (#720). After a user-initiated switch, re-anchor the
  // toolbar under the navbar — but ONLY when the shrink actually pushed it well
  // below the navbar (or scrolled it out of view above), so a switch that
  // didn't move it (similar-height tabs) never scrolls. Honors reduced motion.
  const exploreBandRef = useRef<HTMLDivElement>(null)
  const hasSwitchedTab = useRef(false)
  const changeSection = useCallback((next: ExploreSection) => {
    hasSwitchedTab.current = true
    setSection(next)
  }, [])
  // Runs after paint (not layout) so the browser's shrink-driven scroll clamp
  // has already settled — otherwise the guard would read the pre-clamp position
  // and skip the very case it's meant to fix.
  useEffect(() => {
    if (!hasSwitchedTab.current) return
    const band = exploreBandRef.current
    if (!band) return
    const navClearance = window.innerWidth >= 900 ? 100 : 72
    const top = band.getBoundingClientRect().top
    if (top <= navClearance + 40 && top >= 0) return // already comfortably in place
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    band.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [section])
  // Mobile-only filter drawer (Category). Desktop shows it inline.
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { address, hasValidIdentity } = useAuthIdentity()

  // JUMP IN modal for empty scenes — on DESKTOP it opens in place over the grid
  // (the URL stays on /discover, per the Figma backdrop over the Places page).
  // On MOBILE there is no in-place modal: a card click navigates to the scene
  // route, which renders the full-page layout (Figma 2014-47995). Live cards
  // navigate on both.
  const navigate = useNavigate()
  const [, advancedUserAgent] = useAdvancedUserAgentData()
  const isMobile = Boolean(advancedUserAgent?.mobile)
  const [modalPlace, setModalPlace] = useState<DiscoverPlace | null>(null)
  const handleCardEmptyClick = useCallback(
    (place: DiscoverPlace) => {
      if (isMobile) {
        const path = buildDetailPath(place)
        if (path) navigate(path, { state: { place } })
        return
      }
      setModalPlace(place)
    },
    [isMobile, navigate]
  )

  // ── Flags ────────────────────────────────────────────────────────────
  // NOTE: the Live Now rail used to fall back to a three-service join (hot-scenes + /places +
  // worlds live-data) with a fixed 5-user cut whenever the repeat flag was off. Removed 2026-09-03:
  // the rail always reads the destinations feed below, the cut is `useLiveMinUsers()`, and the
  // repeat flag decides only whether a place may show in more than one section. That also flips the
  // default: the flag is absent from the file the store reads today, and absent now means "do not
  // repeat", where it used to mean "repeat", so the grid stops re-listing the rails on merge.
  const repeatAcrossSections = useRepeatAcrossSections()
  const liveMinUsers = useLiveMinUsers()

  // ── BROWSE queries ────────────────────────────────────────────────────
  // Server-side search/category against the destinations endpoint.
  // Different args from the LIVE feed → separate RTK Query cache entry.
  // `/destinations` serves places + worlds in one page. The grid asks for
  // `most_active` so scenes with people in them lead it, with curation as the
  // tie-breaker; My Places keeps the curated order.
  // Safety net for the DEFERRED search value landing after the synchronous
  // handler reset (changeSearch/changeCategory reset in the same commit).
  useEffect(() => {
    setBrowseOffset(0)
  }, [search, activeCategory])
  const browseArgs = useMemo(
    () => ({
      limit: BROWSE_LIMIT,
      offset: browseOffset,
      order_by: 'most_active' as const,
      search: search || undefined,
      ...categoryQueryArgs(activeCategory),
      // Real-time user counts on every row (the grid's presence pills) and `live` (an event running
      // there, from the events API) for the red badge and its tooltip.
      with_realms_detail: true,
      with_live_events: true
    }),
    [search, activeCategory, browseOffset]
  )

  const browseQuery = useGetDiscoverDestinationsQuery(browseArgs)
  const browseDestinations = browseQuery.data?.data ?? []
  const isLoadingBrowse = browseQuery.isLoading
  // `exhausted` (last page came back short) is the authoritative stop signal;
  // the `total` check just skips the trailing empty-page request in the common
  // case. `total > length` alone can never terminate: `merge` dedupes rows
  // across overlapping pages, so length may trail `total` forever.
  const browseHasMore = !(browseQuery.data?.exhausted ?? false) && (browseQuery.data?.total ?? 0) > browseDestinations.length
  const loadMoreBrowse = useCallback(() => {
    setBrowseOffset(prev => prev + BROWSE_LIMIT)
  }, [])
  const browseSentinelRef = useInfiniteScrollSentinel({
    hasMore: section === 'all' && browseHasMore,
    isLoading: browseQuery.isFetching,
    onLoadMore: loadMoreBrowse
  })

  // ── FAVOURITES / MY PLACES queries (signed-in tabs) ───────────────────
  const favoritesQuery = useGetDiscoverFavoritesQuery(section === 'favourites' && hasValidIdentity && address ? { address } : skipToken)
  const myQuery = useGetDiscoverDestinationsQuery(section === 'my' && address ? { owner: address } : skipToken)
  const favouriteCards = useMemo(
    () => (favoritesQuery.data?.data ?? []).filter(p => !isHiddenPlace(p)).map(p => ({ ...p, user_count: 0 })),
    [favoritesQuery.data]
  )
  const myCards = useMemo(
    () => (myQuery.data?.data ?? []).filter(p => !isHiddenPlace(p)).map(p => ({ ...p, user_count: 0 })),
    [myQuery.data]
  )
  const isLoadingSection = (section === 'favourites' && favoritesQuery.isLoading) || (section === 'my' && myQuery.isLoading)

  // NOTE: 2026-10-13 (Braian) a category no longer collapses Live Now. Live Now is global (the same top
  // four as All) and the category narrows the Explore grid only. Search still collapses it. Revisit if a
  // category-scoped Live Now is ever wanted.
  const showLiveRail = section !== 'all' || !search

  // Mobile filter chip reflects a non-default category so the user can
  // see and clear active filters without reopening the drawer.
  const showCategoryChip = section === 'all' && activeCategory !== 'all'

  // The LIVE section's own read of the destinations feed. It is deliberately NOT the paginated grid
  // query: that cache entry drops `offset` from its key and `merge`s pages, so a focus/reconnect
  // refetch there would refresh only the last-loaded page — never page 0, where the top four live. A
  // small separate page (different `limit`, so a different cache key) keeps the refresh contract.
  const liveFeedQuery = useGetDiscoverDestinationsQuery(
    showLiveRail ? { limit: LIVE_FEED_LIMIT, order_by: 'most_active', with_realms_detail: true, with_live_events: true } : skipToken,
    LIVE_REFRESH_OPTIONS
  )

  // The LIVE section: the four busiest scenes with at least `liveMinUsers` people in them.
  //
  // Presence comes from the destinations feed — the same source and order the grid and the explorer
  // use, which is what makes the two surfaces agree. The feed sorts `highlighted DESC,
  // live_user_count DESC`, so the busiest scenes sit inside the first LIVE_FEED_LIMIT rows;
  // re-sorting by head count here is what turns that into "top four by people". `filter` already
  // returns a fresh array, so sorting it in place leaves the cache alone.
  const liveRail = useMemo(() => {
    if (!showLiveRail) return []
    return (liveFeedQuery.data?.data ?? [])
      .filter(p => !isHiddenPlace(p) && placePlayers(p) >= liveMinUsers)
      .sort((a, b) => placePlayers(b) - placePlayers(a))
      .slice(0, LIVE_NOW_LIMIT)
  }, [showLiveRail, liveMinUsers, liveFeedQuery.data])

  // Live Now carousel. Mobile snaps one card at a time and the dots below track
  // the swipe. Desktop lays the four cards in a row that outgrows any viewport
  // under about 1300px — and since the rail hides its scrollbar and a wheel only
  // scrolls vertically, the cards past the fold were visible but unreachable.
  // Hence the arrows, enabled only while there is something left to reach.
  const {
    attachRail: attachLiveRail,
    railRef: liveRailRef,
    canScrollLeft: canScrollLiveLeft,
    canScrollRight: canScrollLiveRight
  } = useRailEdges<HTMLDivElement>(liveRail.length)
  const [activeLive, setActiveLive] = useState(0)
  const handleLiveScroll = useCallback(() => {
    const el = liveRailRef.current
    if (!el) return
    const { clientWidth, scrollLeft } = el
    const center = scrollLeft + clientWidth / 2
    let nearest = 0
    let nearestDist = Infinity
    Array.from(el.children).forEach((child, i) => {
      const slide = child as HTMLElement
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2
      const dist = Math.abs(slideCenter - center)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = i
      }
    })
    setActiveLive(nearest)
  }, [liveRailRef])
  const scrollToLive = useCallback(
    (index: number) => {
      const slide = liveRailRef.current?.children[index] as HTMLElement | undefined
      slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    },
    [liveRailRef]
  )
  // One card per press. The average card span (scrollWidth / count) includes the
  // gap and survives the reflows the hover glow triggers, unlike a single
  // card's offsetWidth.
  const nudgeLive = useCallback(
    (direction: -1 | 1) => {
      const el = liveRailRef.current
      if (!el || el.children.length === 0) return
      el.scrollBy({ left: direction * (el.scrollWidth / el.children.length), behavior: 'smooth' })
    },
    [liveRailRef]
  )

  // Explore All IS the /destinations feed: one page in the API's order, junk filtered. Rows keep
  // the feed's real-time `user_count` (with_realms_detail).
  //
  // Whatever Live Now rendered is subtracted unless the repeat flag is on. Under a category nothing is
  // subtracted, so the grid is the complete filtered result.
  //
  // NOTE: 2026-10-28 (Braian) the curated rail above the grid was removed on purpose; the curated set is
  // browsed through the Featured category, and only Live Now takes part in rail deduplication. Bringing a
  // rail back means restoring it from history.
  const exploreCards = useMemo<DiscoverPlace[]>(() => {
    // Curation overrides the junk heuristic under Featured, as places-api does server-side.
    const isHidden = activeCategory === FEATURED_CATEGORY ? isHiddenFeaturedPlace : isHiddenPlace
    const kept = browseDestinations.filter(p => !isHidden(p))
    // Under a category the grid is the whole filtered result, so Live Now never takes rows out of it.
    if (repeatAcrossSections || activeCategory !== 'all') return kept
    const shownAbove = new Set([...liveRail.map(c => c.id)])
    return kept.filter(p => !shownAbove.has(p.id))
  }, [browseDestinations, activeCategory, repeatAcrossSections, liveRail])

  // Wait for everything on first paint so Live Now and the grid appear together. Polling / search
  // refetches use `isFetching`, not `isLoading`, so they don't re-trigger this gate.
  const isLoadingLiveFeed = showLiveRail && liveFeedQuery.isLoading
  const isInitialLoading = isLoadingBrowse || isLoadingLiveFeed
  const isEmpty = !isInitialLoading && section === 'all' && exploreCards.length === 0

  // Cold load: render the spinner straight inside `CenteredBox` so the
  // page-level loader anchors at the exact viewport Y as the DappsShell
  // Suspense fallback.
  if (isInitialLoading) {
    return (
      <>
        <Helmet>
          <title>{t('discover.home.page_title')}</title>
        </Helmet>
        <CenteredBox>
          <CircularProgress />
        </CenteredBox>
      </>
    )
  }

  return (
    <PageContent>
      <Helmet>
        <title>{t('discover.home.page_title')}</title>
      </Helmet>

      {/* LIVE NOW rail — glowing rounded container with the 4 busiest scenes. */}
      {showLiveRail && liveRail.length > 0 && (
        <LiveNowSection>
          <LiveHeading>
            <LiveHeadingGlyph size="clamp(20px, 1.377vw, 26.4px)" />
            {t('discover.live.heading')}
          </LiveHeading>
          <LiveRailLayer>
            {/* Both stay mounted and go disabled at the ends: unmounting the one
                just pressed would drop the keyboard focus back to the body. */}
            {(canScrollLiveLeft || canScrollLiveRight) && (
              <>
                <LiveNavButton
                  type="button"
                  $side="left"
                  disabled={!canScrollLiveLeft}
                  aria-label={t('discover.live.scroll_previous')}
                  onClick={() => nudgeLive(-1)}
                >
                  <ChevronLeftRoundedIcon />
                </LiveNavButton>
                <LiveNavButton
                  type="button"
                  $side="right"
                  disabled={!canScrollLiveRight}
                  aria-label={t('discover.live.scroll_next')}
                  onClick={() => nudgeLive(1)}
                >
                  <ChevronRightRoundedIcon />
                </LiveNavButton>
              </>
            )}
            <LiveGrid ref={attachLiveRail} onScroll={handleLiveScroll}>
              {liveRail.map(place => (
                <CarouselSlide key={place.id}>
                  <LiveEventCard place={place} />
                </CarouselSlide>
              ))}
            </LiveGrid>
          </LiveRailLayer>
          {liveRail.length > 1 && (
            <CarouselDots>
              {liveRail.map((place, i) => (
                <CarouselDot
                  key={place.id}
                  type="button"
                  $active={i === Math.min(activeLive, liveRail.length - 1)}
                  aria-current={i === Math.min(activeLive, liveRail.length - 1)}
                  aria-label={place.title}
                  onClick={() => scrollToLive(i)}
                />
              ))}
            </CarouselDots>
          )}
        </LiveNowSection>
      )}

      {/* Toolbar — Explore all / Favourites / My places tabs, then search +
          the category dropdown pushed right. Wraps on narrow viewports.
          The band darkens the page gradient by 20% black, full-bleed, per the
          Figma's Explore All section. */}
      <ExploreBand ref={exploreBandRef}>
        <ExploreBandContent>
          <ExploreToolbar>
            <TabsRow>
              <TabPill type="button" $active={section === 'all'} onClick={() => changeSection('all')}>
                <BrowseGlyph
                  size="clamp(19px, 1.25vw, 24px)"
                  color={section === 'all' ? dclColors.neutral.softBlack1 : dclColors.neutral.softWhite}
                />
                {t('discover.explore.tab.explore_all')}
              </TabPill>
              <TabPill type="button" $active={section === 'favourites'} onClick={() => changeSection('favourites')}>
                <FavoriteGlyph
                  size="clamp(19px, 1.25vw, 24px)"
                  color={section === 'favourites' ? dclColors.neutral.softBlack1 : dclColors.neutral.softWhite}
                />
                {t('discover.explore.tab.favourites')}
              </TabPill>
              <TabPill type="button" $active={section === 'my'} onClick={() => changeSection('my')}>
                <MyPlacesGlyph
                  size="clamp(19px, 1.25vw, 24px)"
                  color={section === 'my' ? dclColors.neutral.softBlack1 : dclColors.neutral.softWhite}
                />
                {t('discover.explore.tab.my_places')}
              </TabPill>
            </TabsRow>
            <ControlsRow>
              {/* Search + category only filter the Explore All grid — hidden on
                  tabs where they would silently no-op. On mobile the category
                  dropdown moves into the filter drawer. */}
              {section === 'all' && (
                <SearchSlot>
                  <ToolbarSearchField
                    variant="outlined"
                    placeholder={t('discover.explore.search_placeholder')}
                    value={searchInput}
                    onChange={e => changeSearch(e.target.value)}
                    // Suppress the browser's saved-searches / autofill dropdown:
                    // picking one repainted the field with Chrome's light autofill
                    // background over the dark theme, "breaking" the bar (#721).
                    autoComplete="off"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchGlyph size="clamp(19px, 1.25vw, 24px)" />
                        </InputAdornment>
                      )
                    }}
                  />
                </SearchSlot>
              )}
              <DesktopFilters>
                {section === 'all' && (
                  <FilterSelect
                    value={activeCategory}
                    onChange={(e: SelectChangeEvent<unknown>) => changeCategory(e.target.value as DiscoverCategoryFilter)}
                    aria-label={t('discover.explore.category.all')}
                  >
                    {DISCOVER_CATEGORY_OPTIONS.map(c => (
                      <MenuItem key={c} value={c}>
                        {t(`discover.explore.category.${c}`)}
                      </MenuItem>
                    ))}
                  </FilterSelect>
                )}
              </DesktopFilters>
              {/* Mobile: opens the filter drawer (category only). Hidden on
                  the signed-in tabs — no filters apply there. */}
              {section === 'all' && (
                <FilterButton type="button" aria-label={t('discover.explore.filters')} onClick={() => setFiltersOpen(true)}>
                  <TuneRoundedIcon />
                </FilterButton>
              )}
            </ControlsRow>
          </ExploreToolbar>

          {/* Active-filter chips — mobile only (desktop shows the value in the
              dropdown). Tapping the ✕ clears that filter. */}
          {showCategoryChip && (
            <FilterChipsRow>
              <FilterChip type="button" aria-label={t('discover.explore.remove_filter')} onClick={() => changeCategory('all')}>
                {t(`discover.explore.category.${activeCategory}`)}
                <ChipCloseIcon />
              </FilterChip>
            </FilterChipsRow>
          )}

          {section === 'all' &&
            (browseQuery.isError ? (
              <ErrorBox>
                <ErrorText>{t('discover.explore.error')}</ErrorText>
                <RetryButton type="button" onClick={() => void browseQuery.refetch()}>
                  {t('discover.explore.retry')}
                </RetryButton>
              </ErrorBox>
            ) : isEmpty ? (
              <Empty>{t('discover.explore.empty')}</Empty>
            ) : (
              <>
                <CardGrid>
                  {exploreCards.map(place => (
                    <PlaceCard key={place.id} place={place} onEmptyClick={handleCardEmptyClick} />
                  ))}
                </CardGrid>
                {/* Infinite-scroll sentinel — fetches the next /destinations
                    page when it enters the viewport. */}
                <LoadMoreSentinel ref={browseSentinelRef}>
                  {browseQuery.isFetching && browseOffset > 0 && <CircularProgress size={28} />}
                </LoadMoreSentinel>
              </>
            ))}

          {section === 'favourites' &&
            (isLoadingSection ? (
              <CenteredBox>
                <CircularProgress />
              </CenteredBox>
            ) : !hasValidIdentity || !address ? (
              <DiscoverSignInPrompt message={t('discover.explore.signin_favourites')} returnTab="favourites" />
            ) : favoritesQuery.isError ? (
              <ErrorBox>
                <ErrorText>{t('discover.explore.error')}</ErrorText>
                <RetryButton type="button" onClick={() => void favoritesQuery.refetch()}>
                  {t('discover.explore.retry')}
                </RetryButton>
              </ErrorBox>
            ) : favouriteCards.length === 0 ? (
              <Empty>{t('discover.explore.empty_favourites')}</Empty>
            ) : (
              <CardGrid>
                {favouriteCards.map(place => (
                  <PlaceCard key={place.id} place={place} onEmptyClick={handleCardEmptyClick} />
                ))}
              </CardGrid>
            ))}

          {section === 'my' &&
            (isLoadingSection ? (
              <CenteredBox>
                <CircularProgress />
              </CenteredBox>
            ) : !address ? (
              <DiscoverSignInPrompt message={t('discover.explore.signin_my_places')} returnTab="my" />
            ) : myQuery.isError ? (
              <ErrorBox>
                <ErrorText>{t('discover.explore.error')}</ErrorText>
                <RetryButton type="button" onClick={() => void myQuery.refetch()}>
                  {t('discover.explore.retry')}
                </RetryButton>
              </ErrorBox>
            ) : myCards.length === 0 ? (
              <Empty>{t('discover.explore.empty_my_places')}</Empty>
            ) : (
              <CardGrid>
                {myCards.map(place => (
                  <PlaceCard key={place.id} place={place} onEmptyClick={handleCardEmptyClick} />
                ))}
              </CardGrid>
            ))}
        </ExploreBandContent>
      </ExploreBand>

      {/* Mobile filter drawer — the Category control the desktop toolbar shows
          inline. Selecting applies live (the grid re-queries), so there's no
          separate apply step. */}
      <FilterDrawer anchor="right" open={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <DrawerHeader>
          <DrawerTitle>{t('discover.explore.filters')}</DrawerTitle>
          <DrawerCloseButton aria-label={t('discover.scene.close')} onClick={() => setFiltersOpen(false)}>
            <CloseRoundedIcon />
          </DrawerCloseButton>
        </DrawerHeader>
        {section === 'all' && (
          <DrawerSection>
            <DrawerSectionLabel>{t('discover.explore.category.label')}</DrawerSectionLabel>
            <DrawerSelect
              value={activeCategory}
              onChange={(e: SelectChangeEvent<unknown>) => changeCategory(e.target.value as DiscoverCategoryFilter)}
              aria-label={t('discover.explore.category.all')}
            >
              {DISCOVER_CATEGORY_OPTIONS.map(c => (
                <MenuItem key={c} value={c}>
                  {t(`discover.explore.category.${c}`)}
                </MenuItem>
              ))}
            </DrawerSelect>
          </DrawerSection>
        )}
      </FilterDrawer>

      {modalPlace && <SceneJumpInModal place={modalPlace} onClose={() => setModalPlace(null)} />}
    </PageContent>
  )
}

export { DiscoverHomePage }
