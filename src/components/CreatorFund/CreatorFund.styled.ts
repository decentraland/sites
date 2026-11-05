import { Box, dclColors, keyframes, styled } from 'decentraland-ui2'
import patternImage from '../../images/creator-fund/pattern.jpg'

// Palette of the Creator Fund design, mapped onto the DCL tokens it was drawn from.
const creatorFundColors = {
  background: dclColors.neutral.softBlack1,
  card: dclColors.neutral.softBlack2,
  text: dclColors.neutral.gray5,
  mutedText: dclColors.neutral.gray4,
  border: dclColors.neutral.gray0,
  primary: dclColors.base.primary,
  primaryHover: dclColors.base.primaryLight1,
  orange: dclColors.brand.melon,
  purpleDeep: dclColors.brand.purple,
  purpleBright: dclColors.brand.violet,
  white: dclColors.neutral.white,
  // Translucent white layers over the hero video and the purple bands.
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.15)'
}

const monoFontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

// Global navbar (64px mobile / 92px desktop) + the 64px section nav under it + 8px air.
const SECTION_SCROLL_MARGIN = { mobile: 136, desktop: 164 }

// useScrollParallax writes each purple band's scroll offset to this custom property;
// the band's pattern layer reads it to move at a quarter of the page's pace.
const PARALLAX_OFFSET_PROPERTY = '--parallax-offset'
const PARALLAX_SPEED = 0.25

const patternDrift = keyframes({
  from: { backgroundPosition: `0 var(${PARALLAX_OFFSET_PROPERTY}, 0px)` },
  to: { backgroundPosition: `640px calc(var(${PARALLAX_OFFSET_PROPERTY}, 0px) - 640px)` }
})

const rubyGradient = `linear-gradient(135deg, ${creatorFundColors.primary}, ${creatorFundColors.orange})`
const purpleGradient = `linear-gradient(135deg, ${creatorFundColors.purpleDeep}, ${creatorFundColors.purpleBright})`

// Purple band with the slowly drifting Decentraland pattern behind its content.
// `patternImage` is a bundled asset URL, never user input.
const purpleBandStyles = {
  position: 'relative',
  isolation: 'isolate',
  overflow: 'hidden',
  backgroundImage: purpleGradient,
  ['&::before']: {
    content: '""',
    position: 'absolute',
    inset: '-75%',
    zIndex: -1,
    transform: 'rotate(25deg)',
    pointerEvents: 'none',
    backgroundImage: `url("${patternImage}")`,
    backgroundRepeat: 'repeat',
    backgroundSize: '640px 640px',
    backgroundPosition: `0 var(${PARALLAX_OFFSET_PROPERTY}, 0px)`,
    mixBlendMode: 'screen',
    opacity: 0.14,
    animation: `${patternDrift} 80s linear infinite`
  },
  ['@media (prefers-reduced-motion: reduce)']: {
    ['&::before']: {
      animation: 'none',
      backgroundPosition: 'center'
    }
  }
} as const

type SectionSpacing = 'both' | 'top' | 'bottom'

const CreatorFundSection = styled('section', {
  shouldForwardProp: prop => prop !== 'spacing' && prop !== 'band'
})<{ spacing?: SectionSpacing; band?: boolean }>(({ theme, spacing = 'both', band = false }) => ({
  ...(band ? purpleBandStyles : {}),
  paddingTop: spacing === 'bottom' ? 0 : theme.spacing(10),
  paddingBottom: spacing === 'top' ? 0 : theme.spacing(10),
  scrollMarginTop: SECTION_SCROLL_MARGIN.mobile,
  [theme.breakpoints.up('sm')]: {
    paddingTop: spacing === 'bottom' ? 0 : theme.spacing(14),
    paddingBottom: spacing === 'top' ? 0 : theme.spacing(14)
  },
  [theme.breakpoints.up('md')]: {
    scrollMarginTop: SECTION_SCROLL_MARGIN.desktop
  }
}))

const SectionInner = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 1152,
  marginLeft: 'auto',
  marginRight: 'auto',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3)
  }
}))

const DisplayTitle = styled('h2')(({ theme }) => ({
  margin: 0,
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1.05,
  color: creatorFundColors.text,
  textWrap: 'balance',
  [theme.breakpoints.up('sm')]: {
    fontSize: 48
  }
}))

const LeadText = styled('p')(({ theme }) => ({
  margin: `${theme.spacing(2)} 0 0`,
  maxWidth: 672,
  fontSize: 18,
  lineHeight: 1.55,
  color: creatorFundColors.text,
  textWrap: 'pretty'
}))

const MutedText = styled('p')({
  margin: 0,
  lineHeight: 1.6,
  color: creatorFundColors.mutedText
})

const Eyebrow = styled('span')({
  fontFamily: monoFontFamily,
  fontWeight: 500,
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
})

type TileSize = 'small' | 'medium' | 'large'

const TILE_SIZES: Record<TileSize, { box: number; radius: number; icon: number }> = {
  small: { box: 36, radius: 8, icon: 20 },
  medium: { box: 48, radius: 12, icon: 24 },
  large: { box: 56, radius: 12, icon: 28 }
}

const RubyTile = styled('span', {
  shouldForwardProp: prop => prop !== 'size'
})<{ size?: TileSize }>(({ size = 'medium' }) => ({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  width: TILE_SIZES[size].box,
  height: TILE_SIZES[size].box,
  borderRadius: TILE_SIZES[size].radius,
  background: rubyGradient,
  color: creatorFundColors.white,
  ['& svg']: {
    fontSize: TILE_SIZES[size].icon
  }
}))

const GlassCard = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: 16,
  border: `1px solid ${creatorFundColors.glassBorder}`,
  backgroundColor: creatorFundColors.glass,
  padding: theme.spacing(3)
}))

const SolidCard = styled(Box)(({ theme }) => ({
  borderRadius: 16,
  border: `1px solid ${creatorFundColors.border}`,
  backgroundColor: creatorFundColors.card,
  padding: theme.spacing(3)
}))

const PrimaryButtonLink = styled('a')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  borderRadius: 9999,
  padding: '13px 24px',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  textDecoration: 'none',
  backgroundColor: creatorFundColors.primary,
  color: creatorFundColors.white,
  transition: 'background-color 0.2s, transform 0.2s',
  ['&:hover']: {
    backgroundColor: creatorFundColors.primaryHover
  },
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 3
  },
  ['&:active']: {
    transform: 'scale(0.98)'
  }
}))

export {
  CreatorFundSection,
  DisplayTitle,
  Eyebrow,
  GlassCard,
  LeadText,
  MutedText,
  PARALLAX_OFFSET_PROPERTY,
  PARALLAX_SPEED,
  PrimaryButtonLink,
  RubyTile,
  SECTION_SCROLL_MARGIN,
  SectionInner,
  SolidCard,
  creatorFundColors,
  monoFontFamily,
  purpleBandStyles,
  purpleGradient,
  rubyGradient
}
