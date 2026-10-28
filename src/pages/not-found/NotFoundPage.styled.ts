import { Link } from 'react-router-dom'
import { Box, Button, Logo, Typography, styled } from 'decentraland-ui2'

// Figma: desktop node 1:1274 (1920x1080), mobile node 1:4151 (393x852).
// Two distinct layouts share one DOM:
//  - Mobile (< md): a vertical flow column (404, text, CTA) with the avatar
//    flowing BELOW it as its own block, so it can never overlap the CTA.
//  - Desktop (>= md): text on the left, the avatar as an absolute overlay
//    vertically centered on the right (see the geometry constants below).

// Desktop geometry for the avatar. Derived from the space left over next to the
// text column instead of from fixed Figma coordinates, so the artwork grows on
// wide screens and steps out of the way of the text on narrow ones (at 1280x720
// a fixed 40vw avatar overlapped the description) without a second breakpoint.
// Right edge of the text column: Figma's content x 172 + width 657 @ 1920.
const TEXT_COLUMN_RIGHT = 'calc(min(8.96vw, 172px) + 657px)'
const GRAPHIC_AVAILABLE_WIDTH = `calc(100vw - ${TEXT_COLUMN_RIGHT} - 24px)`
const GRAPHIC_CENTER_X = `calc(${TEXT_COLUMN_RIGHT} + ${GRAPHIC_AVAILABLE_WIDTH} / 2)`
// Sized by HEIGHT (a share of the viewport), capped by the free width via the
// artwork's 801/698 = 1.15 ratio.
const GRAPHIC_HEIGHT = `min(66dvh, calc(${GRAPHIC_AVAILABLE_WIDTH} / 1.15))`
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
  // Tighter than Figma's 60 on mobile: the 404 now sits inside this column and
  // the avatar block below it has to stay above the fold on a 852px-tall phone.
  gap: 48,
  textAlign: 'center',
  // Fixed offset (not a viewport %) so the column always clears the absolute
  // logo (bottom edge ~118px) by a stable gap on every device.
  paddingTop: 132,
  // Figma mobile: content frame x 16, width 360
  paddingLeft: 16,
  paddingRight: 16,
  [theme.breakpoints.up('md')]: {
    alignItems: 'flex-start',
    textAlign: 'left',
    // Figma: text block -> CTA gap
    gap: 60,
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

// Wrapper for the avatar. Mobile: a flow block placed below the CTA
// (guaranteeing no overlap). Desktop: an absolute overlay covering the viewport,
// so the avatar's 50% offsets resolve against the viewport.
const Graphic = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  marginTop: 24,
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

// Sits in the flow above the title rather than behind the avatar: as a backdrop
// it was fighting the artwork for the same space, and it had to shrink or bleed
// off-screen to coexist with it. `lineHeight: 1` plus the negative margin pull
// the digits tight against "Oops!" so the pair reads as one lockup instead of
// two stacked lines (the TextBlock's own 32px gap is meant for title/body).
const Watermark = styled(Typography)(({ theme }) => ({
  margin: 0,
  marginBottom: -12,
  color: theme.palette.common.white,
  opacity: 0.2,
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: 2,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  userSelect: 'none',
  fontSize: 72,
  [theme.breakpoints.up('md')]: {
    marginBottom: -20,
    letterSpacing: 4,
    fontSize: 120
  }
}))

// The artwork is 801x698 (ratio 1.15), much closer to square than the 16:9
// graphic the Figma coordinates were measured against, so on desktop it is sized
// by HEIGHT (see GRAPHIC_HEIGHT) rather than by width: that keeps it centered and
// proportional on any aspect ratio.
const AvatarIllustration = styled('img')(({ theme }) => ({
  position: 'absolute',
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
