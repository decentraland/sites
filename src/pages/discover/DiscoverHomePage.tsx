/* eslint-disable @typescript-eslint/naming-convention -- places-api query args (with_realms_detail, only_highlighted, …) are snake_case */
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import type { SelectChangeEvent } from '@mui/material'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { CircularProgress, InputAdornment, MenuItem, dclColors, useMediaQuery, useTheme } from 'decentraland-ui2'
import { CenteredBox } from '../../App.styled'
import { CardGrid, Empty, ErrorBox, ErrorText, PageContent, RetryButton } from '../../components/discover/_shared'
import { LiveHeadingGlyph } from '../../components/discover/_shared/CardIcons'
import { BrowseGlyph, FavoriteGlyph, MyPlacesGlyph, SearchGlyph } from '../../components/discover/_shared/ToolbarIcons'
import { FeaturedCard } from '../../components/discover/FeaturedCard'
import { LiveEventCard } from '../../components/discover/LiveEventCard'
import { PlaceCard } from '../../components/discover/PlaceCard'
import { SceneJumpInModal } from '../../components/discover/SceneJumpInModal'
import {
  DISCOVER_CATEGORIES,
  buildDetailPath,
  isHiddenPlace,
  placeHasPeople,
  placeIsLive,
  placePlayers,
  useGetDiscoverDestinationsQuery,
  useGetDiscoverFavoritesQuery,
  useGetDiscoverPlacesQuery,
  useGetDiscoverWorldsByNamesQuery,
  useGetHotScenesQuery,
  useGetLiveWorldsQuery
} from '../../features/discover'
import type { DiscoverCategory, DiscoverPlace } from '../../features/discover'
import { useNewPlacesLayout } from '../../features/discover/discover.flags'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useDeferredTrack } from '../../hooks/useDeferredTrack'
import { useInfiniteScrollSentinel } from '../../hooks/useInfiniteScrollSentinel'
import { usePageViewTracking } from '../../hooks/usePageViewTracking'
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
  FeaturedGrid,
  FeaturedToggle,
  FilterButton,
  FilterChip,
  FilterChipsRow,
  FilterDrawer,
  FilterSelect,
  LiveGrid,
  LiveHeading,
  LiveNowSection,
  LoadMoreSentinel,
  SearchSlot,
  SectionTitle,
  TabPill,
  TabsRow,
  ToolbarSearchField
} from './DiscoverHomePage.styled'

// Toolbar sections, mirroring the Figma "Experiences tabs".
type ExploreSection = 'all' | 'favourites' | 'my'

// Unified /discover landing, matching the "Places - Desktop" Figma:
//   1. LIVE NOW      — glowing rounded rail with the 4 busiest scenes.
//   2. FEATURED      — places-api curated `highlighted` places.
//   3. TOOLBAR       — Explore all / Favourites / My places tabs + search +
//                      the category dropdown.
//   4. EXPLORE ALL   — the main grid: the /destinations feed as-is, deduped
//                      against the two rails above.
// The curated rails (1+2) only render on the default view — searching or
// filtering collapses the page to the grid. Favourites is a signed places-api
// read; My places lists the signed-in wallet's own places + worlds.
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

// New layout: how many feed rows the LIVE section reads to find its top four. The feed puts every
// highlighted row first (22 today), so this must comfortably exceed that count or the busiest
// non-featured scene could fall off the end. Mirrors the 40-scene cap the legacy hot-scenes fetch used.
const LIVE_FEED_LIMIT = 40

// The Featured rail shows EVERY highlighted place (the curated set is small —
// a handful of rows); this only bounds the request, it is not a display cap.
const FEATURED_FETCH_LIMIT = 100

// Collapsed Featured rail height (Figma): two grid rows; anything beyond
// hides behind the VIEW ALL FEATURED PLACES toggle.
const FEATURED_COLLAPSED_ROWS = 2

function DiscoverHomePage() {
  const t = useFormatMessage()

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
  const [activeCategory, setActiveCategory] = useState<DiscoverCategory | 'all'>('all')
  // Track filter changes for the DISCOVER analytics funnel. Single handlers so
  // every surface that changes them (desktop dropdowns, mobile drawer, chips)
  // emits the same event shape.
  const track = useDeferredTrack()
  const changeCategory = useCallback(
    (next: DiscoverCategory | 'all') => {
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
  const [section, setSection] = useState<ExploreSection>('all')
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
  // Featured rail collapse — capped at FEATURED_COLLAPSED_ROWS × the grid's
  // current column count, mirroring FeaturedGrid's breakpoints.
  const [featuredExpanded, setFeaturedExpanded] = useState(false)
  const theme = useTheme()
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'))
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'))
  const featuredColumns = isLgUp ? 4 : isMdUp ? 3 : isSmUp ? 2 : 1
  // Mobile-only filter drawer (Category). Desktop shows it inline.
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { address, hasValidIdentity } = useAuthIdentity()

  // Live Now mobile carousel — track the snapped card so the dot indicators
  // reflect the swipe position. Desktop renders the full grid (no horizontal
  // scroll), so the scroll handler simply never fires there.
  const liveRailRef = useRef<HTMLDivElement>(null)
  const [activeLive, setActiveLive] = useState(0)
  const handleLiveScroll = useCallback(() => {
    const el = liveRailRef.current
    if (!el) return
    const center = el.scrollLeft + el.clientWidth / 2
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
  }, [])
  const scrollToLive = useCallback((index: number) => {
    const slide = liveRailRef.current?.children[index] as HTMLElement | undefined
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [])

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

  // ── LIVE NOW queries ──────────────────────────────────────────────────
  // Independent of search/category — we always fetch the full live set
  // and filter client-side. Server APIs don't support "places with users".
  // The 2026-09-01 layout, off by default. See discover.flags.ts for what travels together.
  // Read here, above the presence queries, because on the new layout those three requests are
  // dead weight: the LIVE section reads presence from the destinations feed instead.
  const newLayout = useNewPlacesLayout()
  const hotScenesQuery = useGetHotScenesQuery(newLayout ? skipToken : { limit: 40 }, LIVE_REFRESH_OPTIONS)
  const livePlacesQuery = useGetDiscoverPlacesQuery(
    newLayout ? skipToken : { limit: 50, order_by: 'most_active', order: 'desc' },
    LIVE_REFRESH_OPTIONS
  )
  const liveWorldsQuery = useGetLiveWorldsQuery(newLayout ? skipToken : undefined, LIVE_REFRESH_OPTIONS)

  const liveWorldNames = useMemo(() => {
    const names = (liveWorldsQuery.data ?? []).filter(w => w.users > 0).map(w => w.worldName.toLowerCase())
    return [...new Set(names)]
  }, [liveWorldsQuery.data])

  // Batch metadata fetch — one request for all live worlds, not N per-world.
  // Worlds the places-api doesn't know get rendered with PlaceCard's fallback.
  const worldsMetadataQuery = useGetDiscoverWorldsByNamesQuery(liveWorldNames.length > 0 ? { names: liveWorldNames } : skipToken)

  const isLoadingLive = hotScenesQuery.isLoading || livePlacesQuery.isLoading || liveWorldsQuery.isLoading
  const hotScenes = hotScenesQuery.data ?? []
  const livePlaces = livePlacesQuery.data?.data ?? []
  const liveWorlds = liveWorldsQuery.data ?? []
  const worldsMetadata = worldsMetadataQuery.data ?? []

  // Join hot-scenes + live-worlds against their metadata sources.
  const liveCards = useMemo<DiscoverPlace[]>(() => {
    const placeByPosition = new Map<string, DiscoverPlace>()
    for (const p of livePlaces) {
      if (p.base_position) placeByPosition.set(p.base_position, p)
      for (const pos of p.positions ?? []) placeByPosition.set(pos, p)
    }
    const seen = new Set<string>()
    const result: DiscoverPlace[] = []

    // Genesis City — hot-scenes ⇄ places-api by parcel.
    for (const scene of hotScenes) {
      const key = `${scene.baseCoords[0]},${scene.baseCoords[1]}`
      const match = placeByPosition.get(key)
      if (!match || seen.has(match.id)) continue
      seen.add(match.id)
      result.push({ ...match, user_count: scene.usersTotalCount })
    }

    // Worlds — live-data ⇄ places-api by world name (with fallback).
    const worldByName = new Map<string, DiscoverPlace>()
    for (const w of worldsMetadata) {
      if (w.world_name) worldByName.set(w.world_name.toLowerCase(), w)
    }
    for (const entry of liveWorlds) {
      const name = entry.worldName?.toLowerCase()
      if (!name || entry.users <= 0) continue
      const match = worldByName.get(name)
      if (match) {
        if (seen.has(match.id)) continue
        seen.add(match.id)
        result.push({ ...match, user_count: entry.users })
      } else {
        // No places-api metadata for this world — render with the PlaceCard
        // first-letter fallback. Better than a broken image.
        result.push({
          id: name,
          title: entry.worldName,
          description: '',
          image: '',
          positions: [],
          owner: null,
          world: true,
          world_name: entry.worldName,
          user_count: entry.users
        })
      }
    }

    result.sort((a, b) => (b.user_count ?? 0) - (a.user_count ?? 0))
    return result.filter(p => !isHiddenPlace(p))
  }, [hotScenes, livePlaces, liveWorlds, worldsMetadata])

  // Client-side filter for LIVE: title substring + category match. Empty
  // search + 'all' category short-circuits to the full list.
  const filteredLiveCards = useMemo(() => {
    if (!search && activeCategory === 'all') return liveCards
    const term = search.toLowerCase()
    return liveCards.filter(card => {
      if (term && !card.title?.toLowerCase().includes(term)) return false
      if (activeCategory !== 'all' && !card.categories?.includes(activeCategory)) return false
      return true
    })
  }, [liveCards, search, activeCategory])

  // ── BROWSE queries ────────────────────────────────────────────────────
  // Server-side search/category against the destinations endpoint.
  // Different args from the LIVE feed → separate RTK Query cache entry.
  // `/destinations` serves places + worlds in one page. The grid asks for
  // `most_active` so scenes with people in them lead it, with curation as the
  // tie-breaker; the Featured rail and My Places keep the curated order.
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
      categories: activeCategory === 'all' ? undefined : [activeCategory],
      // Real-time user counts on every row — the grid's presence pills. `live` (an event running
      // there, from the events API) is only requested on the new layout: the legacy cards never read
      // it, and server-side it is a cross-service call per request, so the flag-off path must not
      // pay for it. Flipping the flag changes this cache key once, which is one extra page-0 fetch.
      with_realms_detail: true,
      ...(newLayout && { with_live_events: true })
    }),
    [search, activeCategory, browseOffset, newLayout]
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

  // Live Now + Featured stay visible on every tab — only searching or
  // filtering the Explore view collapses the page to a single results grid
  // (search/category apply to the browse query, not the signed-in tabs).
  const showHighlights = section !== 'all' || (!search && activeCategory === 'all')

  // Mobile filter chip reflects a non-default category so the user can
  // see and clear active filters without reopening the drawer.
  const showCategoryChip = section === 'all' && activeCategory !== 'all'

  // ── FEATURED query ────────────────────────────────────────────────────
  // Featured = the destinations feed's curated `highlighted` set — the one
  // endpoint that spans places AND worlds (`/worlds` ignores
  // `only_highlighted`). Skipped entirely while filtering since the Featured
  // rail is hidden then.
  const featuredQuery = useGetDiscoverDestinationsQuery(
    showHighlights
      ? {
          limit: FEATURED_FETCH_LIMIT,
          only_highlighted: true,
          // Legacy joins presence in from the live feed and never reads `live`, so neither is
          // requested there (same backend-cost reasoning as browseArgs).
          ...(newLayout && { with_realms_detail: true, with_live_events: true })
        }
      : skipToken,
    // Featured carries presence on the new layout, so it refreshes on focus/reconnect like the
    // legacy live feed did. A no-op on the legacy path, where its counts come from that feed.
    LIVE_REFRESH_OPTIONS
  )

  // New layout: the LIVE section's own read of the destinations feed. It is deliberately NOT the
  // paginated grid query: that cache entry drops `offset` from its key and `merge`s pages, so a
  // focus/reconnect refetch there would refresh only the last-loaded page — never page 0, where the
  // top four live. A small separate page (different `limit`, so a different cache key) restores the
  // refresh contract the legacy hot-scenes query honoured, at one request instead of the three it
  // replaces.
  const liveFeedQuery = useGetDiscoverDestinationsQuery(
    newLayout && showHighlights
      ? { limit: LIVE_FEED_LIMIT, order_by: 'most_active', with_realms_detail: true, with_live_events: true }
      : skipToken,
    LIVE_REFRESH_OPTIONS
  )

  // The LIVE section: the four busiest scenes, "busiest" meaning anyone at all is in them.
  //
  // New layout reads presence from the destinations feed — the same source and order the grid and
  // the explorer use, which is what makes the two surfaces agree. The feed sorts
  // `highlighted DESC, live_user_count DESC`, so the busiest scenes sit inside the first
  // LIVE_FEED_LIMIT rows; re-sorting by head count here is what turns that into "top four by
  // people". `filter` already returns a fresh array, so sorting it in place leaves the cache alone.
  //
  // Legacy path keeps the old three-service join and the 5-user cut, which is what production ships.
  const liveRail = useMemo(() => {
    if (!showHighlights) return []
    if (!newLayout) return filteredLiveCards.filter(placeIsLive).slice(0, LIVE_NOW_LIMIT)
    return (liveFeedQuery.data?.data ?? [])
      .filter(p => !isHiddenPlace(p) && placeHasPeople(p))
      .sort((a, b) => placePlayers(b) - placePlayers(a))
      .slice(0, LIVE_NOW_LIMIT)
  }, [showHighlights, newLayout, filteredLiveCards, liveFeedQuery.data])

  // The curated rail shows every highlighted destination, live or not (the
  // API only marks a handful) — joined against the LIVE feed's real presence
  // so a live featured card navigates to the scene preview instead of opening
  // the empty-scene modal, and sorted so live ones lead the rail.
  const featuredCards = useMemo(() => {
    if (!showHighlights) return []
    // Legacy: the featured query carried no presence, so the count is joined in from the live feed.
    // New layout: the query asks for `with_realms_detail`, so the row already has the API's count
    // and joining would overwrite it with 0 for anything the (skipped) legacy join never saw.
    const liveById = new Map(filteredLiveCards.map(c => [c.id, c.user_count ?? 0]))
    const withPresence = (p: DiscoverPlace): DiscoverPlace => (newLayout ? p : { ...p, user_count: liveById.get(p.id) ?? 0 })
    // Only the four cards the rail actually renders are removed: a featured place with people that
    // missed the top four still belongs here.
    const shownInLiveRail = new Set(newLayout ? liveRail.map(c => c.id) : [])
    return (featuredQuery.data?.data ?? [])
      .filter(p => !isHiddenPlace(p))
      .filter(p => !shownInLiveRail.has(p.id))
      .map(withPresence)
      .sort((a, b) => (b.user_count ?? 0) - (a.user_count ?? 0))
  }, [showHighlights, featuredQuery.data, filteredLiveCards, liveRail, newLayout])

  // Explore All IS the /destinations feed: one page in the API's order, junk filtered. Rows keep
  // the feed's real-time `user_count` (with_realms_detail).
  //
  // The rails are subtracted only when the dedupe flag is on. `/destinations` returns
  // `highlighted DESC` first, so without it the head of this grid IS the Featured rail verbatim
  // (22 of 22 today) and the user scrolls past the same cards twice. Search and category filtering
  // empty both rails, so results are never hidden from a query.
  const exploreCards = useMemo<DiscoverPlace[]>(() => {
    const kept = browseDestinations.filter(p => !isHiddenPlace(p))
    if (!newLayout) return kept
    const shownAbove = new Set([...liveRail.map(c => c.id), ...featuredCards.map(c => c.id)])
    return kept.filter(p => !shownAbove.has(p.id))
  }, [browseDestinations, newLayout, liveRail, featuredCards])

  // Wait for EVERYTHING on first paint — including the dependent worlds-
  // metadata batch fetch — so the rails and the grid appear together.
  // Polling / search refetches use `isFetching`, not `isLoading`, so they
  // don't re-trigger this gate.
  const isLoadingWorldsMetadata = liveWorldNames.length > 0 && worldsMetadataQuery.isLoading
  const isLoadingFeatured = showHighlights && featuredQuery.isLoading
  const isLoadingLiveFeed = newLayout && showHighlights && liveFeedQuery.isLoading
  const isInitialLoading = isLoadingLive || isLoadingBrowse || isLoadingWorldsMetadata || isLoadingFeatured || isLoadingLiveFeed
  const isEmpty = !isInitialLoading && section === 'all' && featuredCards.length === 0 && exploreCards.length === 0

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
      {showHighlights && liveRail.length > 0 && (
        <LiveNowSection>
          <LiveHeading>
            <LiveHeadingGlyph size="clamp(20px, 1.377vw, 26.4px)" />
            {t('discover.live.heading')}
          </LiveHeading>
          <LiveGrid ref={liveRailRef} onScroll={handleLiveScroll}>
            {liveRail.map(place => (
              <CarouselSlide key={place.id}>
                <LiveEventCard place={place} />
              </CarouselSlide>
            ))}
          </LiveGrid>
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

      {/* Featured rail — curated POIs. The toolbar lives BELOW it (the
          featured picks are curated, not filtered). */}
      {showHighlights && featuredCards.length > 0 && (
        <>
          <SectionTitle>{t('discover.explore.section.featured')}</SectionTitle>
          <FeaturedGrid>
            {(featuredExpanded ? featuredCards : featuredCards.slice(0, featuredColumns * FEATURED_COLLAPSED_ROWS)).map(place => (
              <FeaturedCard key={place.id} place={place} onEmptyClick={handleCardEmptyClick} />
            ))}
          </FeaturedGrid>
          {featuredCards.length > featuredColumns * FEATURED_COLLAPSED_ROWS && (
            <FeaturedToggle type="button" onClick={() => setFeaturedExpanded(v => !v)}>
              {t(featuredExpanded ? 'discover.featured.view_less' : 'discover.featured.view_all')}
            </FeaturedToggle>
          )}
        </>
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
                    onChange={(e: SelectChangeEvent<unknown>) => changeCategory(e.target.value as DiscoverCategory | 'all')}
                    aria-label={t('discover.explore.category.all')}
                  >
                    <MenuItem value="all">{t('discover.explore.category.all')}</MenuItem>
                    {DISCOVER_CATEGORIES.map(c => (
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
              <Empty>{t('discover.explore.signin_favourites')}</Empty>
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
              <Empty>{t('discover.explore.signin_my_places')}</Empty>
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
              onChange={(e: SelectChangeEvent<unknown>) => changeCategory(e.target.value as DiscoverCategory | 'all')}
              aria-label={t('discover.explore.category.all')}
            >
              <MenuItem value="all">{t('discover.explore.category.all')}</MenuItem>
              {DISCOVER_CATEGORIES.map(c => (
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
