import { Box, styled } from 'decentraland-ui2'
import { CreatorFundSection, DisplayTitle, SolidCard, creatorFundColors } from '../CreatorFund.styled'

// Sits tighter than the other sections on the "Real players" card below it.
const SignalsSection = styled(CreatorFundSection)(({ theme }) => ({
  paddingBottom: theme.spacing(5),
  [theme.breakpoints.up('sm')]: {
    paddingBottom: theme.spacing(7)
  }
}))

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
  height: '100%',
  ['& > svg']: {
    fontSize: 28,
    color: creatorFundColors.primary
  }
})

const SignalTitle = styled('p')(({ theme }) => ({
  margin: `${theme.spacing(3)} 0 0`,
  fontSize: 20,
  fontWeight: 700,
  color: creatorFundColors.text
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

export { RealBody, RealCard, RealTitle, SignalCard, SignalTitle, SignalsGrid, SignalsSection }
