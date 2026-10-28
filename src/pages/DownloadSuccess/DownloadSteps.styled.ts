import { Box, Typography, dclColors, keyframes, styled } from 'decentraland-ui2'
import type { DownloadStepsStep } from './DownloadSuccess.types'

// Colors below are literal values from the Figma design with no equivalent dclColors token.
const PAGE_BACKGROUND = '#32134C'
const CARD_BORDER = 'rgba(160, 155, 168, 0.48)'
const MEDIA_UNDERLAY = 'rgba(51, 22, 54, 0.7)'

// Figma card header per step: base color, sheen angle and the 4px accent on the left edge.
const STEP_TINTS = [
  { base: 'rgba(194, 92, 184, 0.32)', angle: '110.97deg', accent: '#673075' },
  { base: 'rgba(105, 0, 146, 0.52)', angle: '108.7deg', accent: '#550F76' },
  { base: 'rgba(37, 0, 69, 0.41)', angle: '110.97deg', accent: '#511B68' }
] as const

// Step 1 images are 394 wide in the design. Every highlight size is expressed in cqw so the glow
// scales with the image (the media box is the size container).
const DESIGN_WIDTH = 394
const cqw = (px: number) => `calc(${px} / ${DESIGN_WIDTH} * 100cqw)`
const GLOW_SIZE = 76
const GLOW_BLUR_MIN = 11.9
const GLOW_BLUR_MAX = 23.8
// The blur needs room around the circle; the center of this box is the highlight position.
const GLOW_BOX_SIZE = 220
// Crisp download icon disc drawn over the glow, covering the browser's own download icon.
const ICON_SIZE = 30.52

const DownloadStepsPage = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
  minHeight: 903,
  padding: theme.spacing(6, 2, 8),
  backgroundColor: PAGE_BACKGROUND,
  backgroundImage: [
    `radial-gradient(ellipse 48% 640px at 124% 50%, ${dclColors.brand.lavender}99, transparent)`,
    `radial-gradient(ellipse 48% 640px at -6% -45%, ${dclColors.brand.lavender}99, transparent)`
  ].join(', '),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(12, 3, 10)
  }
}))

const DownloadStepsHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: theme.spacing(0, 2),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(0, 9)
  }
}))

const DownloadStepsTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2.5),
  color: dclColors.neutral.softWhite,
  [theme.breakpoints.down('md')]: {
    fontSize: '2rem'
  }
}))

const DownloadStepsSubtitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  color: dclColors.neutral.gray5,
  [theme.breakpoints.down('md')]: {
    fontSize: '1.125rem'
  }
}))

const DownloadStepsCards = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  width: '100%',
  maxWidth: 1230,
  marginTop: theme.spacing(6),
  // One row per card part (header, media) shared by all cards, so a longer translation grows every header
  // and the images stay aligned.
  [theme.breakpoints.up('md')]: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gridTemplateRows: 'auto auto',
    columnGap: theme.spacing(3),
    rowGap: 0,
    marginTop: theme.spacing(8)
  }
}))

const DownloadStepsCardRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  width: '100%',
  maxWidth: DESIGN_WIDTH,
  minWidth: 0,
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    display: 'grid',
    gridRow: 'span 2',
    gridTemplateRows: 'subgrid',
    justifySelf: 'center'
  }
}))

const DownloadStepsCardHeader = styled(Box, { shouldForwardProp: prop => prop !== 'step' })<{ step: number }>(({ theme, step }) => {
  const tint = STEP_TINTS[step % STEP_TINTS.length]
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    minHeight: 180,
    padding: theme.spacing(3),
    backgroundColor: tint.base,
    backgroundImage: `linear-gradient(${tint.angle}, rgba(255, 255, 255, 0.2) 4.17%, rgba(255, 255, 255, 0) 92.73%)`,
    boxShadow: `inset 4px 0 0 0 ${tint.accent}`
  }
})

const DownloadStepsOverline = styled(Typography)(({ theme }) => ({
  lineHeight: 1,
  letterSpacing: '1px',
  color: theme.palette.common.white
}))

const DownloadStepsCardTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white
}))

const DownloadStepsCardText = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white
}))

const DownloadStepsMedia = styled(Box)({
  position: 'relative',
  width: '100%',
  aspectRatio: `${DESIGN_WIDTH} / 240`,
  containerType: 'inline-size',
  backgroundColor: MEDIA_UNDERLAY
})

const DownloadStepsImage = styled('img', { shouldForwardProp: prop => prop !== 'fit' })<{ fit: DownloadStepsStep['imageFit'] }>(
  ({ fit }) => ({
    position: 'absolute',
    inset: 0,
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: fit
  })
)

const downloadHighlightPulse = keyframes`
  0%, 4.76% {
    filter: blur(${cqw(GLOW_BLUR_MIN)});
    animation-timing-function: ease-out;
  }
  33.33%, 71.43% {
    filter: blur(${cqw(GLOW_BLUR_MAX)});
    animation-timing-function: ease-out;
  }
  100% {
    filter: blur(${cqw(GLOW_BLUR_MIN)});
  }
`

const DownloadStepsHighlight = styled('span', { shouldForwardProp: prop => prop !== 'x' && prop !== 'y' })<{ x: number; y: number }>(
  ({ x, y }) => ({
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    display: 'grid',
    placeItems: 'center',
    width: cqw(GLOW_BOX_SIZE),
    aspectRatio: '1',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none'
  })
)

const DownloadStepsGlow = styled('span')({
  gridArea: '1 / 1',
  width: `${(GLOW_SIZE / GLOW_BOX_SIZE) * 100}%`,
  aspectRatio: '1',
  borderRadius: '50%',
  backgroundColor: dclColors.brand.lavender,
  filter: `blur(${cqw(GLOW_BLUR_MIN)})`,
  animation: `${downloadHighlightPulse} 2.1s infinite`,
  ['@media (prefers-reduced-motion: reduce)']: {
    animation: 'none'
  }
})

// Positioned so it paints after (above) the glow, whose filter makes it a stacking context.
const DownloadStepsHighlightIcon = styled('img')({
  position: 'relative',
  gridArea: '1 / 1',
  width: cqw(ICON_SIZE),
  aspectRatio: '1',
  borderRadius: '50%'
})

const DownloadStepsFooter = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(0, 2),
  textAlign: 'center'
}))

const DownloadStepsFooterLine = styled(Typography)({
  lineHeight: 2.13,
  color: dclColors.neutral.softWhite
})

const DownloadStepsFooterLink = styled('a')(({ theme }) => ({
  color: dclColors.brand.ruby,
  textDecoration: 'underline',
  ['&:hover']: {
    color: theme.palette.primary.light
  },
  ['&:active']: {
    color: theme.palette.primary.dark
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.brand.ruby}`,
    outlineOffset: 2,
    borderRadius: 2
  }
}))

const DownloadStepsExternalIcon = styled('img')(({ theme }) => ({
  width: 15,
  height: 15,
  marginLeft: theme.spacing(0.5),
  verticalAlign: 'middle'
}))

export {
  DownloadStepsCardHeader,
  DownloadStepsCardRoot,
  DownloadStepsCardText,
  DownloadStepsCardTitle,
  DownloadStepsCards,
  DownloadStepsExternalIcon,
  DownloadStepsFooter,
  DownloadStepsFooterLine,
  DownloadStepsFooterLink,
  DownloadStepsGlow,
  DownloadStepsHeader,
  DownloadStepsHighlight,
  DownloadStepsHighlightIcon,
  DownloadStepsImage,
  DownloadStepsMedia,
  DownloadStepsOverline,
  DownloadStepsPage,
  DownloadStepsSubtitle,
  DownloadStepsTitle
}
