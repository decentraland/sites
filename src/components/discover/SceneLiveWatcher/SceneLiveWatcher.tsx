/* eslint-disable @typescript-eslint/naming-convention */
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { LiveKitRoom } from '@livekit/components-react'
import '@livekit/components-styles'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { CircularProgress, Typography } from 'decentraland-ui2'
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
import { JumpInGlyph } from '../_shared/CardIcons'
import { useDiscoverJumpIn } from '../DiscoverJumpInProvider'
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
  VideoArea,
  WatcherContainer
} from './SceneLiveWatcher.styled'

// Conditionally wraps `children` in the LiveKit + Chat providers. When no
// credentials are available (loading / no broadcast), renders the children
// untouched so they can show placeholders. Chat profile lookups use the same
// env-driven peer URL /get-scene-adapter joined, so names + avatars match.
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
// it alongside the streaming href. With `autoLaunch` the bevy preview boots on
// its own (desktop entry skips the EXPLORE gate). Auto-launch fires once per
// streaming href so an explicit CLOSE isn't fought — after closing, the
// EXPLORE CTA is the re-open path.
function useSceneCtas(streamingHref?: string | null, place?: DiscoverPlace | null, autoLaunch = false) {
  const [hasLaunchedScene, setHasLaunchedScene] = useState(false)
  const track = useDeferredTrack()
  const { jumpIn: launch } = useDiscoverJumpIn()
  const autoLaunchedHref = useRef<string | null>(null)
  const launchScene = useCallback(() => {
    track(SegmentEvent.DISCOVER_LAUNCH_SCENE, { ...(streamingHref ? { href: streamingHref } : {}) })
    setHasLaunchedScene(true)
  }, [track, streamingHref])
  useEffect(() => {
    if (!autoLaunch || !streamingHref || autoLaunchedHref.current === streamingHref) return
    autoLaunchedHref.current = streamingHref
    track(SegmentEvent.DISCOVER_LAUNCH_SCENE, { href: streamingHref, auto: true })
    setHasLaunchedScene(true)
  }, [autoLaunch, streamingHref, track])
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
  // NOTE: the RETRY escape hatch was dropped — the Figma first-jump overlay
  // has no retry affordance; a reload re-attempts credentials.
  // The place the JUMP IN CTAs launch, via the shared discover launcher (so a
  // missing client falls back to the download modal). Its presence also gates
  // whether the JUMP IN CTAs render (launch overlay + floating card).
  place?: DiscoverPlace | null
  // bevy-web URL embedded in the iframe — usually the `scene viewer` variant
  // (no launcher / portables). Optional because Genesis City parcels with no
  // resolved sceneId can't deep-link; the preview is disabled when absent.
  streamingHref?: string | null
  // Cover image URL used as a darkened backdrop on the launch overlay. The
  // scene's title / author / description already live in the adjacent
  // InfoCard sidebar, so we don't duplicate them here.
  coverImage?: string
}

// SceneWatcherCard is a thin router: the connecting frame while credentials
// resolve, then the bevy watcher body ('ready' and 'no-broadcast' render the
// same body — chat availability is the only difference, and that lives in
// SceneChatDock).
function SceneWatcherCard(props: SceneWatcherCardProps) {
  const t = useFormatMessage()
  // Unconditional so the hook order never changes; only the loading frame uses these.
  const { jumpIn } = useSceneCtas(props.streamingHref, props.place)

  if (props.status === 'loading') {
    // The preview auto-boots on desktop once the room resolves, so the
    // connecting bar mirrors the running state that follows: a disabled
    // FULLSCREEN placeholder (keeps the card height) + the JUMP IN launcher.
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
            <ControlButton type="button" disabled>
              <FullscreenIcon />
              {t('discover.scene.fullscreen')}
            </ControlButton>
            {props.place && (
              <BarJumpInCta type="button" onClick={jumpIn}>
                {t('discover.card.jump_in')}
                <JumpInGlyph size={20} />
              </BarJumpInCta>
            )}
          </ControlsButtons>
        </ControlsRow>
      </WatcherContainer>
    )
  }

  return <SceneWatcherBody {...props} />
}

// The watcher body: the bevy iframe plus fullscreen / launch / jump-in
// chrome. Deliberately free of LiveKit hooks — in the 'no-broadcast' state
// the room isn't mounted (`SceneRoomMount` renders children untouched
// without credentials) and any LiveKit hook would throw `useEnsureRoom`.
// NOTE (2026-08): the VIDEO tab (live LiveKit broadcast surface) was removed
// per product decision — the scene preview is the only surface, so the tab
// strip, video pause state, and room audio renderer went with it. Broadcast
// viewing lives on /cast.
function SceneWatcherBody(props: SceneWatcherCardProps) {
  const { streamingHref, coverImage, place } = props
  const t = useFormatMessage()
  const videoAreaRef = useRef<HTMLDivElement | null>(null)
  const { isFullscreen, toggleFullscreen } = useSceneFullscreen(videoAreaRef)
  // UA detection resolves async (client hints) — `mobile` is undefined on the
  // first commit, so hold auto-launch until it settles or phones would boot
  // (and track) a preview they can never render.
  const [isLoadingUserAgent, advancedUserAgent] = useAdvancedUserAgentData()
  const isMobile = Boolean(advancedUserAgent?.mobile)
  const { hasLaunchedScene, setHasLaunchedScene, launchScene, jumpIn } = useSceneCtas(
    streamingHref,
    place,
    !isLoadingUserAgent && !isMobile
  )
  const closeMedia = useCallback(() => setHasLaunchedScene(false), [setHasLaunchedScene])

  const showIframe = hasLaunchedScene && Boolean(streamingHref) && !isMobile

  return (
    <WatcherContainer>
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
