/* eslint-disable @typescript-eslint/naming-convention */
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { ConnectionStateToast, LiveKitRoom, RoomAudioRenderer, StartAudio, useTracks } from '@livekit/components-react'
import '@livekit/components-styles'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import { Track } from 'livekit-client'
import type { AuthIdentity } from '@dcl/crypto'
import { Button, CircularProgress } from 'decentraland-ui2'
import type { LiveKitCredentials } from '../../../features/cast2/cast2.types'
import { generateRandomName } from '../../../features/cast2/cast2.utils'
import { ChatProvider, useChatContext } from '../../../features/cast2/contexts/ChatProvider'
import { LiveKitProvider } from '../../../features/cast2/contexts/LiveKitContext'
import { fetchCastWatcherToken, fetchSceneAdapter, getLivePeerUrl } from '../../../features/social/sceneAdapter'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { ChatPanel } from '../../cast/ChatPanel/ChatPanel'
import { WatcherViewContent } from '../../cast/WatcherView/WatcherViewContent'
import { PeopleStack } from './PeopleStack'
import { SceneRoomContent } from './SceneRoomContent'
import {
  ChatBody,
  ChatDock,
  ControlsButtons,
  ControlsRow,
  IframeOpenButton,
  Placeholder,
  PlaceholderHint,
  PlaceholderTitle,
  SceneIframe,
  SceneLaunchCard,
  SceneLaunchHint,
  SceneLaunchOverlay,
  TabButton,
  TabStrip,
  VideoArea,
  WatcherContainer
} from './SceneLiveWatcher.styled'

interface UseSceneRoomArgs {
  location: string
  parcel?: string
  // For multi-scene worlds, the explicit entity hash to target. When absent
  // the gatekeeper resolves to the world's default scene.
  sceneId?: string
  // Logged-in identity from useAuthIdentity. When present, the gatekeeper
  // request is signed as the real wallet so chat messages publish under the
  // user's address (profile + claimed name resolve). Absent → guest identity.
  identity?: AuthIdentity
}

interface SceneRoomState {
  status: 'loading' | 'ready' | 'no-broadcast'
  mode: 'scene' | 'cast'
  credentials: LiveKitCredentials | null
  retry: () => void
}

// Hook owns credential fetching + retry. The page wraps the layout in
// <SceneRoomMount /> using these credentials. Split out from the display
// components so the LiveKitRoom div (which the LiveKit React SDK renders)
// can sit ABOVE the page grid, not inside it — otherwise it would break the
// grid-template-areas layout on SocialScenePage.
function useSceneRoom({ location, parcel, sceneId, identity: userIdentity }: UseSceneRoomArgs): SceneRoomState {
  const [credentials, setCredentials] = useState<LiveKitCredentials | null>(null)
  const [mode, setMode] = useState<'scene' | 'cast'>('scene')
  const [status, setStatus] = useState<SceneRoomState['status']>('loading')
  // Bumping this triggers a re-fetch in the effect below; useCallback `retry`
  // is just a stable handle the UI can call without taking a dep on the bump.
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt(n => n + 1), [])

  useEffect(() => {
    if (!location) return
    let cancelled = false
    setStatus('loading')
    setCredentials(null)

    const isWorld = location.endsWith('.eth')
    ;(async () => {
      const sceneCreds = await fetchSceneAdapter(
        isWorld ? { worldName: location, parcel, sceneId, identity: userIdentity } : { parcel: location, identity: userIdentity }
      )
      if (cancelled) return
      if (sceneCreds) {
        setCredentials({ url: sceneCreds.url, token: sceneCreds.token, identity: 'guest', roomId: '' })
        setMode('scene')
        setStatus('ready')
        return
      }
      const identity = generateRandomName()
      const castCreds = await fetchCastWatcherToken({ location, identity, parcel })
      if (cancelled) return
      if (castCreds) {
        setCredentials({ url: castCreds.url, token: castCreds.token, identity, roomId: '' })
        setMode('cast')
        setStatus('ready')
      } else {
        setStatus('no-broadcast')
      }
    })()

    return () => {
      cancelled = true
    }
    // Re-run when login state flips. `userIdentity` is memoized per-address by
    // useAuthIdentity, so this only fires on actual identity change — not on
    // every render.
  }, [location, parcel, sceneId, attempt, userIdentity])

  return { status, mode, credentials, retry }
}

// Conditionally wraps `children` in the LiveKit + Chat providers. When no
// credentials are available (loading / no broadcast), renders the children
// untouched so they can show placeholders. Uses the prod peer URL for the
// chat profile lookups so names + avatars match what /get-scene-adapter joined.
// PeopleStack inside SceneWatcherCard is the single source of truth for the
// participant profile lookup. ChatProvider piggy-backs on the same module-
// level profileCache (and now de-dupes in-flight requests), so we don't need
// a separate Prefetch component — saves a duplicate batch HTTP call.
function SceneRoomMount({ credentials, children }: { credentials: LiveKitCredentials | null; children: ReactNode }) {
  if (!credentials) return <>{children}</>
  return (
    <LiveKitProvider>
      <LiveKitRoom token={credentials.token} serverUrl={credentials.url} connect audio={false} video={false} screen={false}>
        <ChatProvider peerUrl={getLivePeerUrl()}>{children}</ChatProvider>
      </LiveKitRoom>
    </LiveKitProvider>
  )
}

type WatcherTab = 'video' | 'scene'

interface SceneWatcherCardProps {
  status: SceneRoomState['status']
  mode: SceneRoomState['mode']
  muted: boolean
  onToggleMute: () => void
  onRetry: () => void
  // bevy-web URL embedded in the iframe — usually the `scene viewer` variant
  // (no launcher / portables). Optional because Genesis City parcels with no
  // resolved sceneId can't deep-link; the SCENE WEB tab is disabled when
  // absent.
  streamingHref?: string | null
  // bevy-web URL for the OPEN FULL escape hatch — same scene without the
  // viewer-mode flags, so the new tab gets the full client. Falls back to
  // `streamingHref` when not provided.
  streamingExternalHref?: string | null
  // Cover image URL used as a darkened backdrop on the SCENE WEB launch
  // overlay. The scene's title / author / description already live in the
  // adjacent InfoCard sidebar, so we don't duplicate them here.
  coverImage?: string
}

// SceneWatcherCard is a thin router: it picks between loading / no-broadcast
// placeholders and the ready-state body. The ready body is its own component
// so it can safely call `useTracks` inside the LiveKit room context.
function SceneWatcherCard(props: SceneWatcherCardProps) {
  const t = useFormatMessage()

  if (props.status === 'loading') {
    return (
      <WatcherContainer>
        <VideoArea>
          <Placeholder>
            <CircularProgress size={32} />
            <PlaceholderHint>{t('social.scene.connecting')}</PlaceholderHint>
          </Placeholder>
        </VideoArea>
      </WatcherContainer>
    )
  }

  if (props.status === 'no-broadcast') {
    return (
      <WatcherContainer>
        <VideoArea>
          <Placeholder>
            <PlaceholderTitle>{t('social.scene.no_broadcast.title')}</PlaceholderTitle>
            <PlaceholderHint>{t('social.scene.no_broadcast.hint')}</PlaceholderHint>
            <Button variant="outlined" color="secondary" size="small" onClick={props.onRetry}>
              {t('social.scene.retry')}
            </Button>
          </Placeholder>
        </VideoArea>
      </WatcherContainer>
    )
  }

  return <SceneWatcherReady {...props} />
}

function SceneWatcherReady(props: SceneWatcherCardProps) {
  const { mode, muted, onToggleMute, streamingHref, streamingExternalHref, coverImage } = props
  const t = useFormatMessage()
  const videoAreaRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Watch published camera/screen-share tracks. The VIDEO tab is only shown
  // when at least one remote participant has an active (non-muted) video
  // track — empty rooms shouldn't advertise a video tab that has nothing
  // to show. Reacts live to publish / unpublish events.
  const videoTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { updateOnlyOn: [] })
  const hasLiveVideo = videoTracks.some(track => track.publication && !track.publication.isMuted)

  // Tab state. `videoAvailable` toggles availability of the VIDEO tab; we
  // keep the user on their current selection unless the video disappears
  // while they were on it (then jump to scene since VIDEO has nothing left).
  const [tab, setTab] = useState<WatcherTab>(hasLiveVideo ? 'video' : 'scene')
  useEffect(() => {
    if (!hasLiveVideo && tab === 'video') setTab('scene')
  }, [hasLiveVideo, tab])

  // Explicit launch gate. The bevy-web bundle is ~10MB and triggers a
  // multi-second cold start, so we don't auto-load it just because the user
  // landed on the SCENE WEB tab. Instead show a CTA overlay and only mount
  // the iframe when they click "Launch". Once launched, the iframe stays
  // mounted until the user closes it (then we go back to the launch overlay
  // and a re-click remounts a fresh bevy session).
  const [hasLaunchedScene, setHasLaunchedScene] = useState(false)
  const launchScene = useCallback(() => setHasLaunchedScene(true), [])

  // Video pause state. We keep the LiveKit room connected (chat + people
  // stack stay live) but hide the video surface and silence audio so the
  // user can stop watching without leaving the page. A re-click on the
  // overlay's resume CTA puts the video back.
  const [isVideoPaused, setIsVideoPaused] = useState(false)
  const resumeVideo = useCallback(() => setIsVideoPaused(false), [])

  // Unified close action — meaning depends on the current tab:
  //   • VIDEO  → pause the stream (overlay reappears with "Watch live")
  //   • SCENE  → unmount the bevy iframe (overlay reappears with "Launch")
  const closeMedia = useCallback(() => {
    if (tab === 'video') setIsVideoPaused(true)
    else setHasLaunchedScene(false)
  }, [tab])

  // Sync local fullscreen state with the browser (Esc, OS exit, etc.).
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === videoAreaRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = videoAreaRef.current
    if (!el) return
    if (document.fullscreenElement === el) {
      document.exitFullscreen().catch(() => undefined)
    } else {
      el.requestFullscreen().catch(error => {
        console.warn('[SceneLiveWatcher] fullscreen rejected', error)
      })
    }
  }, [])

  const showScene = tab === 'scene' && Boolean(streamingHref)
  // True when the watcher is presenting *something* (live video or the
  // bevy iframe). When false the launch / pause overlay covers the area.
  const isMediaActive = tab === 'video' ? !isVideoPaused : hasLaunchedScene && Boolean(streamingHref)
  return (
    <WatcherContainer>
      <TabStrip>
        {hasLiveVideo && (
          <TabButton type="button" $active={tab === 'video'} onClick={() => setTab('video')}>
            {t('social.scene.tab_video')}
          </TabButton>
        )}
        <TabButton
          type="button"
          $active={tab === 'scene'}
          disabled={!streamingHref}
          onClick={() => streamingHref && setTab('scene')}
          aria-disabled={!streamingHref}
        >
          {t('social.scene.tab_streaming')}
        </TabButton>
      </TabStrip>

      <VideoArea ref={videoAreaRef}>
        <PeopleStack />
        {/* Iframe is mounted only after the user clicks the launch CTA. Once
            mounted it stays mounted so subsequent VIDEO ↔ SCENE WEB toggles
            don't reload the 3D scene — just hidden via display:none. Closing
            (via CloseMediaButton) sets hasLaunchedScene=false which unmounts
            it; a fresh re-launch boots a clean session. */}
        {streamingHref && hasLaunchedScene && (
          <SceneIframe
            $visible={showScene}
            src={streamingHref}
            title={t('social.scene.tab_streaming')}
            sandbox="allow-scripts allow-same-origin allow-popups allow-pointer-lock allow-forms allow-modals"
            // `cross-origin-isolated` propagates the parent page's isolation
            // state into the iframe so the bevy client's `SharedArrayBuffer`
            // assets loader works (it errors with DataCloneError otherwise).
            // Requires COOP/COEP on the parent — set in vercel.json for the
            // /social/place/* and /social/world/* routes.
            allow="camera; microphone; clipboard-read; clipboard-write; fullscreen; xr-spatial-tracking; cross-origin-isolated"
          />
        )}
        {!isMediaActive && (
          <SceneLaunchOverlay $cover={coverImage}>
            <SceneLaunchCard>
              {tab === 'video' ? (
                <Button variant="contained" color="primary" size="large" startIcon={<PlayArrowRoundedIcon />} onClick={resumeVideo}>
                  {t('social.scene.resume_cta')}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<PlayArrowRoundedIcon />}
                  disabled={!streamingHref}
                  onClick={launchScene}
                >
                  {t('social.scene.launch_cta')}
                </Button>
              )}
              {tab === 'scene' && <SceneLaunchHint>{t('social.scene.launch_hint')}</SceneLaunchHint>}
            </SceneLaunchCard>
          </SceneLaunchOverlay>
        )}
        {showScene && hasLaunchedScene && (
          /* Decentraland's explorer currently sends X-Frame-Options: DENY, so
             most browsers block the embed. This overlay link is the working
             fallback. We point it at the unscoped bevy URL (no viewer-mode
             flags) so the new tab gets the full client with launcher +
             portables, while the iframe above stays in the slimmed-down
             viewer mode. Falls back to the iframe URL if the page didn't
             supply a separate external href. */
          <IframeOpenButton href={streamingExternalHref ?? streamingHref ?? '#'} target="_blank" rel="noopener noreferrer">
            <OpenInNewIcon style={{ fontSize: 14 }} />
            {t('social.scene.open_external')}
          </IframeOpenButton>
        )}
        {tab === 'video' && !isVideoPaused && (mode === 'scene' ? <SceneRoomContent /> : <WatcherViewContent />)}
      </VideoArea>

      <ControlsRow>
        <ControlsButtons>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            onClick={onToggleMute}
            disabled={tab !== 'video'}
          >
            {muted ? t('social.scene.unmute') : t('social.scene.mute')}
          </Button>
          {/* Fullscreen targets the whole video area (`videoAreaRef`), which
              wraps both the LiveKit video surface and the bevy iframe — so
              this works on either tab. Disable only when the scene tab has
              no streamingHref (nothing to fullscreen yet on a parcel with
              no resolved sceneId). */}
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            onClick={toggleFullscreen}
            disabled={tab === 'scene' && !streamingHref}
          >
            {isFullscreen ? t('social.scene.exit_fullscreen') : t('social.scene.fullscreen')}
          </Button>
          {/* STOP — context-aware: pauses the LiveKit video on the VIDEO tab,
              unmounts the bevy iframe on SCENE WEB. Hidden when there's
              nothing active to stop. Lives in the controls row alongside
              MUTE / FULLSCREEN rather than floating over the watcher area
              (where it collided with the top-right PeopleStack pill). */}
          {isMediaActive && (
            <Button variant="outlined" color="secondary" size="small" startIcon={<CloseRoundedIcon />} onClick={closeMedia}>
              {t('social.scene.close_media')}
            </Button>
          )}
        </ControlsButtons>
      </ControlsRow>

      {/* Silence LiveKit audio when: muted, on the SCENE WEB tab (bevy has
          its own ambient audio — don't stack them), or video is paused.
          LiveKit room stays connected so chat + presence keep working in
          the sidebar regardless of tab/pause state. */}
      <RoomAudioRenderer volume={muted || tab !== 'video' || isVideoPaused ? 0 : 1} />
      {/* Browsers block autoplay until a user gesture. StartAudio renders an
          overlay button only when audio is blocked; clicking it unblocks
          playback for the rest of the session. */}
      <StartAudio label={t('social.scene.enable_audio')} />
      <ConnectionStateToast />
    </WatcherContainer>
  )
}

// Live chat dock — only renders the real ChatPanel when status === 'ready'
// (i.e. inside SceneRoomMount with credentials).
function ChatDockInner() {
  const { chatMessages, markMessagesAsRead, setChatOpen } = useChatContext()

  // Always treat chat as "open" so unread counts clear and ChatPanel doesn't
  // try to collapse itself.
  useEffect(() => {
    setChatOpen(true)
    return () => setChatOpen(false)
  }, [setChatOpen])

  // No header / close button — ChatPanel renders its own "In-World Chat"
  // header. We omit onClose so the X button is hidden (chat is always open).
  return (
    <ChatDock>
      <ChatBody>
        <ChatPanel chatMessages={chatMessages} onMessagesRead={markMessagesAsRead} />
      </ChatBody>
    </ChatDock>
  )
}

function SceneChatDock({ status }: { status: SceneRoomState['status'] }) {
  const t = useFormatMessage()

  if (status === 'ready') return <ChatDockInner />

  return (
    <ChatDock>
      <ChatBody>
        <Placeholder>
          {status === 'loading' && <CircularProgress size={24} />}
          <PlaceholderHint>{t(status === 'loading' ? 'social.scene.connecting' : 'social.scene.no_broadcast.hint')}</PlaceholderHint>
        </Placeholder>
      </ChatBody>
    </ChatDock>
  )
}

export { SceneChatDock, SceneRoomMount, SceneWatcherCard, useSceneRoom }
