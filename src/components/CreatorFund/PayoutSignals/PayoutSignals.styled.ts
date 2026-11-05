import { Box, styled } from 'decentraland-ui2'
import { CardTitle, CreatorFundSection, DisplayTitle, LeadText, SolidCard } from '../CreatorFund.styled'

// Sits tighter than the other sections on the "Real players" card below it.
const SignalsSection = styled(CreatorFundSection)(({ theme }) => ({
  paddingBottom: theme.spacing(3),
  [theme.breakpoints.up('sm')]: {
    paddingBottom: theme.spacing(5)
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

const SignalCard = styled(SolidCard)({
  height: '100%'
})

const SignalTitle = styled(CardTitle)(({ theme }) => ({
  marginTop: theme.spacing(3)
}))

const RealCard = styled(SolidCard)(({ theme }) => ({
  display: 'grid',
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

export { RealBody, RealCard, RealTitle, SignalCard, SignalTitle, SignalsGrid, SignalsLead, SignalsSection }
