import { Link } from 'react-router-dom'
import { Box, Button, Logo, Typography, styled } from 'decentraland-ui2'

// Figma: desktop node 1:1274 (1920x1080), mobile node 1:4151 (393x852).
// Two distinct layouts share one DOM:
//  - Mobile (< md): a vertical flow column (logo, text, CTA) with the 404+avatar
//    graphic flowing BELOW it as its own block, so it can never overlap the CTA.
//  - Desktop (>= md): text on the left, the graphic as an absolute overlay
//    vertically centered on the right (see the geometry constants below).

// Desktop geometry for the graphic (404 watermark + avatar). Both are derived
// from the space left over next to the text column instead of from fixed Figma
// coordinates, so the artwork grows on wide screens and steps out of the way of
// the text on narrow ones (at 1280x720 a fixed 40vw avatar overlapped the
// description) without ever needing a second breakpoint.
// Right edge of the text column: Figma's content x 172 + width 657 @ 1920.
const TEXT_COLUMN_RIGHT = 'calc(min(8.96vw, 172px) + 657px)'
const GRAPHIC_AVAILABLE_WIDTH = `calc(100vw - ${TEXT_COLUMN_RIGHT} - 24px)`
// Shared center so the watermark and the avatar always move together.
const GRAPHIC_CENTER_X = `calc(${TEXT_COLUMN_RIGHT} + ${GRAPHIC_AVAILABLE_WIDTH} / 2)`
// Sized by HEIGHT (a share of the viewport), capped by the free width via the
// artwork's 801/698 = 1.15 ratio.
const GRAPHIC_HEIGHT = `min(66dvh, calc(${GRAPHIC_AVAILABLE_WIDTH} / 1.15))`
// Figma keeps the watermark at 404.8px against a 516px-tall graphic; reuse that
// ratio so the "404" scales with the avatar instead of being swallowed by it.
const WATERMARK_TO_GRAPHIC_HEIGHT = 0.784
// Vertical breathing room the text column needs on short desktop viewports: the
// logo occupies y 114-177 at x 72-135 and the column starts at x 80-172, so a
// perfectly centered column would collide with it below ~780px of height.
const SHORT_DESKTOP_TEXT_OFFSET = 200

// `isolation: isolate` establishes a stacking context so the sibling
// <AnimatedBackground variant="absolute" /> (which paints at z-index -1) stays
// behind the content instead of escaping this container. Mirrors the pattern in
// the homepage WhatsOn/ComeHangOut sections and the cast onboarding.
const PageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '100dvh',
  // Only clip horizontally (the watermark bleeds past the viewport edges); allow the
  // page to scroll vertically on short devices instead of overlapping content.
  overflowX: 'hidden',
  isolation: 'isolate',
  display: 'flex',
  flexDirection: 'column',
  paddingBottom: 24,
  [theme.breakpoints.up('md')]: {
    // Desktop centers the text column vertically to match the graphic.
    justifyContent: 'center'
  }
})) as typeof Box

const HomeLink = styled(Link)(({ theme }) => ({
  position: 'absolute',
  // Figma mobile: logo at (23, 70.5)
  top: 70,
  left: 23,
  zIndex: 2,
  display: 'inline-flex',
  borderRadius: '50%',
  ['&:focus-visible']: {
    outline: `2px solid ${theme.palette.common.white}`,
    outlineOffset: 4
  },
  [theme.breakpoints.up('md')]: {
    // Figma desktop: logo at (72, 114)
    top: 114,
    left: 72
  }
}))

const BrandLogo = styled(Logo)(({ theme }) => ({
  // Figma mobile 48x48
  width: 48,
  height: 48,
  [theme.breakpoints.up('md')]: {
    // Figma desktop 63x63
    width: 63,
    height: 63
  }
}))

const Content = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  // Figma: text block -> CTA gap
  gap: 60,
  textAlign: 'center',
  // Fixed offset (not a viewport %) so the title always clears the absolute
  // logo (bottom edge ~118px) by a stable gap on every device.
  paddingTop: 150,
  // Figma mobile: content frame x 16, width 360
  paddingLeft: 16,
  paddingRight: 16,
  [theme.breakpoints.up('md')]: {
    alignItems: 'flex-start',
    textAlign: 'left',
    // Vertical placement comes from the container's justifyContent: center.
    paddingTop: 0,
    // Figma desktop: content frame x 172 / 1920 artboard width
    paddingLeft: 'min(8.96vw, 172px)',
    paddingRight: 0
  },
  // Short desktop viewports (1280x720, a non-maximized window): padding inside
  // the centered box nudges the column down, clearing the absolute logo.
  [`${theme.breakpoints.up('md')} and (max-height: 780px)`]: {
    paddingTop: SHORT_DESKTOP_TEXT_OFFSET
  }
}))

const TextBlock = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  // Figma: title -> description gap
  gap: 32
})

const Title = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  // Figma mobile: Inter Bold 28 / 1.235, centered
  fontSize: 28,
  fontWeight: 700,
  lineHeight: 1.235,
  [theme.breakpoints.up('md')]: {
    // Figma desktop: typography/h3 -- Inter SemiBold 48 / 1.167, width 657
    fontSize: 48,
    fontWeight: 600,
    lineHeight: 1.167,
    maxWidth: 657
  }
})) as typeof Typography

// Desktop shows "Oops!" on its own line (explicit break in Figma); mobile flows
// inline and wraps naturally.
const TitleRest = styled('span')(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    display: 'block'
  }
}))

const Description = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  // Figma mobile: Inter Medium 18 / 1.6, width 360, centered
  fontSize: 18,
  fontWeight: 500,
  lineHeight: 1.6,
  maxWidth: 360,
  [theme.breakpoints.up('md')]: {
    // Figma desktop: typography/h5 -- Inter Medium 24 / 1.334, width 657
    fontSize: 24,
    lineHeight: 1.334,
    maxWidth: 657
  }
})) as typeof Typography

// ui2 sizeLarge+containedPrimary already ships Figma's button/large typography
// (Inter 15/24, +0.46px, uppercase) plus the #FF2D55 background and hover/focus/
// disabled states. Only padding / height / radius differ from the theme, so we
// repeat the theme's own compound selector to win its specificity.
const CtaButton = styled(Button)({
  ['&.MuiButton-sizeLarge.MuiButton-containedPrimary']: {
    // Figma: h 46, px 48, radius 12
    height: 46,
    padding: '0 48px',
    borderRadius: 12
  }
}) as typeof Button

// Wrapper for the 404 watermark + avatar. Mobile: a flow block placed below the
// CTA (guaranteeing no overlap). Desktop: an absolute overlay covering the
// viewport, so its children's 50% offsets resolve against the viewport.
const Graphic = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  marginTop: 48,
  // Reserve room for the absolutely-positioned children in the mobile flow.
  height: '62vw',
  [theme.breakpoints.up('md')]: {
    position: 'absolute',
    inset: 0,
    marginTop: 0,
    height: 'auto',
    zIndex: 0,
    pointerEvents: 'none'
  }
})) as typeof Box

const Watermark = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  zIndex: 0,
  margin: 0,
  color: theme.palette.common.white,
  opacity: 0.2,
  fontWeight: 700,
  // Figma: 312.33/195.2 = 647.68/404.8 = 1.6
  lineHeight: 1.6,
  whiteSpace: 'nowrap',
  textAlign: 'center',
  pointerEvents: 'none',
  userSelect: 'none',
  // Mobile: centered inside the Graphic block.
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: '54vw',
  letterSpacing: '1.6vw',
  [theme.breakpoints.up('md')]: {
    // Desktop: same center as the avatar so the pair reads as one composition,
    // vertically centered in the viewport. Width shrinks to the text (nowrap) so
    // the translate actually centers it.
    top: '50%',
    left: GRAPHIC_CENTER_X,
    transform: 'translate(-50%, -50%)',
    width: 'auto',
    fontSize: `calc(${GRAPHIC_HEIGHT} * ${WATERMARK_TO_GRAPHIC_HEIGHT})`,
    // Figma desktop: tracking 12.41 (/1920)
    letterSpacing: '0.65vw'
  }
}))

// The artwork is 801x698 (ratio 1.15), much closer to square than the 16:9
// graphic the Figma coordinates were measured against, so on desktop it is sized
// by HEIGHT (see GRAPHIC_HEIGHT) rather than by width: that keeps it centered and
// proportional on any aspect ratio.
const AvatarIllustration = styled('img')(({ theme }) => ({
  position: 'absolute',
  // Above the watermark so the avatar sits on top of the "404".
  zIndex: 1,
  height: 'auto',
  pointerEvents: 'none',
  // Mobile: centered inside the Graphic block, sitting at its bottom.
  bottom: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  // 68vw / 1.15 = 59vw tall, so it fits the 62vw Graphic block.
  width: '68vw',
  [theme.breakpoints.up('md')]: {
    bottom: 'auto',
    top: '50%',
    left: GRAPHIC_CENTER_X,
    transform: 'translate(-50%, -50%)',
    width: 'auto',
    height: GRAPHIC_HEIGHT
  }
}))

export {
  AvatarIllustration,
  BrandLogo,
  Content,
  CtaButton,
  Description,
  Graphic,
  HomeLink,
  PageContainer,
  TextBlock,
  Title,
  TitleRest,
  Watermark
}
