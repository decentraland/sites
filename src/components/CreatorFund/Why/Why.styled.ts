import { Box, Logo, styled } from 'decentraland-ui2'
import { DisplayTitle, SectionInner, creatorFundColors, rewardCardGradient } from '../CreatorFund.styled'

const WhyGrid = styled(SectionInner)(({ theme }) => ({
  display: 'grid',
  alignItems: 'center',
  gap: theme.spacing(6),
  [theme.breakpoints.up('lg')]: {
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(8)
  }
}))

const WhyLogo = styled(Logo)(({ theme }) => ({
  width: 48,
  height: 48,
  flexShrink: 0,
  transition: 'transform 0.2s',
  [theme.breakpoints.up('sm')]: {
    width: 64,
    height: 64
  },
  ['@media (prefers-reduced-motion: reduce)']: {
    transition: 'none'
  }
}))

const WhyTitle = styled(DisplayTitle)({
  color: 'inherit'
})

const HomeLink = styled('a')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  color: creatorFundColors.text,
  textDecoration: 'none',
  transition: 'color 0.2s',
  ['&:hover, &:focus-visible']: {
    color: creatorFundColors.primary
  },
  ['&:hover > svg, &:focus-visible > svg']: {
    transform: 'scale(1.1)'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 4,
    borderRadius: 8
  }
}))

// Paid-to-creators figure under the title, in body text color (no icon, per the Nov 9 design).
const AwardedLine = styled('p')(({ theme }) => ({
  margin: `${theme.spacing(2)} 0 0`,
  fontSize: 18,
  color: creatorFundColors.text,
  [theme.breakpoints.up('sm')]: {
    fontSize: 20
  }
}))

const PlatformGrid = styled('ul')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: theme.spacing(1.5),
  width: '100%',
  maxWidth: 672,
  margin: `${theme.spacing(4)} auto 0`,
  padding: 0,
  listStyle: 'none',
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(4, 1fr)'
  }
}))

// Same shape as the homepage's secondary (Epic Games) button: white, 16px radius,
// uppercase 600, white focus/hover ring.
const PlatformLink = styled('a')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1.25),
  boxSizing: 'border-box',
  height: 64,
  padding: `0 ${theme.spacing(2)}`,
  borderRadius: 16,
  backgroundColor: creatorFundColors.white,
  color: creatorFundColors.card,
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: '0.46px',
  textTransform: 'uppercase',
  textDecoration: 'none',
  outline: '3px solid transparent',
  outlineOffset: 4,
  transition: 'outline-color 0.15s ease, transform 0.1s ease',
  ['& svg']: {
    fontSize: 22,
    flexShrink: 0
  },
  ['&:hover, &:focus-visible']: {
    outlineColor: creatorFundColors.white
  },
  ['&:active']: {
    transform: 'scale(0.98)'
  }
}))

const SceneStack = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: 272,
  height: 320,
  margin: '0 auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: 400,
    height: 432
  },
  [theme.breakpoints.up('lg')]: {
    marginRight: 0,
    transform: 'translateX(32px)'
  }
}))

// Three cards fanned out from back (index 0) to front (index 2).
const SCENE_OFFSETS = [
  { mobile: 'translate(24px, 96px) rotate(3deg)', desktop: 'translate(80px, 160px) rotate(6deg)' },
  { mobile: 'translate(-24px, 48px) rotate(-3deg)', desktop: 'translate(-64px, 80px) rotate(-6deg)' },
  { mobile: 'translateY(-8px)', desktop: 'translateY(-16px)' }
]

const SceneCard = styled('figure', {
  shouldForwardProp: prop => prop !== 'position'
})<{ position: number }>(({ theme, position }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: SCENE_OFFSETS.length - position,
  margin: 0,
  padding: theme.spacing(1),
  borderRadius: 16,
  background: rewardCardGradient,
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  transform: SCENE_OFFSETS[position]?.mobile,
  [theme.breakpoints.up('sm')]: {
    transform: SCENE_OFFSETS[position]?.desktop
  }
}))

const SceneImage = styled('img')({
  display: 'block',
  width: '100%',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
  borderRadius: 12
})

export { AwardedLine, HomeLink, PlatformGrid, PlatformLink, SceneCard, SceneImage, SceneStack, WhyGrid, WhyLogo, WhyTitle }
