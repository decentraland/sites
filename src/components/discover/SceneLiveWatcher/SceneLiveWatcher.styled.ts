import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { safeCssUrl } from '../../../utils/safeCssUrl'
import { SCENE_PANEL_GRADIENT } from '../_shared/DiscoverShell.styled'

// Watcher card on the left column of the scene detail page. Stacks the
// video area + thin controls row.
// Frameless: the page's ViewerCard supplies the 24px rounding + clipping, and
// the header bar above / controls bar below complete the Figma card chrome.
const WatcherContainer = styled(Box)({
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: dclColors.blackTransparent.backdrop,
  display: 'flex',
  flexDirection: 'column'
})

// Iframe for the bevy-web scene preview. We mark it sandbox-permissive
// (allow-scripts, allow-same-origin, allow-popups, allow-pointer-lock) so the
// 3D client can run. DCL serves it with `X-Frame-Options: DENY` today, which
// browsers enforce regardless — the overlay button below is the practical
// fallback until that header is relaxed.
// `$visible` keeps the iframe mounted while hidden so a re-show doesn't
// cold-start the scene (many seconds of asset download).
const SceneIframe = styled('iframe', { shouldForwardProp: prop => prop !== '$visible' })<{ $visible?: boolean }>(({ $visible }) => ({
  width: '100%',
  height: '100%',
  border: 'none',
  display: $visible === false ? 'none' : 'block',
  background: '#0d0418'
}))

// Placeholder under the preview: mobile's store card, and desktop's
// stopped state (after CLOSE, before an EXPLORE re-launch). The optional
// cover image renders as a darkened backdrop so it reads like a scene
// preview card rather than a generic loading state.
interface SceneLaunchOverlayProps {
  $cover?: string
}

const SceneLaunchOverlay = styled(Box, { shouldForwardProp: prop => prop !== '$cover' })<SceneLaunchOverlayProps>(({ $cover }) => ({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  // CTA card sits at the bottom edge, not centered — a centered card was
  // covering the scene thumbnail (product 2026-07).
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: 'calc(var(--vu) * 24)',
  color: dclColors.neutral.softWhite,
  // Cover image as a backdrop with a soft dark scrim — keeps the scene
  // recognizable while ensuring enough contrast for the centered CTA.
  // No radial focus — the glass card's blur + border already separates the
  // CTA from the photo, and over-darkening the cover was making the page
  // feel like a generic loading screen.
  // `safeCssUrl` percent-encodes any quotes and rejects non-https values so
  // a CMS-provided URL containing `")` can't escape the url(...) wrapper.
  backgroundImage: $cover
    ? `linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url("${safeCssUrl($cover)}")`
    : 'linear-gradient(135deg, rgba(46,26,74,0.85) 0%, rgba(13,4,24,0.95) 100%)',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}))

// Glass card from the Figma first-jump overlay: 12.5px blur over the cover,
// rgba(38,38,38,0.7) fill, hairline gray-1 border, 12px radius, 32px padding.
// All dimensions are in `--vu` viewer units (defined on VideoArea): 1 unit =
// one Figma pixel of the 1545×820 viewer, so the card keeps the design's
// proportions when the viewer is height-clamped AND in fullscreen.
const SceneLaunchCard = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'calc(var(--vu) * 24)', // 24px in the Figma viewer
  padding: 'calc(var(--vu) * 32)', // 32px
  borderRadius: 'calc(var(--vu) * 12)',
  backgroundColor: 'rgba(38, 38, 38, 0.7)',
  backdropFilter: 'blur(12.5px)',
  border: `0.5px solid ${dclColors.neutral.gray1}`,
  boxShadow: '0px 2px 20px 0px rgba(0, 0, 0, 0.25)',
  textAlign: 'center'
})

const SceneLaunchCtas = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'calc(var(--vu) * 24)', // 24px
  flexWrap: 'wrap'
})

// Shared LargeCTA base from the Figma: 300×64, r12, 20px Bold uppercase.
const overlayCtaBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'calc(var(--vu) * 8.2)',
  width: 'calc(var(--vu) * 300)', // 300px in the Figma viewer
  height: 'calc(var(--vu) * 64)', // 64px
  padding: '0 calc(var(--vu) * 20.5)',
  border: 'none',
  borderRadius: 'calc(var(--vu) * 12)',
  fontSize: 'calc(var(--vu) * 20)', // 20px
  fontWeight: 700,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  cursor: 'pointer'
} as const

// JUMP IN — ruby fill + 32px jump glyph (float card over the running preview).
const OverlayJumpInCta = styled('button')(({ theme }) => ({
  ...overlayCtaBase,
  backgroundColor: dclColors.base.primary,
  color: dclColors.neutral.softWhite,
  transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.short }),
  ['&:hover']: { backgroundColor: dclColors.base.primaryDark1 },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

// While the bevy preview runs, the JUMP IN glass card stays pinned to the
// viewer's bottom-right corner (Figma 2151:29391) so the deep-link into the
// native client is always one click away.
const JumpInFloat = styled(Box)({
  position: 'absolute',
  right: 'calc(var(--vu) * 24)',
  bottom: 'calc(var(--vu) * 24)',
  zIndex: 3
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
  backgroundColor: dclColors.base.primary,
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

// Viewer surface — the Figma Img area is 1545×820 (not 16:9). The max-height
// clamp keeps the whole viewer card (header ≈72 + viewer + controls ≈72, plus
// the fixed navbar and page padding) inside one viewport, like a video player;
// when it clamps, the box goes wider-than-aspect and the media letterboxes /
// covers inside it.
const VideoArea = styled(Box)({
  position: 'relative',
  width: '100%',
  aspectRatio: '1545 / 820',
  maxHeight: 'calc(100vh - 340px)',
  minHeight: 280,
  // Overlay cards size themselves in "viewer pixels": the Figma viewer is
  // 1545×820, so `--vu` = min(width/1545, height/820) of the ACTUAL viewer.
  // The min keeps the glass cards Figma-proportioned when the viewer is
  // height-clamped, and — because this element is also the fullscreen target
  // and its own size container — the unit stays correct in fullscreen.
  // Floored at 0.65px so labels never shrink below readable.
  containerType: 'size',
  // The extra ×0.75 keeps the glass cards visually secondary to the scene —
  // the strict Figma proportion read too dominant on real viewports.
  ['--vu']: 'max(calc(min(0.06472cqw, 0.12195cqh) * 0.75), 0.55px)',
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

// Bottom controls bar from the Figma (2067:13565): soft-black, px-24 py-16,
// right-aligned MUTE / FULL SCREEN buttons.
const ControlsRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: 'clamp(10px, 0.833vw, 16px) clamp(16px, 1.25vw, 24px)', // 16px 24px
  backgroundColor: dclColors.neutral.softBlack1
})

const ControlsButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2) // 16px
}))

// Outlined control button from the Figma: 1px gray-4 border, r6, px-22 py-8,
// 15px Inter Semi-Bold uppercase (0.46px tracking) gray-4 label + 24px icon.
const ControlButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  padding: 'clamp(5px, 0.417vw, 8px) clamp(14px, 1.146vw, 22px)', // 8px 22px
  border: `1px solid ${dclColors.neutral.gray4}`,
  borderRadius: 6,
  backgroundColor: 'transparent',
  color: dclColors.neutral.gray4,
  fontSize: 'clamp(12px, 0.781vw, 15px)', // 15px
  fontWeight: 600,
  lineHeight: '24px',
  letterSpacing: '0.46px',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: theme.transitions.create(['background-color', 'color'], { duration: theme.transitions.duration.short }),
  ['& .MuiSvgIcon-root']: { fontSize: 'clamp(19px, 1.25vw, 24px)' }, // 24px
  ['&:hover']: { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  ['&:disabled']: { opacity: 0.4, cursor: 'default' },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

// Pre-launch CTAs living in the controls bar (they replace FULLSCREEN until
// the preview is running). Same box metrics as ControlButton so the bar never
// changes height, but filled per the launch design: white EXPLORE, ruby JUMP IN.
const barCtaBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'clamp(5px, 0.417vw, 8px)',
  padding: 'clamp(5px, 0.417vw, 8px) clamp(14px, 1.146vw, 22px)',
  border: 'none',
  borderRadius: 6,
  fontSize: 'clamp(12px, 0.781vw, 15px)',
  fontWeight: 600,
  lineHeight: '24px',
  letterSpacing: '0.46px',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  cursor: 'pointer'
} as const

const BarExploreCta = styled('button')(({ theme }) => ({
  ...barCtaBase,
  backgroundColor: dclColors.neutral.softWhite,
  color: dclColors.neutral.softBlack2,
  transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.short }),
  ['&:hover']: { backgroundColor: '#e6e5e8' }, // Figma hover tint — no dclColors token
  ['&:disabled']: { opacity: 0.5, cursor: 'default' },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

const BarJumpInCta = styled('button')(({ theme }) => ({
  ...barCtaBase,
  backgroundColor: dclColors.base.primary,
  color: dclColors.neutral.softWhite,
  transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.short }),
  ['&:hover']: { backgroundColor: dclColors.base.primaryDark1 },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
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
// In-World Chat panel (Figma 2151:31464): purple radial gradient, r12, no
// border. The cast2 ChatPanel inside supplies the header / messages / footer.
const ChatDock = styled(Box)({
  width: '100%',
  height: '100%',
  borderRadius: 12,
  overflow: 'hidden',
  // Figma "RADIAL 1" fill decoded from the gradientTransform matrix: ellipse
  // 47.4% x 84.4% centered at 42.4% / 26.5% -- identical recipe on the chat,
  // WHAT TO EXPECT and EVENT INFO surfaces.
  background: SCENE_PANEL_GRADIENT,
  display: 'flex',
  flexDirection: 'column'
})

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
  BarExploreCta,
  BarJumpInCta,
  ChatBody,
  ChatDock,
  ControlButton,
  ControlsButtons,
  ControlsRow,
  Placeholder,
  PlaceholderHint,
  PlaceholderTitle,
  SceneIframe,
  MobileUnsupportedHint,
  MobileUnsupportedTitle,
  StoreBadgeImage,
  StoreBadgeLink,
  JumpInFloat,
  OverlayJumpInCta,
  SceneLaunchCard,
  SceneLaunchCtas,
  SceneLaunchOverlay,
  VideoArea,
  WatcherContainer
}
