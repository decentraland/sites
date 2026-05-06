import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ConnectionStateToast, LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react'
import '@livekit/components-styles'
import { useGetWatcherTokenMutation, useLazyGetWorldScenesQuery } from '../../../features/cast2/cast2.client'
import { getCastErrorKey } from '../../../features/cast2/cast2.errors'
import type { LiveKitCredentials, WorldScene } from '../../../features/cast2/cast2.types'
import { generateRandomName } from '../../../features/cast2/cast2.utils'
import { ChatProvider } from '../../../features/cast2/contexts/ChatProvider'
import { useLiveKitCredentials } from '../../../features/cast2/contexts/LiveKitContext'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { ViewContainer as WatcherContainer } from '../CommonView/CommonView.styled'
import { ErrorModal } from '../ErrorModal'
import { LoadingScreen } from '../LoadingScreen/LoadingScreen'
import { WatcherOnboarding } from '../WatcherOnboarding/WatcherOnboarding'
import { WorldSceneSelector } from '../WorldSceneSelector/WorldSceneSelector'
import { WatcherViewWithChat } from './WatcherViewWithChat'

export function WatcherView() {
  const { t } = useCastTranslation()
  const { location, worldName, parcel: routeParcel } = useParams<{ location?: string; worldName?: string; parcel?: string }>()
  const { setStreamMetadata } = useLiveKitCredentials()

  const isWorldLocation = location?.includes('.dcl.eth')
  const effectiveWorldName = worldName || (isWorldLocation ? location : undefined)
  const effectiveLocation = effectiveWorldName?.toLowerCase() || location
  const isWorld = !!effectiveWorldName
  const needsSceneSelection = isWorld && !routeParcel

  const [selectedParcel, setSelectedParcel] = useState<string | undefined>(routeParcel)
  const [sceneSelectionDone, setSceneSelectionDone] = useState(!needsSceneSelection)

  // Scene loading state (only for worlds without a parcel in the URL)
  const [scenes, setScenes] = useState<WorldScene[]>([])
  const [isLoadingScenes, setIsLoadingScenes] = useState(needsSceneSelection)
  const [scenesError, setScenesError] = useState<string | null>(null)

  // Credentials state
  const [credentials, setCredentials] = useState<LiveKitCredentials | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false)
  const [isTabMuted, setIsTabMuted] = useState(false)
  const [fetchWorldScenes] = useLazyGetWorldScenesQuery()
  const [fetchWatcherToken] = useGetWatcherTokenMutation()

  // Phase 1: Fetch scenes for worlds that need selection
  useEffect(() => {
    if (!needsSceneSelection || !effectiveWorldName) return

    const fetchScenes = async () => {
      try {
        setIsLoadingScenes(true)
        setScenesError(null)
        const response = await fetchWorldScenes(effectiveWorldName).unwrap()
        setScenes(response.scenes)

        // Auto-select when there's only one scene
        if (response.scenes.length === 1) {
          const scene = response.scenes[0]
          const baseParcel = scene.entity?.metadata?.scene?.base || scene.parcels[0]
          setSelectedParcel(baseParcel)
          setSceneSelectionDone(true)
        }
      } catch (err) {
        console.error('[WatcherView] world-scenes failed:', err)
        setScenesError(t(getCastErrorKey(err, 'world_scenes')))
      } finally {
        setIsLoadingScenes(false)
      }
    }

    fetchScenes()
  }, [needsSceneSelection, effectiveWorldName, t, fetchWorldScenes])

  // Phase 2: Fetch credentials once scene selection is resolved
  useEffect(() => {
    if (!sceneSelectionDone) return

    if (!effectiveLocation) {
      setError('Location is required')
      return
    }

    const fetchCredentials = async () => {
      try {
        setIsLoadingCredentials(true)
        setError(null)

        const identity = generateRandomName()
        console.log('[WatcherView] Using identity:', identity)
        const liveKitCredentials = await fetchWatcherToken({ location: effectiveLocation, identity, parcel: selectedParcel }).unwrap()
        setCredentials(liveKitCredentials)

        setStreamMetadata({
          placeName: liveKitCredentials.placeName || effectiveLocation,
          location: effectiveLocation,
          isWorld
        })
      } catch (err) {
        console.error('[WatcherView] watcher-token failed:', err)
        setError(t(getCastErrorKey(err, 'watcher_token')))
      } finally {
        setIsLoadingCredentials(false)
      }
    }

    fetchCredentials()
  }, [sceneSelectionDone, effectiveLocation, selectedParcel, isWorld, t, setStreamMetadata, fetchWatcherToken])

  const handleSceneSelect = useCallback((parcel: string) => {
    setSelectedParcel(parcel)
    setSceneSelectionDone(true)
  }, [])

  const handleBackToSceneSelector = useCallback(() => {
    setSelectedParcel(undefined)
    setSceneSelectionDone(false)
    setCredentials(null)
    setError(null)
  }, [])

  const handleJoinRoom = useCallback(() => {
    setIsJoining(true)
    setTimeout(() => {
      setOnboardingComplete(true)
      setIsJoining(false)
    }, 500)
  }, [])

  const handleRoomConnect = useCallback(() => {}, [])

  const handleLeaveRoom = useCallback(() => {
    console.log('[WatcherView] Leaving room, returning to onboarding...')
    setOnboardingComplete(false)
  }, [])

  // Phase 1: Loading scenes
  if (isLoadingScenes) {
    return <LoadingScreen message={t('scene_selector.loading')} />
  }

  // Phase 1: Scene loading error
  if (scenesError) {
    return (
      <ErrorModal
        title={t('watcher_error_modal.title')}
        message={scenesError}
        onExit={() => {
          window.location.href = 'https://decentraland.org'
        }}
      />
    )
  }

  // Phase 1: Show scene selector for worlds with multiple scenes
  if (!sceneSelectionDone) {
    if (scenes.length === 0) {
      return (
        <ErrorModal
          title={t('watcher_error_modal.title')}
          message={t('scene_selector.no_scenes')}
          onExit={() => {
            window.location.href = 'https://decentraland.org'
          }}
        />
      )
    }
    return <WorldSceneSelector scenes={scenes} worldName={effectiveWorldName!} onSelect={handleSceneSelect} />
  }

  // Phase 2: Loading credentials
  if (isLoadingCredentials) {
    return <LoadingScreen message={t('watcher.connecting')} />
  }

  // Show error screen
  if (error) {
    const canGoBack = needsSceneSelection && scenes.length > 0
    return (
      <ErrorModal
        title={t('watcher_error_modal.title')}
        message={error}
        exitButtonText={canGoBack ? t('scene_selector.back') : undefined}
        onExit={
          canGoBack
            ? handleBackToSceneSelector
            : () => {
                window.location.href = 'https://decentraland.org'
              }
        }
      />
    )
  }

  // No credentials (shouldn't happen but handle gracefully)
  if (!credentials) {
    return (
      <ErrorModal
        title={t('watcher_error_modal.title')}
        message={t('watcher_error_modal.message')}
        onExit={() => {
          window.location.href = 'https://decentraland.org'
        }}
      />
    )
  }

  const streamName = credentials.placeName || credentials.roomName || effectiveLocation || 'Stream'

  // Show onboarding before connecting
  if (!onboardingComplete) {
    return <WatcherOnboarding streamName={streamName} onJoin={handleJoinRoom} isJoining={isJoining} />
  }

  return (
    <WatcherContainer>
      <LiveKitRoom
        token={credentials.token}
        serverUrl={credentials.url}
        connect={true}
        audio={false}
        video={false}
        screen={false}
        onConnected={handleRoomConnect}
      >
        <ChatProvider>
          <WatcherViewWithChat onLeave={handleLeaveRoom} isTabMuted={isTabMuted} onToggleTabMute={() => setIsTabMuted(prev => !prev)} />
        </ChatProvider>

        <RoomAudioRenderer volume={isTabMuted ? 0 : 1} />
        <ConnectionStateToast />
      </LiveKitRoom>
    </WatcherContainer>
  )
}
