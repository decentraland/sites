/* eslint-disable @typescript-eslint/naming-convention */
import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { dclColors } from 'decentraland-ui2'
import { PinGlyph } from '../../components/discover/_shared/CardIcons'
import { SceneJumpInModal } from '../../components/discover/SceneJumpInModal'
import { SceneChatDock, SceneRoomMount, SceneWatcherCard } from '../../components/discover/SceneLiveWatcher'
import { getEnv } from '../../config/env'
import {
  buildJumpLandingHref,
  parsePositionParam,
  useGetDiscoverPlaceByPositionQuery,
  useGetDiscoverWorldByNameQuery,
  useGetHotScenesQuery,
  useGetLiveWorldsQuery
} from '../../features/discover'
import type { DiscoverPlace } from '../../features/discover'
import { fetchWorldScenes } from '../../features/discover/sceneAdapter'
import type { WorldSceneSummary } from '../../features/discover/sceneAdapter'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { usePageViewTracking } from '../../hooks/usePageViewTracking'
import { usePlaceCreator } from '../../hooks/usePlaceCreator'
import { useSceneRoom } from '../../hooks/useSceneRoom'
import {
  Avatar,
  ByText,
  ChatColumn,
  ChatFill,
  Content,
  CreatorName,
  CreatorRow,
  HeaderRight,
  InfoLabel,
  InfoPanel,
  InfoText,
  LocationTag,
  NotFound,
  NotFoundHint,
  ScenePickerLabel,
  ScenePickerRow,
  ScenePickerSelect,
  SceneTitle,
  ViewerCard,
  ViewerHeader
} from './DiscoverScenePage.styled'

interface DiscoverScenePageProps {
  kind: 'place' | 'world'
}

// Synthesize a minimal place when the places-api doesn't have the world
// indexed (private / brand-new / `show_in_places: false` worlds still have
// real worlds-content-server scenes and live users — we should render them).
function synthWorldPlace(worldName: string): DiscoverPlace {
  return {
    id: worldName.toLowerCase(),
    title: worldName,
    description: '',
    image: '',
    positions: [],
    owner: null,
    world: true,
    world_name: worldName
  }
}

// bevy-web iframe URL for the scene viewer. `systemScene=tortilla.dcl.eth
// &portables=none` strips the launcher and portables UI so only the scene
// renders inside the watcher card. `guest=1` auto-logs-in as a guest (no bevy
// sign-in screen) and `hud=0` hides bevy's entire React HUD (sidebar, chat,
// etc.) — this card supplies its own chrome. Worlds use ?realm=<name>; Genesis
// City uses ?position=x,y. The build's origin is env-driven (BEVY_WEB_URL):
// dev/stg point at .zone, prd at .org — .org's `frame-ancestors` CSP rejects a
// non-.org parent (e.g. localhost), so dev must frame the .zone build.
function buildBevyHref(location: string): string {
  const base = getEnv('BEVY_WEB_URL') || 'https://decentraland.zone/bevy-web/'
  const param = location.endsWith('.eth') ? `?realm=${encodeURIComponent(location)}` : `?position=${encodeURIComponent(location)}`
  return `${base}${param}&systemScene=tortilla.dcl.eth&portables=none&guest=1&hud=0`
}

function DiscoverScenePage({ kind }: DiscoverScenePageProps) {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const params = useParams<{ position?: string; name?: string }>()
  const location = useLocation()

  const parsedPosition = kind === 'place' ? parsePositionParam(params.position) : undefined
  const worldName = kind === 'world' ? params.name?.toLowerCase() ?? '' : ''

  // Cards hand the full place object through router state so the page paints
  // its real title / creator / cover on the first frame — no blank spinner
  // while the by-position fetch is in flight. Validated against this route's
  // params so stale history state from another scene can't leak through.
  const seedPlace = (location.state as { place?: DiscoverPlace } | null)?.place
  const seedMatches = useMemo(() => {
    if (!seedPlace) return false
    if (kind === 'world') return seedPlace.world_name?.toLowerCase() === worldName
    if (!parsedPosition) return false
    const positions = new Set(seedPlace.positions ?? [])
    if (seedPlace.base_position) positions.add(seedPlace.base_position)
    return positions.has(`${parsedPosition[0]},${parsedPosition[1]}`)
  }, [seedPlace, kind, worldName, parsedPosition])

  const placeQuery = useGetDiscoverPlaceByPositionQuery(parsedPosition ? { position: parsedPosition } : skipToken)
  const worldQuery = useGetDiscoverWorldByNameQuery(worldName ? { name: worldName } : skipToken)

  // For worlds, fall back to a synthesized place when the places-api 404s but
  // the world is still real on worlds-content-server (checked via worldScenes
  // below). For Genesis City parcels, place metadata IS expected.
  const apiPlace = kind === 'place' ? placeQuery.data : worldQuery.data
  const isLoading = kind === 'place' ? placeQuery.isLoading : worldQuery.isLoading

  // ── Live-presence gate ────────────────────────────────────────────────
  // Nobody in the scene → the watcher would render an empty world, so we show
  // the JUMP IN modal instead. Presence comes from the same real-time
  // sources the discover home uses (hot-scenes for Genesis City parcels,
  // worlds-content-server live-data for worlds) — NOT the stale places-api
  // `user_count` snapshot. Same query args as the home page so both surfaces
  // share one RTK cache entry and always agree on who's live.
  const hotScenesQuery = useGetHotScenesQuery(kind === 'place' ? { limit: 40 } : skipToken)
  const liveWorldsQuery = useGetLiveWorldsQuery(kind === 'world' ? undefined : skipToken)

  // Multi-scene worlds: enumerate scenes from worlds-content-server and let
  // the user pick. Single-scene worlds auto-select. For Genesis City this is
  // a no-op (we use the resolved sceneId from the catalyst inside the hook).
  const [worldScenes, setWorldScenes] = useState<WorldSceneSummary[]>([])
  const [worldScenesLoaded, setWorldScenesLoaded] = useState(false)
  // `null` from fetchWorldScenes = transient worlds-content-server failure.
  // Track it so the world synthesizes anyway (the gatekeeper can still
  // resolve the default scene) instead of rendering a false "not found".
  const [worldScenesUnknown, setWorldScenesUnknown] = useState(false)
  const [selectedScene, setSelectedScene] = useState<WorldSceneSummary | null>(null)
  useEffect(() => {
    if (kind !== 'world' || !worldName) {
      setWorldScenes([])
      setWorldScenesLoaded(true)
      setWorldScenesUnknown(false)
      setSelectedScene(null)
      return
    }
    let cancelled = false
    setWorldScenesLoaded(false)
    fetchWorldScenes(worldName).then(scenes => {
      if (cancelled) return
      setWorldScenes(scenes ?? [])
      setWorldScenesUnknown(scenes === null)
      setWorldScenesLoaded(true)
      setSelectedScene(scenes?.[0] ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [kind, worldName])

  // Effective place — apiPlace when known, else the router-state seed (so the
  // page renders immediately on a card click), else a synthesized stub for
  // worlds that worlds-content-server can resolve but places-api cannot.
  const place = useMemo<DiscoverPlace | undefined>(() => {
    if (apiPlace) return apiPlace
    if (seedMatches) return seedPlace
    if (kind === 'world' && worldName && (worldScenes.length > 0 || worldScenesUnknown)) return synthWorldPlace(worldName)
    return undefined
  }, [apiPlace, seedMatches, seedPlace, kind, worldName, worldScenes, worldScenesUnknown])

  // Match rule copied from DiscoverHomePage's live join: a hot scene counts
  // for this place only when its baseCoords is one of the place's parcels.
  // Matching by the hot scene's `parcels` array is wrong — neighbouring
  // places-api places can sit inside another scene's parcel envelope, which
  // inverted the live/empty gate (e.g. Exhibition Hall reading Bouncy
  // Castle's presence).
  const livePlayers = useMemo(() => {
    if (kind === 'place') {
      if (!place) return 0
      const positions = new Set<string>(place.positions ?? [])
      if (place.base_position) positions.add(place.base_position)
      if (parsedPosition) positions.add(`${parsedPosition[0]},${parsedPosition[1]}`)
      const scene = (hotScenesQuery.data ?? []).find(s => positions.has(`${s.baseCoords[0]},${s.baseCoords[1]}`))
      return scene?.usersTotalCount ?? 0
    }
    if (kind === 'world' && worldName) {
      const entry = (liveWorldsQuery.data ?? []).find(w => w.worldName?.toLowerCase() === worldName)
      return entry?.users ?? 0
    }
    return 0
  }, [kind, place, parsedPosition, worldName, hotScenesQuery.data, liveWorldsQuery.data])
  const isLoadingPlayers = kind === 'place' ? hotScenesQuery.isLoading : liveWorldsQuery.isLoading

  // The chat footer's "Jump into <Scene>" anchor points at the /jump/ landing
  // page (deep-link + download fallback), not a bare protocol link.
  const chatJumpHref = useMemo(() => (place ? buildJumpLandingHref(place) : null), [place])

  // `/places/*` is in `isPageTrackingExempt`, so Layout's route-level
  // `page()` is suppressed. Fire once the place title resolves so Segment
  // captures the scene name + kind. Stays silent on the loading frames.
  usePageViewTracking({
    name: place?.title,
    properties: place ? { kind, place_id: place.id, world: place.world_name ?? null } : undefined
  })

  const watcherTarget = useMemo<{ location: string; parcel?: string; sceneId?: string } | null>(() => {
    if (kind === 'place' && parsedPosition) return { location: `${parsedPosition[0]},${parsedPosition[1]}` }
    if (kind === 'world' && worldName) {
      const parcel = selectedScene?.base ?? place?.positions?.[0] ?? place?.base_position
      return { location: worldName, parcel, sceneId: selectedScene?.entityId }
    }
    return null
  }, [kind, parsedPosition, worldName, place, selectedScene])

  // Bevy-web can't run on touch devices, so mobile never mounts the watcher —
  // it shows the JUMP IN modal instead (see the gate below). Detect it up here
  // so we also skip opening the LiveKit room on mobile.
  const [, advancedUserAgent] = useAdvancedUserAgentData()
  const isMobile = Boolean(advancedUserAgent?.mobile)

  // Only open the LiveKit room when there are players AND we're on a device
  // that renders the watcher — the empty state and mobile never mount it.
  const { identity } = useAuthIdentity()
  const room = useSceneRoom({
    location: !isMobile && livePlayers > 0 ? watcherTarget?.location ?? '' : '',
    parcel: watcherTarget?.parcel,
    sceneId: watcherTarget?.sceneId,
    identity
  })

  const streamingHref = useMemo(() => (watcherTarget ? buildBevyHref(watcherTarget.location) : null), [watcherTarget])

  const { creatorName, creatorAvatar, avatarBg } = usePlaceCreator(place)

  // Coordinates (places) and the world name are known from the URL on the
  // first frame, so the header title never blanks even before the places-api
  // metadata resolves.
  const positionLabel = parsedPosition ? `${parsedPosition[0]},${parsedPosition[1]}` : undefined
  const headerTitle = place?.title ?? (kind === 'world' ? worldName : positionLabel) ?? ''
  // Location string shown in the header tag. World detail uses the world
  // name; place detail uses the base parcel coords.
  const locationLabel = kind === 'world' ? place?.world_name ?? worldName : place?.base_position ?? positionLabel ?? ''
  const showScenePicker = kind === 'world' && worldScenes.length > 1

  // Two independent readiness signals. Presence (hot-scenes / live-worlds) is
  // shared with the home grid so it's usually cached — it decides live vs
  // empty. Metadata (place-by-position) is a fresh fetch — it fills in the
  // title / description but must NOT block the layout: while it resolves we
  // render the real page chrome and let the watcher card show its own in-frame
  // spinner instead of a full-viewport blank loader.
  const isPresenceKnown = !isLoadingPlayers
  const isMetadataResolving = isLoading || (kind === 'world' && !worldScenesLoaded)
  const canRenderWatcher = Boolean(place && watcherTarget) && isPresenceKnown && (kind !== 'world' || worldScenesLoaded)

  // Honest not-found: everything settled and there's still no place / no
  // watcher target (invalid parcel, or a world with no scenes at all).
  if (!isMetadataResolving && isPresenceKnown && (!place || !watcherTarget)) {
    return (
      <Content>
        <NotFound>
          <SceneTitle>{t('discover.scene.not_found.title')}</SceneTitle>
          <NotFoundHint>{t('discover.scene.not_found.description')}</NotFoundHint>
        </NotFound>
      </Content>
    )
  }

  // Scene → JUMP IN modal instead of the watcher when EITHER the scene is empty
  // (a live watcher would render an empty world) OR we're on mobile (bevy-web
  // can't run on touch devices). On mobile the modal shows the LIVE + presence
  // badges when the scene has players; on desktop-empty `livePlayers` is 0 so
  // no badges render. Gated on presence being known so we never flash the modal
  // for a live scene while hot-scenes is still loading. Closing returns to the
  // discover grid.
  if (place && isPresenceKnown && (isMobile || livePlayers === 0)) {
    return (
      <>
        <Helmet>
          <title>{`${place.title} | Decentraland`}</title>
          <meta name="description" content={place.description ?? ''} />
        </Helmet>
        <SceneJumpInModal place={place} liveCount={livePlayers} onClose={() => navigate('/places')} />
      </>
    )
  }

  return (
    <SceneRoomMount credentials={room.credentials}>
      <Content>
        <Helmet>
          <title>{`${headerTitle} | Decentraland`}</title>
          <meta name="description" content={place?.description ?? ''} />
        </Helmet>

        <ViewerCard>
          <ViewerHeader>
            <SceneTitle>{headerTitle}</SceneTitle>
            <HeaderRight>
              {creatorName && (
                <CreatorRow>
                  {creatorAvatar && <Avatar src={creatorAvatar} alt="" loading="lazy" $bg={avatarBg} />}
                  <ByText>
                    {t('discover.card.by')} <CreatorName>{creatorName}</CreatorName>
                  </ByText>
                </CreatorRow>
              )}
              {locationLabel && (
                <LocationTag>
                  <PinGlyph size="clamp(13px, 0.833vw, 16px)" color={dclColors.neutral.softWhite} />
                  {locationLabel}
                </LocationTag>
              )}
            </HeaderRight>
          </ViewerHeader>
          <SceneWatcherCard
            status={canRenderWatcher ? room.status : 'loading'}
            streamingHref={streamingHref}
            coverImage={place?.image || undefined}
            place={place}
          />
        </ViewerCard>

        <ChatColumn>
          <ChatFill>
            <SceneChatDock status={canRenderWatcher ? room.status : 'loading'} sceneName={headerTitle} jumpHref={chatJumpHref} />
          </ChatFill>
        </ChatColumn>

        {(place?.description || showScenePicker) && (
          <InfoPanel>
            {showScenePicker && (
              <ScenePickerRow>
                <ScenePickerLabel>{t('discover.scene.scene_picker')}</ScenePickerLabel>
                <ScenePickerSelect
                  value={selectedScene?.entityId ?? ''}
                  onChange={event => {
                    const next = worldScenes.find(s => s.entityId === event.target.value) ?? null
                    setSelectedScene(next)
                  }}
                >
                  {worldScenes.map(s => (
                    <option key={s.entityId} value={s.entityId}>
                      {s.title} ({s.base})
                    </option>
                  ))}
                </ScenePickerSelect>
              </ScenePickerRow>
            )}
            {place?.description && (
              <>
                <InfoLabel>{t('discover.scene.what_to_expect')}</InfoLabel>
                <InfoText>{place.description}</InfoText>
              </>
            )}
          </InfoPanel>
        )}
      </Content>
    </SceneRoomMount>
  )
}

export { DiscoverScenePage }
