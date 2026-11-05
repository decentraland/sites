import { Box, dclColors, styled } from 'decentraland-ui2'

// Palette of the Creator Fund design, on the same DCL tokens decentraland.org uses:
// white headings, gray5 body copy, primary-red CTAs that darken on hover.
const creatorFundColors = {
  background: dclColors.neutral.softBlack1,
  card: dclColors.neutral.softBlack2,
  heading: dclColors.neutral.white,
  text: dclColors.neutral.gray5,
  mutedText: dclColors.neutral.gray4,
  border: dclColors.neutral.gray0,
  primary: dclColors.base.primary,
  primaryHover: dclColors.base.primaryDark1,
  primaryActive: dclColors.base.primaryDark2,
  linkHover: dclColors.base.primaryLight1,
  buttonText: dclColors.neutral.softWhite,
  orange: dclColors.brand.melon,
  purpleDeep: dclColors.brand.purple,
  purpleBright: dclColors.brand.violet,
  white: dclColors.neutral.white,
  // Translucent white layers over the hero video and the purple bands.
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.15)'
}

// The Creator Fund navbar replaces the site one, so it uses the site navbar's
// breakpoint and heights (LandingNavbar: 64px below 992px, 92px from it).
const NAVBAR_DESKTOP_QUERY = '@media (min-width: 992px)'
const NAVBAR_HEIGHT = { mobile: 64, desktop: 92 }
// Navbar height + 8px of air above an anchored section's title.
const SECTION_SCROLL_MARGIN = { mobile: NAVBAR_HEIGHT.mobile + 8, desktop: NAVBAR_HEIGHT.desktop + 8 }

// decentraland.org labels are uppercase Inter at 600; the site uses no monospace face.
const labelStyles = {
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase'
} as const

const rubyGradient = `linear-gradient(135deg, ${creatorFundColors.primary}, ${creatorFundColors.orange})`
const purpleGradient = `linear-gradient(135deg, ${creatorFundColors.purpleDeep}, ${creatorFundColors.purpleBright})`

// Purple band. Its background is decentraland.org's own <AnimatedBackground variant="absolute" />
// (the WebGL purple glow with the drifting Decentraland logo pattern used on the homepage), which
// each band renders as its first child. The canvas sits at z-index -1, so the band isolates it.
const purpleBandStyles = {
  position: 'relative',
  isolation: 'isolate',
  overflow: 'hidden'
} as const

type SectionSpacing = 'both' | 'top' | 'bottom'

// Vertical rhythm of the homepage sections: 48px on phones, 80px from `sm` up.
const CreatorFundSection = styled('section', {
  shouldForwardProp: prop => prop !== 'spacing' && prop !== 'band'
})<{ spacing?: SectionSpacing; band?: boolean }>(({ theme, spacing = 'both', band = false }) => ({
  ...(band ? purpleBandStyles : {}),
  paddingTop: spacing === 'bottom' ? 0 : theme.spacing(6),
  paddingBottom: spacing === 'top' ? 0 : theme.spacing(6),
  scrollMarginTop: SECTION_SCROLL_MARGIN.mobile,
  [theme.breakpoints.up('sm')]: {
    paddingTop: spacing === 'bottom' ? 0 : theme.spacing(10),
    paddingBottom: spacing === 'top' ? 0 : theme.spacing(10)
  },
  [NAVBAR_DESKTOP_QUERY]: {
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

// Section titles as on the homepage: 48px / 600 / -0.5px, 32px on phones.
const DisplayTitle = styled('h2')(({ theme }) => ({
  margin: 0,
  fontSize: 32,
  fontWeight: 600,
  letterSpacing: '-0.5px',
  lineHeight: 1.2,
  color: creatorFundColors.heading,
  textWrap: 'balance',
  [theme.breakpoints.up('sm')]: {
    fontSize: 48
  }
}))

// Card titles as on /create: 24px / 600, 20px on phones.
const CardTitle = styled('h3')(({ theme }) => ({
  margin: 0,
  fontSize: 20,
  fontWeight: 600,
  lineHeight: 1.3,
  color: creatorFundColors.heading,
  [theme.breakpoints.up('sm')]: {
    fontSize: 24
  }
}))

const LeadText = styled('p')(({ theme }) => ({
  margin: `${theme.spacing(2)} 0 0`,
  maxWidth: 672,
  fontSize: 18,
  lineHeight: 1.5,
  color: creatorFundColors.text,
  textWrap: 'pretty'
}))

const MutedText = styled('p')({
  margin: 0,
  fontSize: 16,
  lineHeight: 1.5,
  color: creatorFundColors.mutedText
})

const Eyebrow = styled('span')({
  ...labelStyles,
  fontSize: 12
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

// Main page CTA, same shape as the homepage hero's Download button:
// 64px tall, 16px radius, uppercase 600, white focus/hover ring.
const PrimaryButtonLink = styled('a')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  boxSizing: 'border-box',
  minWidth: 304,
  height: 64,
  padding: `0 ${theme.spacing(4)}`,
  borderRadius: 16,
  backgroundColor: creatorFundColors.primary,
  color: creatorFundColors.buttonText,
  fontSize: '19.89px',
  fontWeight: 600,
  letterSpacing: '0.61px',
  textTransform: 'uppercase',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  outline: '3px solid transparent',
  outlineOffset: 4,
  transition: 'outline-color 0.15s ease, background-color 0.15s ease, transform 0.1s ease',
  ['&:hover, &:focus-visible']: {
    outlineColor: creatorFundColors.white
  },
  ['&:active']: {
    backgroundColor: creatorFundColors.primaryActive,
    transform: 'scale(0.98)'
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    minWidth: 0
  }
}))

// Compact CTA, same as the site navbar's Download button: 40px tall, 12px radius.
const NavButtonLink = styled('a')({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  height: 40,
  padding: '0 16px',
  borderRadius: 12,
  backgroundColor: creatorFundColors.primary,
  color: creatorFundColors.white,
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: '0.46px',
  textTransform: 'uppercase',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease, transform 0.1s ease',
  ['&:hover']: {
    backgroundColor: creatorFundColors.primaryHover
  },
  ['&:active']: {
    backgroundColor: creatorFundColors.primaryActive,
    transform: 'scale(0.98)'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 2
  }
})

export {
  CardTitle,
  CreatorFundSection,
  DisplayTitle,
  Eyebrow,
  GlassCard,
  LeadText,
  MutedText,
  NAVBAR_DESKTOP_QUERY,
  NAVBAR_HEIGHT,
  NavButtonLink,
  PrimaryButtonLink,
  RubyTile,
  SECTION_SCROLL_MARGIN,
  SectionInner,
  SolidCard,
  creatorFundColors,
  labelStyles,
  purpleBandStyles,
  purpleGradient,
  rubyGradient
}
