/* eslint-disable @typescript-eslint/naming-convention */
import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { CircularProgress } from 'decentraland-ui2'
import { SceneChatDock, SceneRoomMount, SceneWatcherCard, useSceneRoom } from '../../components/social/SceneLiveWatcher'
import { buildJumpInHref, parsePositionParam, useGetSocialPlaceByPositionQuery, useGetSocialWorldByNameQuery } from '../../features/social'
import type { SocialPlace } from '../../features/social'
import { fetchWorldScenes } from '../../features/social/sceneAdapter'
import type { WorldSceneSummary } from '../../features/social/sceneAdapter'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import {
  ChatArea,
  Content,
  HeroArea,
  InfoCard,
  LoaderWrap,
  NotFound,
  NotFoundHint,
  PrimaryButton,
  SceneCoords,
  SceneDescription,
  ScenePickerLabel,
  ScenePickerRow,
  ScenePickerSelect,
  SceneTitle,
  TitleStack
} from './SocialScenePage.styled'

interface SocialScenePageProps {
  kind: 'place' | 'world'
}

// Synthesize a minimal place when the places-api doesn't have the world
// indexed (private / brand-new / `show_in_places: false` worlds still have
// real worlds-content-server scenes and live users — we should render them).
function synthWorldPlace(worldName: string): SocialPlace {
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

// Two bevy-web URLs for the SCENE WEB tab:
//   • `iframe` — appends `systemScene=sceneviewer.dcl.eth&portables=none` for
//     "scene viewer" mode. Strips the launcher and portables UI so only the
//     scene renders inside the watcher card.
//   • `external` — no extras, so the OPEN FULL link opens the full bevy-web
//     client (launcher, portables, etc.) for the same scene.
// Worlds use ?realm=<name>; Genesis City uses ?position=x,y. We point at
// decentraland.zone (the hosted bevy-web build) — same target opendcl-studio
// links to.
function buildBevyHrefs(location: string): { iframe: string; external: string } {
  const base = 'https://decentraland.zone/bevy-web/'
  const param = location.endsWith('.eth') ? `?realm=${encodeURIComponent(location)}` : `?position=${encodeURIComponent(location)}`
  const external = `${base}${param}`
  return { iframe: `${external}&systemScene=sceneviewer.dcl.eth&portables=none`, external }
}

function SocialScenePage({ kind }: SocialScenePageProps) {
  const t = useFormatMessage()
  const params = useParams<{ position?: string; name?: string }>()
  const [muted, setMuted] = useState(false)

  const parsedPosition = kind === 'place' ? parsePositionParam(params.position) : undefined
  const worldName = kind === 'world' ? params.name?.toLowerCase() ?? '' : ''

  const placeQuery = useGetSocialPlaceByPositionQuery(parsedPosition ? { position: parsedPosition } : skipToken)
  const worldQuery = useGetSocialWorldByNameQuery(worldName ? { name: worldName } : skipToken)

  // For worlds, fall back to a synthesized place when the places-api 404s but
  // the world is still real on worlds-content-server (checked via worldScenes
  // below). For Genesis City parcels, place metadata IS expected.
  const apiPlace = kind === 'place' ? placeQuery.data : worldQuery.data
  const isLoading = kind === 'place' ? placeQuery.isLoading : worldQuery.isLoading

  // Multi-scene worlds: enumerate scenes from worlds-content-server and let
  // the user pick. Single-scene worlds auto-select. For Genesis City this is
  // a no-op (we use the resolved sceneId from the catalyst inside the hook).
  const [worldScenes, setWorldScenes] = useState<WorldSceneSummary[]>([])
  const [worldScenesLoaded, setWorldScenesLoaded] = useState(false)
  const [selectedScene, setSelectedScene] = useState<WorldSceneSummary | null>(null)
  useEffect(() => {
    if (kind !== 'world' || !worldName) {
      setWorldScenes([])
      setWorldScenesLoaded(true)
      setSelectedScene(null)
      return
    }
    let cancelled = false
    setWorldScenesLoaded(false)
    fetchWorldScenes(worldName).then(scenes => {
      if (cancelled) return
      setWorldScenes(scenes)
      setWorldScenesLoaded(true)
      setSelectedScene(scenes[0] ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [kind, worldName])

  // Effective place — apiPlace when known, synthesized stub for worlds that
  // worlds-content-server can resolve but places-api cannot.
  const place = useMemo<SocialPlace | undefined>(() => {
    if (apiPlace) return apiPlace
    if (kind === 'world' && worldName && worldScenes.length > 0) return synthWorldPlace(worldName)
    return undefined
  }, [apiPlace, kind, worldName, worldScenes])

  const jumpInHref = useMemo(() => (place ? buildJumpInHref(place) : null), [place])

  const watcherTarget = useMemo<{ location: string; parcel?: string; sceneId?: string } | null>(() => {
    if (kind === 'place' && parsedPosition) return { location: `${parsedPosition[0]},${parsedPosition[1]}` }
    if (kind === 'world' && worldName) {
      const parcel = selectedScene?.base ?? place?.positions?.[0] ?? place?.base_position
      return { location: worldName, parcel, sceneId: selectedScene?.entityId }
    }
    return null
  }, [kind, parsedPosition, worldName, place, selectedScene])

  const { identity } = useAuthIdentity()
  const room = useSceneRoom({
    location: watcherTarget?.location ?? '',
    parcel: watcherTarget?.parcel,
    sceneId: watcherTarget?.sceneId,
    identity
  })

  const { streamingHref, streamingExternalHref } = useMemo<{
    streamingHref: string | null
    streamingExternalHref: string | null
  }>(() => {
    if (!watcherTarget) return { streamingHref: null, streamingExternalHref: null }
    const { iframe, external } = buildBevyHrefs(watcherTarget.location)
    return { streamingHref: iframe, streamingExternalHref: external }
  }, [watcherTarget])

  // Loading: place metadata still in-flight, OR (for worlds) we haven't yet
  // checked whether the world exists on worlds-content-server.
  if (isLoading || (kind === 'world' && !worldScenesLoaded)) {
    return (
      <Content>
        <LoaderWrap>
          <CircularProgress />
        </LoaderWrap>
      </Content>
    )
  }

  // Honest not-found: parcel param invalid, or world has no scenes at all.
  if (!place || !watcherTarget) {
    return (
      <Content>
        <NotFound>
          <SceneTitle>{t('social.scene.not_found.title')}</SceneTitle>
          <NotFoundHint>{t('social.scene.not_found.description')}</NotFoundHint>
        </NotFound>
      </Content>
    )
  }

  const positionLabel = parsedPosition ? `${parsedPosition[0]},${parsedPosition[1]}` : undefined
  const subtitleParts = [
    kind === 'world' ? t('social.scene.world_label') : t('social.scene.parcel_label'),
    kind === 'world' ? place.world_name ?? worldName : place.base_position ?? positionLabel ?? ''
  ]
  const subtitle = subtitleParts.filter(Boolean).join(' · ')
  const showScenePicker = kind === 'world' && worldScenes.length > 1

  return (
    <SceneRoomMount credentials={room.credentials}>
      <Content>
        <Helmet>
          <title>{`${place.title} | Decentraland`}</title>
          <meta name="description" content={place.description ?? ''} />
        </Helmet>

        <HeroArea>
          <SceneWatcherCard
            status={room.status}
            mode={room.mode}
            muted={muted}
            onToggleMute={() => setMuted(prev => !prev)}
            onRetry={room.retry}
            streamingHref={streamingHref}
            streamingExternalHref={streamingExternalHref}
            coverImage={place.image || undefined}
          />
          <InfoCard>
            <TitleStack>
              <SceneTitle>{place.title}</SceneTitle>
              <SceneCoords>{subtitle}</SceneCoords>
            </TitleStack>
            {place.description && <SceneDescription>{place.description}</SceneDescription>}
            {showScenePicker && (
              <ScenePickerRow>
                <ScenePickerLabel>{t('social.scene.scene_picker')}</ScenePickerLabel>
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
            {jumpInHref && (
              <PrimaryButton
                variant="contained"
                color="primary"
                onClick={() => {
                  window.location.href = jumpInHref
                }}
              >
                {t('social.scene.jump_in')}
              </PrimaryButton>
            )}
          </InfoCard>
        </HeroArea>

        <ChatArea>
          <SceneChatDock status={room.status} />
        </ChatArea>
      </Content>
    </SceneRoomMount>
  )
}

export { SocialScenePage }
