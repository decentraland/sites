/* eslint-disable @typescript-eslint/naming-convention */
import { useDeferredValue, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { CircularProgress, MenuItem } from 'decentraland-ui2'
import { CardGrid, Empty, HeaderRow, Loader, PageContent, SearchField } from '../../components/social/_shared'
import { PlaceCard } from '../../components/social/PlaceCard'
import {
  SOCIAL_CATEGORIES,
  useGetHotScenesQuery,
  useGetLiveWorldsQuery,
  useGetSocialPlacesQuery,
  useGetSocialWorldsByNamesQuery,
  useGetSocialWorldsQuery
} from '../../features/social'
import type { SocialCategory, SocialOrder, SocialOrderBy, SocialPlace } from '../../features/social'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { CategoryChip, CategoryRow, SectionTitle, SortSelect } from './SocialHomePage.styled'

// Unified /social landing — merges what used to be /social (LIVE) and the
// standalone /social/explore page. LIVE NOW sits at the top showing every
// scene with users right now; below it the same search / sort / category
// controls let you discover places that aren't live.
//
// Search + category apply to BOTH sections so a query for "casino" filters
// LIVE NOW (client-side, by title + categories) AND drives the server-side
// places/worlds search below. Sort only affects the lower section — LIVE is
// always ordered by user_count (descending).
//
// 30s polling + focus/reconnect refetch keeps the LIVE feed feeling alive:
//   • `pollingInterval` — refresh while the user is sitting on the page.
//   • `skipPollingIfUnfocused` — pause the timer when the tab is hidden.
//   • `refetchOnFocus` — fire one refetch the moment the tab regains focus.
//   • `refetchOnReconnect` — flaky wifi shouldn't leave the feed frozen.
const LIVE_REFRESH_OPTIONS = {
  pollingInterval: 30_000,
  skipPollingIfUnfocused: true,
  refetchOnFocus: true,
  refetchOnReconnect: true
} as const

const SORT_OPTIONS: SocialOrderBy[] = ['most_active', 'name', 'like_score_best']
const BROWSE_LIMIT = 24

function SocialHomePage() {
  const t = useFormatMessage()

  // Search / sort / category state. `useDeferredValue` keeps typing snappy
  // while debouncing the actual filter pass.
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())
  const [orderBy, setOrderBy] = useState<SocialOrderBy>('most_active')
  const [activeCategory, setActiveCategory] = useState<SocialCategory | 'all'>('all')
  const order: SocialOrder = orderBy === 'name' ? 'asc' : 'desc'

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
    return result
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
      order_by: orderBy,
      order,
      search: search || undefined,
      categories: activeCategory === 'all' ? undefined : [activeCategory]
    }),
    [orderBy, order, search, activeCategory]
  )

  const worldsArgs = useMemo(
    () => ({
      limit: BROWSE_LIMIT,
      order_by: orderBy,
      order,
      search: search || undefined
    }),
    [orderBy, order, search]
  )

  const placesQuery = useGetSocialPlacesQuery(placesArgs)
  const worldsQuery = useGetSocialWorldsQuery(worldsArgs)
  const browsePlaces = placesQuery.data?.data ?? []
  const browseWorlds = worldsQuery.data?.data ?? []
  const isLoadingBrowse = placesQuery.isLoading || worldsQuery.isLoading
  const showWorldsSection = activeCategory === 'all' && browseWorlds.length > 0

  // Hide LIVE rows that also appear in BROWSE so the user doesn't see the
  // same scene twice. LIVE wins (it's the more useful surface).
  const liveIds = useMemo(() => new Set(filteredLiveCards.map(c => c.id)), [filteredLiveCards])
  const dedupedBrowsePlaces = useMemo(() => browsePlaces.filter(p => !liveIds.has(p.id)), [browsePlaces, liveIds])
  const dedupedBrowseWorlds = useMemo(() => browseWorlds.filter(w => !liveIds.has(w.id)), [browseWorlds, liveIds])

  const isInitialLoading = isLoadingLive && isLoadingBrowse
  const isEmpty =
    !isInitialLoading && filteredLiveCards.length === 0 && dedupedBrowsePlaces.length === 0 && dedupedBrowseWorlds.length === 0

  return (
    <PageContent>
      <Helmet>
        <title>{t('social.home.page_title')}</title>
      </Helmet>

      <HeaderRow>
        <SearchField
          size="small"
          variant="outlined"
          placeholder={t('social.explore.search_placeholder')}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <SortSelect size="small" value={orderBy} onChange={e => setOrderBy(e.target.value as SocialOrderBy)}>
          {SORT_OPTIONS.map(opt => (
            <MenuItem key={opt} value={opt}>
              {t(`social.explore.sort.${opt}`)}
            </MenuItem>
          ))}
        </SortSelect>
      </HeaderRow>

      <CategoryRow>
        <CategoryChip
          label={t('social.explore.category.all')}
          $active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
          clickable
        />
        {SOCIAL_CATEGORIES.map(c => (
          <CategoryChip
            key={c}
            label={t(`social.explore.category.${c}`)}
            $active={activeCategory === c}
            onClick={() => setActiveCategory(c)}
            clickable
          />
        ))}
      </CategoryRow>

      {isInitialLoading ? (
        <Loader>
          <CircularProgress />
        </Loader>
      ) : isEmpty ? (
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

export { SocialHomePage }
