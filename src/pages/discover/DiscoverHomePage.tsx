/* eslint-disable @typescript-eslint/naming-convention */
import { useDeferredValue, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import SearchIcon from '@mui/icons-material/Search'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { CircularProgress, InputAdornment } from 'decentraland-ui2'
import { CenteredBox } from '../../App.styled'
import { CardGrid, Empty, PageContent, SearchField } from '../../components/discover/_shared'
import { PlaceCard } from '../../components/discover/PlaceCard'
import {
  SOCIAL_CATEGORIES,
  useGetHotScenesQuery,
  useGetLiveWorldsQuery,
  useGetSocialPlacesQuery,
  useGetSocialWorldsByNamesQuery,
  useGetSocialWorldsQuery
} from '../../features/discover'
import type { SocialCategory, SocialPlace } from '../../features/discover'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { CategoryTab, CategoryTabs, FiltersBar, SectionTitle } from './DiscoverHomePage.styled'

// Unified /discover landing — LIVE NOW sits at the top showing every scene
// with users right now; below it the search + category chips let you find
// places that aren't live. Search + category apply to BOTH sections so a
// query for "casino" filters LIVE NOW (client-side by title + categories)
// AND drives the server-side places/worlds search below. Results are
// always ordered by `most_active` — no user-facing sort control, which
// kept the controls row visually busy without adding much for users who
// just want to find a scene.
//
// 30s polling, paused while the tab is hidden, with refetch on focus /
// reconnect so the LIVE feed never sits stale after a tab switch or a
// wifi drop.
const LIVE_REFRESH_OPTIONS = {
  pollingInterval: 30_000,
  skipPollingIfUnfocused: true,
  refetchOnFocus: true,
  refetchOnReconnect: true
} as const

const BROWSE_LIMIT = 24

// Auto-generated road parcels surface in hot-scenes whenever an avatar walks
// across them, but they aren't real "places" — no scene, no creator, just a
// crossroads. The places-api gives them a deterministic title prefix and
// empty categories array. Drop them so LIVE NOW only advertises destinations
// users would actually want to jump into.
function isRoad(place: SocialPlace): boolean {
  return !place.world && (place.title?.startsWith('Road at ') ?? false)
}

function DiscoverHomePage() {
  const t = useFormatMessage()

  // `useDeferredValue` keeps typing snappy while debouncing the actual filter pass.
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())
  const [activeCategory, setActiveCategory] = useState<SocialCategory | 'all'>('all')

  // ── LIVE NOW queries ──────────────────────────────────────────────────
  // Independent of search/sort/category — we always fetch the full live set
  // and filter client-side. Server APIs don't support "places with users".
  const hotScenesQuery = useGetHotScenesQuery({ limit: 40 }, LIVE_REFRESH_OPTIONS)
  const livePlacesQuery = useGetSocialPlacesQuery({ limit: 50, order_by: 'most_active', order: 'desc' }, LIVE_REFRESH_OPTIONS)
  const liveWorldsQuery = useGetLiveWorldsQuery(undefined, LIVE_REFRESH_OPTIONS)

  const liveWorldNames = useMemo(() => {
    const names = (liveWorldsQuery.data ?? []).filter(w => w.users > 0).map(w => w.worldName.toLowerCase())
    return [...new Set(names)]
  }, [liveWorldsQuery.data])

  // Batch metadata fetch — one request for all live worlds, not N per-world.
  // Worlds the places-api doesn't know get rendered with PlaceCard's fallback.
  const worldsMetadataQuery = useGetSocialWorldsByNamesQuery(liveWorldNames.length > 0 ? { names: liveWorldNames } : skipToken)

  const isLoadingLive = hotScenesQuery.isLoading || livePlacesQuery.isLoading || liveWorldsQuery.isLoading
  const hotScenes = hotScenesQuery.data ?? []
  const livePlaces = livePlacesQuery.data?.data ?? []
  const liveWorlds = liveWorldsQuery.data ?? []
  const worldsMetadata = worldsMetadataQuery.data ?? []

  // Join hot-scenes + live-worlds against their metadata sources.
  const liveCards = useMemo<SocialPlace[]>(() => {
    const placeByPosition = new Map<string, SocialPlace>()
    for (const p of livePlaces) {
      if (p.base_position) placeByPosition.set(p.base_position, p)
      for (const pos of p.positions ?? []) placeByPosition.set(pos, p)
    }
    const seen = new Set<string>()
    const result: SocialPlace[] = []

    // Genesis City — hot-scenes ⇄ places-api by parcel.
    for (const scene of hotScenes) {
      const key = `${scene.baseCoords[0]},${scene.baseCoords[1]}`
      const match = placeByPosition.get(key)
      if (!match || seen.has(match.id)) continue
      seen.add(match.id)
      result.push({ ...match, user_count: scene.usersTotalCount })
    }

    // Worlds — live-data ⇄ places-api by world name (with fallback).
    const worldByName = new Map<string, SocialPlace>()
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
    return result.filter(p => !isRoad(p))
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
  // Server-side search/category/sort against the places + worlds endpoints.
  // Different args from the LIVE feed → separate RTK Query cache entry.
  const placesArgs = useMemo(
    () => ({
      limit: BROWSE_LIMIT,
      order_by: 'most_active' as const,
      order: 'desc' as const,
      search: search || undefined,
      categories: activeCategory === 'all' ? undefined : [activeCategory]
    }),
    [search, activeCategory]
  )

  const worldsArgs = useMemo(
    () => ({
      limit: BROWSE_LIMIT,
      order_by: 'most_active' as const,
      order: 'desc' as const,
      search: search || undefined
    }),
    [search]
  )

  const placesQuery = useGetSocialPlacesQuery(placesArgs)
  const worldsQuery = useGetSocialWorldsQuery(worldsArgs)
  const browsePlaces = placesQuery.data?.data ?? []
  const browseWorlds = worldsQuery.data?.data ?? []
  const isLoadingBrowse = placesQuery.isLoading || worldsQuery.isLoading
  const showWorldsSection = activeCategory === 'all' && browseWorlds.length > 0

  // Hide LIVE rows that also appear in BROWSE so the user doesn't see the
  // same scene twice. LIVE wins (it's the more useful surface). Also strip
  // `user_count` from BROWSE entries — that field comes from places-api's
  // last-known snapshot, which often lags reality (e.g., a scene that has
  // nobody in it right now still reports `user_count: 1` from when someone
  // walked through hours ago). Real-time presence belongs ONLY in the LIVE
  // NOW section (joined against hot-scenes / live-data); BROWSE shows
  // discovery cards without the misleading "1 person" pill.
  const liveIds = useMemo(() => new Set(filteredLiveCards.map(c => c.id)), [filteredLiveCards])
  const dedupedBrowsePlaces = useMemo(
    () => browsePlaces.filter(p => !liveIds.has(p.id) && !isRoad(p)).map(p => ({ ...p, user_count: 0 })),
    [browsePlaces, liveIds]
  )
  const dedupedBrowseWorlds = useMemo(
    () => browseWorlds.filter(w => !liveIds.has(w.id)).map(w => ({ ...w, user_count: 0 })),
    [browseWorlds, liveIds]
  )

  // Wait for EVERYTHING on first paint — including the dependent worlds-
  // metadata batch fetch — so LIVE NOW and the BROWSE sections appear
  // together. Releasing them progressively (one section landing, layout
  // shifting when the next arrives, then again when the worlds-metadata
  // join completes) was the visible glitch on cold load. Polling /
  // search refetches use `isFetching`, not `isLoading`, so they don't
  // re-trigger this gate.
  const isLoadingWorldsMetadata = liveWorldNames.length > 0 && worldsMetadataQuery.isLoading
  const isInitialLoading = isLoadingLive || isLoadingBrowse || isLoadingWorldsMetadata
  const isEmpty =
    !isInitialLoading && filteredLiveCards.length === 0 && dedupedBrowsePlaces.length === 0 && dedupedBrowseWorlds.length === 0

  // Cold load: render the spinner straight inside `CenteredBox` (no
  // `PageContent` padding, no `FiltersBar` above it) so the page-level
  // loader anchors at the exact viewport Y as the DappsShell Suspense
  // fallback. PageContent's 32px top padding + the FiltersBar height
  // was shifting the second spinner down enough that the handoff read
  // as a separate "second loader" on mobile.
  if (isInitialLoading) {
    return (
      <>
        <Helmet>
          <title>{t('social.home.page_title')}</title>
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
        <title>{t('social.home.page_title')}</title>
      </Helmet>

      {/* Filters bar — text-tab category strip on the left, compact search
          on the right. Single row on tablet+, stacks on mobile (tabs above
          search) since the two can't share a narrow viewport without one
          getting squished. The shared bottom border ties them together so
          the bar reads as one control rather than two stacked elements. */}
      <FiltersBar>
        <CategoryTabs role="tablist" aria-label={t('social.explore.category.all')}>
          <CategoryTab
            type="button"
            role="tab"
            aria-selected={activeCategory === 'all'}
            $active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          >
            {t('social.explore.category.all')}
          </CategoryTab>
          {SOCIAL_CATEGORIES.map(c => (
            <CategoryTab
              key={c}
              type="button"
              role="tab"
              aria-selected={activeCategory === c}
              $active={activeCategory === c}
              onClick={() => setActiveCategory(c)}
            >
              {t(`social.explore.category.${c}`)}
            </CategoryTab>
          ))}
        </CategoryTabs>
        <SearchField
          variant="outlined"
          placeholder={t('social.explore.search_placeholder')}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </FiltersBar>

      {isEmpty ? (
        <Empty>{t('social.explore.empty')}</Empty>
      ) : (
        <>
          {filteredLiveCards.length > 0 && (
            <>
              <SectionTitle>{t('social.live.heading')}</SectionTitle>
              <CardGrid>
                {filteredLiveCards.map(place => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </CardGrid>
            </>
          )}
          {dedupedBrowsePlaces.length > 0 && (
            <>
              <SectionTitle>{t('social.explore.section.places')}</SectionTitle>
              <CardGrid>
                {dedupedBrowsePlaces.map(place => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </CardGrid>
            </>
          )}
          {showWorldsSection && dedupedBrowseWorlds.length > 0 && (
            <>
              <SectionTitle>{t('social.explore.section.worlds')}</SectionTitle>
              <CardGrid>
                {dedupedBrowseWorlds.map(world => (
                  <PlaceCard key={world.id} place={world} />
                ))}
              </CardGrid>
            </>
          )}
        </>
      )}
    </PageContent>
  )
}

export { DiscoverHomePage }
