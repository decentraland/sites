import { styled } from 'decentraland-ui2'
import { GlassCard, creatorFundColors } from '../CreatorFund.styled'

const StepsGrid = styled('ol')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2.5),
  margin: `${theme.spacing(6)} 0 0`,
  padding: 0,
  listStyle: 'none',
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(2, 1fr)'
  },
  [theme.breakpoints.up('lg')]: {
    gridTemplateColumns: 'repeat(3, 1fr)'
  }
}))

const StepCard = styled(GlassCard)({
  height: '100%'
})

const StepNumber = styled('span')(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2.5),
  fontSize: 48,
  fontWeight: 800,
  letterSpacing: '-0.025em',
  lineHeight: 1,
  color: 'rgba(236, 235, 237, 0.2)'
}))

const StepTitle = styled('h3')(({ theme }) => ({
  margin: `${theme.spacing(3)} 0 0`,
  fontSize: 20,
  fontWeight: 700,
  color: creatorFundColors.text
}))

const StepText = styled('p')(({ theme }) => ({
  margin: `${theme.spacing(1)} 0 0`,
  lineHeight: 1.6,
  color: creatorFundColors.text
}))

export { StepCard, StepNumber, StepText, StepTitle, StepsGrid }
