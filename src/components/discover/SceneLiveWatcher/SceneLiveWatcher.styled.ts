import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { safeCssUrl } from '../../blog/utils/safeCssUrl'

// Watcher card on the left column of the scene detail page. Stacks the
// tab strip + video area + thin controls row, with the live/people pills
// floating on top of the video.
const WatcherContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.spacing(1.5),
  overflow: 'hidden',
  backgroundColor: dclColors.blackTransparent.backdrop,
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  display: 'flex',
  flexDirection: 'column'
}))

// Slim tab strip above the video area. VIDEO switches to the LiveKit comms
// room (chat + voice + any publisher in the scene). STREAMING SCENE swaps
// the video panel for a bevy-web iframe rendering the actual 3D scene.
const TabStrip = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'stretch',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0, 1.5),
  minHeight: 40,
  borderBottom: `1px solid ${dclColors.whiteTransparent.subtle}`,
  backgroundColor: dclColors.blackTransparent.blurry
}))

interface TabButtonProps {
  $active?: boolean
}

const TabButton = styled('button', { shouldForwardProp: prop => prop !== '$active' })<TabButtonProps>(({ theme, $active }) => ({
  position: 'relative',
  appearance: 'none',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textTransform: 'uppercase',
  fontWeight: 700,
  letterSpacing: '0.08em',
  fontSize: 11,
  padding: theme.spacing(0, 1.5),
  color: $active ? dclColors.neutral.softWhite : dclColors.neutral.gray3,
  transition: 'color 150ms ease',
  ['&:hover']: { color: dclColors.neutral.softWhite },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: -2 },
  ['&::after']: {
    content: '""',
    position: 'absolute',
    left: theme.spacing(1),
    right: theme.spacing(1),
    bottom: 0,
    height: 2,
    borderRadius: '2px 2px 0 0',
    backgroundColor: $active ? theme.palette.primary.main : 'transparent'
  }
}))

// Iframe for the bevy-web streaming-scene tab. We mark it sandbox-permissive
// (allow-scripts, allow-same-origin, allow-popups, allow-pointer-lock) so the
// 3D client can run. DCL serves it with `X-Frame-Options: DENY` today, which
// browsers enforce regardless — the overlay button below is the practical
// fallback until that header is relaxed.
// `$visible` toggles display so the iframe stays mounted while the user
// switches to the VIDEO tab — without it the bevy scene reloads on every
// tab switch (cold start = many seconds of asset download).
const SceneIframe = styled('iframe', { shouldForwardProp: prop => prop !== '$visible' })<{ $visible?: boolean }>(({ $visible }) => ({
  width: '100%',
  height: '100%',
  border: 'none',
  display: $visible === false ? 'none' : 'block',
  background: '#0d0418'
}))

// Pre-launch placeholder shown when the SCENE WEB tab is selected but the
// user hasn't clicked the "Launch" CTA yet. Avoids auto-downloading the
// heavy bevy bundle for users who never want to interact with the 3D scene.
// The optional cover image renders as a darkened backdrop so it reads like
// a scene preview card rather than a generic loading state.
interface SceneLaunchOverlayProps {
  $cover?: string
}

const SceneLaunchOverlay = styled(Box, { shouldForwardProp: prop => prop !== '$cover' })<SceneLaunchOverlayProps>(({ $cover }) => ({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: dclColors.neutral.softWhite,
  // Cover image as a backdrop with a soft dark scrim — keeps the scene
  // recognizable while ensuring enough contrast for the centered CTA.
  // No radial focus — the glass card's blur + border already separates the
  // CTA from the photo, and over-darkening the cover was making the page
  // feel like a generic loading screen.
  // `safeCssUrl` percent-encodes any quotes and rejects non-https values so
  // a CMS-provided URL containing `")` can't escape the url(...) wrapper.
  backgroundImage: $cover
    ? `linear-gradient(180deg, rgba(13,4,24,0.4) 0%, rgba(13,4,24,0.7) 100%), url("${safeCssUrl($cover)}")`
    : 'linear-gradient(135deg, rgba(46,26,74,0.85) 0%, rgba(13,4,24,0.95) 100%)',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}))

// Compact glass pill that hosts the launch CTA + helper caption. Avoids
// duplicating scene info (title / author / description) — those already
// live in the InfoCard sidebar next to the watcher. Keeping the overlay
// minimal gives the cover image room to breathe and the CTA a single
// clear focal point.
const SceneLaunchCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1.25),
  padding: theme.spacing(2.5, 3),
  borderRadius: theme.spacing(2),
  backgroundColor: 'rgba(13,4,24,0.5)',
  backdropFilter: 'blur(8px)',
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  textAlign: 'center'
}))

const SceneLaunchHint = styled(Typography)({
  fontSize: 12,
  color: dclColors.neutral.gray3,
  maxWidth: 320,
  lineHeight: 1.4
})

// Mirrors the bevy-web "experience not available on mobile" template
// (`Decentraland Web` headline + store CTA) but rendered in Decentraland's
// own type/color tokens. Used in place of the EXPLORE SCENE launch overlay
// on touch devices, so we never mount the bevy iframe there — bevy's own
// fallback was getting clipped by our MUTE/FULLSCREEN/STOP controls.
const MobileUnsupportedTitle = styled(Typography)({
  fontSize: 20,
  fontWeight: 700,
  lineHeight: 1.24,
  color: dclColors.neutral.softWhite
})

const MobileUnsupportedHint = styled(Typography)({
  fontSize: 13,
  color: dclColors.neutral.gray3,
  maxWidth: 320,
  lineHeight: 1.45
})

// Store-badge wrapper — same brand-red pill the landing Hero uses for
// "Get it on Google Play" / "Download on the App Store" so the mobile
// fallback CTA across /sites stays visually identical regardless of
// surface. Inlined (rather than imported from Home/shared) to keep
// /discover decoupled from landing-page internals.
const StoreBadgeLink = styled('a')({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'calc(100% - 32px)',
  maxWidth: 280,
  height: 56,
  borderRadius: 12,
  backgroundColor: '#FF2D55',
  textDecoration: 'none',
  cursor: 'pointer',
  boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px',
  ['&:hover']: { opacity: 0.9 },
  ['&:active']: { opacity: 0.8 }
})

const StoreBadgeImage = styled('img')({
  height: 36,
  width: 'auto'
})

const IframeOpenButton = styled('a')(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(1.5),
  right: theme.spacing(1.5),
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  height: 32,
  padding: theme.spacing(0, 1.5),
  borderRadius: 999,
  backgroundColor: dclColors.blackTransparent.backdrop,
  color: dclColors.neutral.softWhite,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  zIndex: 2,
  ['&:hover']: { backgroundColor: dclColors.neutral.softBlack1 },
  ['& svg']: { fontSize: 14 }
}))

const VideoArea = styled(Box)({
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  background: '#0d0418',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  ['& video']: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  }
})

const ControlsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 1.5),
  borderTop: `1px solid ${dclColors.whiteTransparent.subtle}`,
  backgroundColor: dclColors.blackTransparent.blurry,
  minHeight: 44
}))

const ControlsButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1)
}))

const Placeholder = styled(Box)(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
  color: dclColors.neutral.gray3,
  padding: theme.spacing(4),
  textAlign: 'center'
}))

const PlaceholderTitle = styled(Typography)({
  fontSize: 13,
  fontWeight: 700,
  color: dclColors.neutral.softWhite,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
})

const PlaceholderHint = styled(Typography)({
  fontSize: 13,
  color: dclColors.neutral.gray3,
  maxWidth: 480,
  lineHeight: 1.5
})

// Permanent chat dock. Fills the parent (which sets a fixed pixel height in
// DiscoverScenePage.styled), and constrains the cast2 ChatPanel's internals
// so they fit the smaller sidebar layout.
const ChatDock = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  borderRadius: theme.spacing(1.5),
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #2e1a4a 0%, #1a0b2e 100%)',
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  display: 'flex',
  flexDirection: 'column'
}))

// Trims the cast2 ChatPanel internals so it fits inside a compact sidebar.
// Container that fills the parent (ChatDock has a fixed height) and lets the
// embedded ChatPanel size itself within. We only constrain the direct child's
// box model — never reach in via descendant `className` selectors, which
// would silently break the moment ChatPanel's internal style class names
// change (CLAUDE.md "no className-targeted styled selectors").
const ChatBody = styled(Box)({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  ['& > *']: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }
})

export {
  ChatBody,
  ChatDock,
  ControlsButtons,
  ControlsRow,
  IframeOpenButton,
  Placeholder,
  PlaceholderHint,
  PlaceholderTitle,
  SceneIframe,
  MobileUnsupportedHint,
  MobileUnsupportedTitle,
  StoreBadgeImage,
  StoreBadgeLink,
  SceneLaunchCard,
  SceneLaunchHint,
  SceneLaunchOverlay,
  TabButton,
  TabStrip,
  VideoArea,
  WatcherContainer
}
