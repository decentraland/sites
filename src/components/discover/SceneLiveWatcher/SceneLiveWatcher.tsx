/* eslint-disable @typescript-eslint/naming-convention */
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { ConnectionStateToast, LiveKitRoom, RoomAudioRenderer, useTracks } from '@livekit/components-react'
import '@livekit/components-styles'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import { Track } from 'livekit-client'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { Button, CircularProgress, Typography } from 'decentraland-ui2'
import type { LiveKitCredentials } from '../../../features/cast2/cast2.types'
import { ChatProvider, useChatContext } from '../../../features/cast2/contexts/ChatProvider'
import { LiveKitProvider } from '../../../features/cast2/contexts/LiveKitContext'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import type { DiscoverPlace } from '../../../features/discover'
import { getLivePeerUrl } from '../../../features/discover/sceneAdapter'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useDeferredTrack } from '../../../hooks/useDeferredTrack'
import type { SceneRoomState } from '../../../hooks/useSceneRoom'
import { DOWNLOAD_URLS, detectDownloadOS } from '../../../modules/downloadConstants'
import { SegmentEvent } from '../../../modules/segment.types'
import { assetUrl } from '../../../utils/assetUrl'
import { ChatPanel } from '../../cast/ChatPanel/ChatPanel'
import { ChatContainer, ChatFooter, ChatHeader, ChatMessages, EmptyChat, FooterLink } from '../../cast/ChatPanel/ChatPanel.styled'
import { WatcherViewContent } from '../../cast/WatcherView/WatcherViewContent'
import { JumpInGlyph } from '../_shared/CardIcons'
import { useDiscoverJumpIn } from '../DiscoverJumpInProvider'
import { PeopleStack } from './PeopleStack'
import { SceneRoomContent } from './SceneRoomContent'
import {
  BarExploreCta,
  BarJumpInCta,
  ChatBody,
  ChatDock,
  ControlButton,
  ControlsButtons,
  ControlsRow,
  JumpInFloat,
  MobileUnsupportedHint,
  MobileUnsupportedTitle,
  OverlayJumpInCta,
  Placeholder,
  PlaceholderHint,
  SceneIframe,
  SceneLaunchCard,
  SceneLaunchCtas,
  SceneLaunchOverlay,
  StoreBadgeImage,
  StoreBadgeLink,
  TabButton,
  TabStrip,
  VideoArea,
  WatcherContainer
} from './SceneLiveWatcher.styled'

// Participant stack over the viewer — hidden per product decision (the pill
// crowded the viewer). Flip to `true` to bring the presence stack back.
const SHOW_PEOPLE_COUNT = false

// Conditionally wraps `children` in the LiveKit + Chat providers. When no
// credentials are available (loading / no broadcast), renders the children
// untouched so they can show placeholders. Chat profile lookups use the same
// env-driven peer URL /get-scene-adapter joined, so names + avatars match.
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

// `<iframe credentialless>` opts the bevy-web frame into credentialless
// loading so it inherits our parent COEP: credentialless context and
// becomes cross-origin-isolated. Without it, Chrome refuses COI and
// bevy's worker postMessage of a SharedArrayBuffer throws DataCloneError.
// React strips unknown camelCase + boolean-empty attributes on iframe in
// some build paths, so we attach it via a ref after mount instead of
// rendering it as JSX. Idempotent.
function useCredentiallessIframeRef() {
  const ref = useRef<HTMLIFrameElement | null>(null)
  const setRef = useCallback((node: HTMLIFrameElement | null) => {
    ref.current = node
    if (node && !node.hasAttribute('credentialless')) node.setAttribute('credentialless', '')
  }, [])
  return setRef
}

// Shared fullscreen wiring for both watcher variants: syncs with the browser's
// fullscreenchange (Esc / OS exit) and toggles on the video-area element.
function useSceneFullscreen(videoAreaRef: React.MutableRefObject<HTMLDivElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === videoAreaRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [videoAreaRef])
  const toggleFullscreen = useCallback(() => {
    const el = videoAreaRef.current
    if (!el) return
    if (document.fullscreenElement === el) {
      document.exitFullscreen().catch(() => undefined)
    } else {
      el.requestFullscreen().catch(error => console.warn('[SceneLiveWatcher] fullscreen rejected', error))
    }
  }, [videoAreaRef])
  return { isFullscreen, toggleFullscreen }
}

// Tracked launch / jump-in intents shared by both watcher variants. JUMP IN
// routes through the shared discover launcher so a missing client falls back to
// the download modal (same as the cards); it needs the place, so callers pass
// it alongside the streaming href.
function useSceneCtas(streamingHref?: string | null, place?: DiscoverPlace | null) {
  const [hasLaunchedScene, setHasLaunchedScene] = useState(false)
  const track = useDeferredTrack()
  const { jumpIn: launch } = useDiscoverJumpIn()
  const launchScene = useCallback(() => {
    track(SegmentEvent.DISCOVER_LAUNCH_SCENE, { ...(streamingHref ? { href: streamingHref } : {}) })
    setHasLaunchedScene(true)
  }, [track, streamingHref])
  // NOTE (2026-08): DISCOVER_JUMP_IN on the 'scene-preview' surface now carries
  // the full place payload (via the shared launcher) instead of the old
  // `{ place: 'scene-preview', href }` — drops `href`, gains place_id/title/etc,
  // matching the card surfaces. No dashboard keyed on the old `href` field.
  const jumpIn = useCallback(() => {
    if (place) launch(place, 'scene-preview')
  }, [launch, place])
  return { hasLaunchedScene, setHasLaunchedScene, launchScene, jumpIn }
}

// Mobile "not supported" card — bevy-web can't run on touch devices, so the
// overlay offers the official store badge instead (same pill the Hero uses).
function MobileStoreCard() {
  const isAndroid = detectDownloadOS() === 'android'
  const t = useFormatMessage()
  return (
    <>
      <MobileUnsupportedTitle>{t('discover.scene.mobile_unsupported.title')}</MobileUnsupportedTitle>
      <MobileUnsupportedHint>{t('discover.scene.mobile_unsupported.hint')}</MobileUnsupportedHint>
      <StoreBadgeLink href={isAndroid ? DOWNLOAD_URLS.googlePlay : DOWNLOAD_URLS.appStore} target="_blank" rel="noopener noreferrer">
        <StoreBadgeImage
          src={isAndroid ? assetUrl('/google_play_cta.svg') : assetUrl('/download-on-the-app-store.svg')}
          alt={isAndroid ? 'Get it on Google Play' : 'Download on the App Store'}
        />
      </StoreBadgeLink>
    </>
  )
}

// Pre-launch CTAs: EXPLORE THE SCENE (boots the bevy iframe) + JUMP IN. They
// live in the bottom controls bar — replacing FULLSCREEN until the preview
// runs — so nothing floats over the scene thumbnail.
function LaunchCtas(props: { streamingHref?: string | null; canJumpIn?: boolean; onLaunch: () => void; onJumpIn: () => void }) {
  const { streamingHref, canJumpIn, onLaunch, onJumpIn } = props
  const t = useFormatMessage()
  return (
    <>
      <BarExploreCta type="button" disabled={!streamingHref} onClick={onLaunch}>
        {t('discover.scene.explore_scene')}
      </BarExploreCta>
      {canJumpIn && (
        <BarJumpInCta type="button" onClick={onJumpIn}>
          {t('discover.card.jump_in')}
          <JumpInGlyph size={20} />
        </BarJumpInCta>
      )}
    </>
  )
}

// Floating JUMP IN card pinned bottom-right while the bevy preview runs.
function JumpInFloatCard({ onJumpIn }: { onJumpIn: () => void }) {
  const t = useFormatMessage()
  return (
    <JumpInFloat>
      <SceneLaunchCard>
        <SceneLaunchCtas>
          <OverlayJumpInCta type="button" onClick={onJumpIn}>
            {t('discover.card.jump_in')}
            <JumpInGlyph size="calc(var(--vu) * 32)" />
          </OverlayJumpInCta>
        </SceneLaunchCtas>
      </SceneLaunchCard>
    </JumpInFloat>
  )
}

// The bevy-web iframe with the credentialless ref + sandbox/permission set.
function BevyIframe({ src, visible }: { src: string; visible: boolean }) {
  const t = useFormatMessage()
  const ref = useCredentiallessIframeRef()
  return (
    <SceneIframe
      ref={ref}
      $visible={visible}
      src={src}
      title={t('discover.scene.tab_streaming')}
      sandbox="allow-scripts allow-same-origin allow-popups allow-pointer-lock allow-forms allow-modals"
      allow="camera; microphone; clipboard-read; clipboard-write; fullscreen; xr-spatial-tracking; cross-origin-isolated"
    />
  )
}

interface SceneWatcherCardProps {
  status: SceneRoomState['status']
  mode: SceneRoomState['mode']
  // NOTE: the RETRY escape hatch was dropped — the Figma first-jump overlay
  // has no retry affordance; a reload re-attempts credentials.
  // The place the JUMP IN CTAs launch, via the shared discover launcher (so a
  // missing client falls back to the download modal). Its presence also gates
  // whether the JUMP IN CTAs render (launch overlay + floating card).
  place?: DiscoverPlace | null
  // bevy-web URL embedded in the iframe — usually the `scene viewer` variant
  // (no launcher / portables). Optional because Genesis City parcels with no
  // resolved sceneId can't deep-link; the SCENE WEB tab is disabled when
  // absent.
  streamingHref?: string | null
  // Cover image URL used as a darkened backdrop on the SCENE WEB launch
  // overlay. The scene's title / author / description already live in the
  // adjacent InfoCard sidebar, so we don't duplicate them here.
  coverImage?: string
  // Places-api `user_count` snapshot for this scene. Lets the PEOPLE
  // IN-WORLD badge render a real number on the first paint instead of
  // sitting at 0 for the seconds it takes the LiveKit room to connect
  // and resolve its participant list. Replaced by the live participant
  // count the moment LiveKit reports any peers.
  initialUserCount?: number
}

// SceneWatcherCard is a thin router: it picks between loading / no-broadcast
// placeholders and the ready-state body. The ready body is its own component
// so it can safely call `useTracks` inside the LiveKit room context.
function SceneWatcherCard(props: SceneWatcherCardProps) {
  const t = useFormatMessage()
  // Unconditional so the hook order never changes; only the loading frame uses these.
  const { launchScene, jumpIn } = useSceneCtas(props.streamingHref, props.place)

  if (props.status === 'loading') {
    // Same CTA bar as the ready states — EXPLORE stays disabled (nothing to boot
    // yet) so the card keeps its final height while the room connects.
    return (
      <WatcherContainer>
        <VideoArea>
          <Placeholder>
            <CircularProgress size={32} />
            <PlaceholderHint>{t('discover.scene.connecting')}</PlaceholderHint>
          </Placeholder>
        </VideoArea>
        <ControlsRow>
          <ControlsButtons>
            <LaunchCtas streamingHref={null} canJumpIn={Boolean(props.place)} onLaunch={launchScene} onJumpIn={jumpIn} />
          </ControlsButtons>
        </ControlsRow>
      </WatcherContainer>
    )
  }

  if (props.status === 'no-broadcast') {
    return <SceneOnlyWatcher {...props} />
  }

  return <SceneWatcherReady {...props} />
}

// No-broadcast variant: nobody is streaming yet, so the LiveKit room isn't
// mounted (`SceneRoomMount` renders children untouched without credentials)
// and any LiveKit hook would throw `useEnsureRoom`. The bevy iframe and
// fullscreen / launch UX don't depend on LiveKit at all, so render them
// in a stripped-down watcher: SCENE WEB tab only, no PeopleStack, no
// audio renderer, no chat hook.
function SceneOnlyWatcher(props: SceneWatcherCardProps) {
  const { streamingHref, coverImage, place } = props
  const t = useFormatMessage()
  const videoAreaRef = useRef<HTMLDivElement | null>(null)
  const { isFullscreen, toggleFullscreen } = useSceneFullscreen(videoAreaRef)
  const [, advancedUserAgent] = useAdvancedUserAgentData()
  const isMobile = Boolean(advancedUserAgent?.mobile)
  const { hasLaunchedScene, setHasLaunchedScene, launchScene, jumpIn } = useSceneCtas(streamingHref, place)
  const closeMedia = useCallback(() => setHasLaunchedScene(false), [setHasLaunchedScene])

  const showIframe = hasLaunchedScene && Boolean(streamingHref) && !isMobile

  return (
    <WatcherContainer>
      {/* NOTE: the single-tab strip was removed — the Figma viewer card has no
          tabs; the strip only renders in the ready variant when a live video
          broadcast adds a second surface to switch to. */}
      <VideoArea ref={videoAreaRef}>
        {showIframe && streamingHref && <BevyIframe src={streamingHref} visible />}
        {!showIframe && (
          <SceneLaunchOverlay $cover={coverImage}>
            {isMobile && (
              <SceneLaunchCard>
                <MobileStoreCard />
              </SceneLaunchCard>
            )}
          </SceneLaunchOverlay>
        )}
        {showIframe && place && <JumpInFloatCard onJumpIn={jumpIn} />}
      </VideoArea>

      <ControlsRow>
        <ControlsButtons>
          {!showIframe && !isMobile ? (
            <LaunchCtas streamingHref={streamingHref} canJumpIn={Boolean(place)} onLaunch={launchScene} onJumpIn={jumpIn} />
          ) : (
            <>
              <ControlButton type="button" onClick={toggleFullscreen} disabled={!showIframe}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                {isFullscreen ? t('discover.scene.exit_fullscreen') : t('discover.scene.fullscreen')}
              </ControlButton>
              {showIframe && (
                <ControlButton type="button" onClick={closeMedia}>
                  <CloseRoundedIcon />
                  {t('discover.scene.close_media')}
                </ControlButton>
              )}
            </>
          )}
        </ControlsButtons>
      </ControlsRow>
    </WatcherContainer>
  )
}

function SceneWatcherReady(props: SceneWatcherCardProps) {
  const { mode, streamingHref, coverImage, initialUserCount, place } = props
  const t = useFormatMessage()
  const videoAreaRef = useRef<HTMLDivElement | null>(null)
  const { isFullscreen, toggleFullscreen } = useSceneFullscreen(videoAreaRef)
  // Bevy-web doesn't support touch devices — its own iframe renders a
  // "Decentraland Web" / "not available on mobile" template that gets clipped
  // by our STOP/FULLSCREEN controls. Detect mobile here so we can short-
  // circuit to a clean Decentraland-styled version of that same template
  // and never mount the iframe.
  const [, advancedUserAgent] = useAdvancedUserAgentData()
  const isMobile = Boolean(advancedUserAgent?.mobile)

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
  const { hasLaunchedScene, setHasLaunchedScene, launchScene, jumpIn } = useSceneCtas(streamingHref, place)

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

  const showScene = tab === 'scene' && Boolean(streamingHref)
  // True when the watcher is presenting *something* (live video or the
  // bevy iframe). When false the launch / pause overlay covers the area.
  // On mobile the SCENE WEB tab can never become "media active" — we render
  // the not-supported template instead of mounting the bevy iframe.
  const isMediaActive = tab === 'video' ? !isVideoPaused : !isMobile && hasLaunchedScene && Boolean(streamingHref)
  return (
    <WatcherContainer>
      {/* Tabs only appear when a live video broadcast adds a second surface —
          the Figma viewer card is tabless in the plain bevy-scene case. */}
      {hasLiveVideo && (
        <TabStrip>
          <TabButton type="button" $active={tab === 'video'} onClick={() => setTab('video')}>
            {t('discover.scene.tab_video')}
          </TabButton>
          <TabButton
            type="button"
            $active={tab === 'scene'}
            disabled={!streamingHref}
            onClick={() => streamingHref && setTab('scene')}
            aria-disabled={!streamingHref}
          >
            {t('discover.scene.tab_streaming')}
          </TabButton>
        </TabStrip>
      )}

      <VideoArea ref={videoAreaRef}>
        {/* The mobile not-supported card occupies the full VideoArea and the
            pill anchored top-right would overlap its title. Hide the pill
            on mobile SCENE WEB tab — the people count still surfaces on the
            VIDEO tab and inside the watcher card status. */}
        {SHOW_PEOPLE_COUNT && !(isMobile && tab === 'scene') && <PeopleStack initialCount={initialUserCount} />}
        {/* Iframe is mounted only after the user clicks the launch CTA. Once
            mounted it stays mounted so subsequent VIDEO ↔ SCENE WEB toggles
            don't reload the 3D scene — just hidden via display:none. Closing
            (via CloseMediaButton) sets hasLaunchedScene=false which unmounts
            it; a fresh re-launch boots a clean session. */}
        {streamingHref && hasLaunchedScene && !isMobile && <BevyIframe src={streamingHref} visible={showScene} />}
        {!isMediaActive && (
          <SceneLaunchOverlay $cover={coverImage}>
            {(tab === 'video' || isMobile) && (
              <SceneLaunchCard>
                {tab === 'video' ? (
                  <Button variant="contained" color="primary" size="large" startIcon={<PlayArrowRoundedIcon />} onClick={resumeVideo}>
                    {t('discover.scene.resume_cta')}
                  </Button>
                ) : (
                  <MobileStoreCard />
                )}
              </SceneLaunchCard>
            )}
          </SceneLaunchOverlay>
        )}
        {/* While the bevy preview runs, JUMP IN stays pinned bottom-right so
            the native-client deep-link is always one click away. */}
        {isMediaActive && tab === 'scene' && place && <JumpInFloatCard onJumpIn={jumpIn} />}
        {tab === 'video' && !isVideoPaused && (mode === 'scene' ? <SceneRoomContent /> : <WatcherViewContent />)}
      </VideoArea>

      <ControlsRow>
        <ControlsButtons>
          {tab === 'scene' && !isMediaActive && !isMobile ? (
            <LaunchCtas streamingHref={streamingHref} canJumpIn={Boolean(place)} onLaunch={launchScene} onJumpIn={jumpIn} />
          ) : (
            <>
              <ControlButton type="button" onClick={toggleFullscreen} disabled={!isMediaActive}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                {isFullscreen ? t('discover.scene.exit_fullscreen') : t('discover.scene.fullscreen')}
              </ControlButton>
              {isMediaActive && (
                <ControlButton type="button" onClick={closeMedia}>
                  <CloseRoundedIcon />
                  {t('discover.scene.close_media')}
                </ControlButton>
              )}
            </>
          )}
        </ControlsButtons>
      </ControlsRow>

      {/* NOTE: the MUTE control was removed per design — audio is silenced
          on the SCENE WEB tab (bevy has its own ambient audio — don't stack
          them) and while video is paused. LiveKit stays connected so chat +
          presence keep working regardless of tab/pause state. */}
      <RoomAudioRenderer volume={tab !== 'video' || isVideoPaused ? 0 : 1} />
      {/* NOTE: LiveKit's <StartAudio> "Click to enable audio" overlay was
          removed per design — audio is silenced on the SCENE WEB tab (bevy
          owns ambient audio) and while video is paused, so the prompt was
          redundant and cluttered the controls area. Switching to the video
          tab is itself a user gesture, which resumes the audio context. */}
      <ConnectionStateToast />
    </WatcherContainer>
  )
}

// Live chat dock — only renders the real ChatPanel when status === 'ready'
// (i.e. inside SceneRoomMount with credentials).
interface SceneChatDockProps {
  status: SceneRoomState['status']
  // Scene title + decentraland:// deep-link for the footer's "Jump into
  // [Scene Name]..." line (Figma 2151:31513) -- the scene name renders as a
  // ruby link into the native client.
  sceneName?: string
  jumpHref?: string | null
}

function ChatDockInner({ sceneName, jumpHref }: Pick<SceneChatDockProps, 'sceneName' | 'jumpHref'>) {
  const { chatMessages, markMessagesAsRead, setChatOpen } = useChatContext()

  // Always treat chat as "open" so unread counts clear and ChatPanel doesn't
  // try to collapse itself.
  useEffect(() => {
    setChatOpen(true)
    return () => setChatOpen(false)
  }, [setChatOpen])

  // No header / close button — ChatPanel renders its own "In-World Chat"
  // header. We omit onClose so the X button is hidden (chat is always open).
  // ChatPanel is read-only everywhere (no send input) — the footer deep-links
  // viewers into the client to participate.
  return (
    <ChatDock>
      <ChatBody>
        <ChatPanel chatMessages={chatMessages} onMessagesRead={markMessagesAsRead} sceneName={sceneName} jumpHref={jumpHref ?? undefined} />
      </ChatBody>
    </ChatDock>
  )
}

function SceneChatDock(props: SceneChatDockProps) {
  const { status, sceneName, jumpHref } = props
  // The chat panel is ALWAYS visible (Figma 2151:35035): while the room is
  // connecting it renders the same shell as the empty ready state (header,
  // "No messages yet.", jump-in footer) rather than a spinner, so the column
  // never changes shape. When the room could NOT be joined ('no-broadcast' =
  // both the scene adapter and the cast fallback failed) the message says so
  // instead of impersonating an empty-but-healthy chat.
  const { t: tc } = useCastTranslation()

  if (status === 'ready') return <ChatDockInner sceneName={sceneName} jumpHref={jumpHref} />

  return (
    <ChatDock>
      <ChatBody>
        <ChatContainer>
          <ChatHeader>
            <Typography variant="h6">{tc('chat.title')}</Typography>
          </ChatHeader>
          <ChatMessages>
            <EmptyChat>
              <Typography variant="body2">{tc(status === 'no-broadcast' ? 'chat.unavailable' : 'chat.no_messages_yet')}</Typography>
            </EmptyChat>
          </ChatMessages>
          <ChatFooter>
            {jumpHref && sceneName ? (
              <Typography variant="body2">
                {tc('chat.footer_jump_prefix')}{' '}
                <FooterLink href={jumpHref} target="_blank" rel="noopener noreferrer">
                  {sceneName}
                </FooterLink>{' '}
                {tc('chat.footer_jump_suffix')}
              </Typography>
            ) : (
              <Typography variant="body2">{tc('chat.footer_text', { sceneName: sceneName ?? '' })}</Typography>
            )}
          </ChatFooter>
        </ChatContainer>
      </ChatBody>
    </ChatDock>
  )
}

export { SceneChatDock, SceneRoomMount, SceneWatcherCard }
