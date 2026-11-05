import { styled } from 'decentraland-ui2'
import { CardTitle, GlassCard, creatorFundColors } from '../CreatorFund.styled'

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
  fontWeight: 600,
  letterSpacing: '-0.025em',
  lineHeight: 1,
  color: 'rgba(236, 235, 237, 0.2)'
}))

const StepTitle = styled(CardTitle)(({ theme }) => ({
  marginTop: theme.spacing(3)
}))

const StepText = styled('p')(({ theme }) => ({
  margin: `${theme.spacing(1)} 0 0`,
  fontSize: 16,
  lineHeight: 1.5,
  color: creatorFundColors.text
}))

const StepLink = styled('a')({
  fontWeight: 600,
  color: creatorFundColors.white,
  textDecoration: 'underline',
  textUnderlineOffset: 4,
  ['&:hover']: {
    color: creatorFundColors.linkHover
  },
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 2,
    borderRadius: 2
  }
})

export { StepCard, StepLink, StepNumber, StepText, StepTitle, StepsGrid }
