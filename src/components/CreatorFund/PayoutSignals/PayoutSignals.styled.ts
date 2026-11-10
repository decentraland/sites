import { Box, styled } from 'decentraland-ui2'
import { CardTitle, DisplayTitle, LeadText, SolidCard, creatorFundColors, rewardCardGradient } from '../CreatorFund.styled'

// One section for "What we reward" and the Real players card, so the photo behind them runs
// continuously. The photo sits at z-index -1, so the section isolates it.
const RewardsSection = styled('section')({
  position: 'relative',
  isolation: 'isolate',
  overflow: 'hidden'
})

const RewardsBackground = styled('img')({
  position: 'absolute',
  inset: 0,
  zIndex: -1,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center'
})

// Same rhythm as the other sections; the metrics sit tight on the Real players card below.
const SignalsBlock = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(6),
  paddingBottom: theme.spacing(3),
  [theme.breakpoints.up('sm')]: {
    paddingTop: theme.spacing(10),
    paddingBottom: theme.spacing(5)
  }
}))

const RealBlock = styled(Box)(({ theme }) => ({
  paddingBottom: theme.spacing(6),
  [theme.breakpoints.up('sm')]: {
    paddingBottom: theme.spacing(10)
  }
}))

// One sentence that introduces the three cards: keep it on a single line on desktop.
const SignalsLead = styled(LeadText)({
  maxWidth: 'none'
})

const SignalsGrid = styled('ul')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2),
  margin: `${theme.spacing(5)} 0 0`,
  padding: 0,
  listStyle: 'none',
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(3, 1fr)'
  }
}))

// Purple gradient metric cards, content centered.
const SignalCard = styled(SolidCard)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  height: '100%',
  boxSizing: 'border-box',
  background: rewardCardGradient
})

const SignalTitle = styled(CardTitle)(({ theme }) => ({
  marginTop: theme.spacing(3)
}))

// Translucent, so the photo shows through.
const RealCard = styled(SolidCard)(({ theme }) => ({
  display: 'grid',
  backgroundColor: creatorFundColors.cardSurfaceStrong,
  gap: theme.spacing(3),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(5)
  },
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'auto 1fr'
  }
}))

const RealTitle = styled(DisplayTitle)(({ theme }) => ({
  [theme.breakpoints.up('sm')]: {
    fontSize: 36
  }
}))

const RealBody = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2.5)
}))

export {
  RealBlock,
  RealBody,
  RealCard,
  RealTitle,
  RewardsBackground,
  RewardsSection,
  SignalCard,
  SignalTitle,
  SignalsBlock,
  SignalsGrid,
  SignalsLead
}
