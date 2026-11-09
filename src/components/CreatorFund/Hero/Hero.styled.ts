import { Box, styled } from 'decentraland-ui2'
import { Eyebrow, GlassCard, SECTION_SCROLL_MARGIN, SectionInner, creatorFundColors } from '../CreatorFund.styled'

const HeroSection = styled('section')(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  scrollMarginTop: SECTION_SCROLL_MARGIN.mobile,
  [theme.breakpoints.up('md')]: {
    scrollMarginTop: SECTION_SCROLL_MARGIN.desktop
  }
}))

const HeroVideo = styled(Box)({
  position: 'absolute',
  inset: 0,
  ['& video']: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  }
})

const HeroOverlay = styled(Box)({
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, rgba(22, 21, 24, 0.8) 0%, rgba(22, 21, 24, 0.55) 45%, rgba(105, 31, 169, 0.75) 100%)'
})

const HeroContent = styled(SectionInner)(({ theme }) => ({
  position: 'relative',
  paddingTop: theme.spacing(10),
  paddingBottom: theme.spacing(10),
  [theme.breakpoints.up('sm')]: {
    paddingTop: theme.spacing(14),
    paddingBottom: theme.spacing(14)
  }
}))

const HeroEyebrow = styled(Eyebrow)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: '6px 12px',
  borderRadius: 9999,
  border: `1px solid ${creatorFundColors.glassBorder}`,
  backgroundColor: creatorFundColors.glass,
  fontSize: 10,
  [theme.breakpoints.up('sm')]: {
    fontSize: 12
  }
}))

const EyebrowDot = styled('span')({
  width: 8,
  height: 8,
  flexShrink: 0,
  borderRadius: '50%',
  backgroundColor: creatorFundColors.primary
})

const HeroTitle = styled('h1')(({ theme }) => ({
  margin: `${theme.spacing(3)} 0 0`,
  maxWidth: 768,
  fontSize: 36,
  fontWeight: 600,
  letterSpacing: '-0.5px',
  lineHeight: 1.2,
  color: creatorFundColors.heading,
  textWrap: 'balance',
  // Same scale as the homepage hero title: 60px, 36px on phones.
  [theme.breakpoints.up('sm')]: {
    fontSize: 60
  }
}))

const HeroTitleHighlight = styled('span')({
  background: `linear-gradient(90deg, ${creatorFundColors.primary}, ${creatorFundColors.orange})`,
  backgroundClip: 'text',
  ['WebkitBackgroundClip' as string]: 'text',
  color: 'transparent'
})

const HeroSubtitle = styled('p')(({ theme }) => ({
  margin: `${theme.spacing(3)} 0 0`,
  maxWidth: 576,
  fontSize: 18,
  lineHeight: 1.55,
  color: creatorFundColors.text
}))

const SubtitleLine = styled('span')({
  display: 'block'
})

const HeroActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(4),
  [theme.breakpoints.up('sm')]: {
    flexDirection: 'row'
  }
}))

const FactsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(6),
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(3, 1fr)'
  }
}))

const FactCard = styled(GlassCard)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
  border: `1px solid ${creatorFundColors.border}`,
  backgroundColor: creatorFundColors.cardSurfaceLight,
  backdropFilter: 'blur(8px)'
}))

const FactValue = styled('span')({
  display: 'block',
  fontSize: 24,
  fontWeight: 600,
  letterSpacing: '-0.025em'
})

const FactLabel = styled('span')({
  display: 'block',
  fontSize: 14,
  color: creatorFundColors.mutedText
})

export {
  EyebrowDot,
  FactCard,
  FactLabel,
  FactValue,
  FactsGrid,
  HeroActions,
  HeroContent,
  HeroEyebrow,
  HeroOverlay,
  HeroSection,
  HeroSubtitle,
  HeroTitle,
  HeroTitleHighlight,
  HeroVideo,
  SubtitleLine
}
