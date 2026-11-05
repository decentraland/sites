import { styled } from 'decentraland-ui2'
import { DisplayTitle, SolidCard, creatorFundColors } from '../CreatorFund.styled'

const EligibilityTitle = styled(DisplayTitle)({
  maxWidth: 768
})

const EligibilityGrid = styled('div')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2.5),
  marginTop: theme.spacing(5),
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(2, 1fr)'
  }
}))

const EligibilityCard = styled(SolidCard)(({ theme }) => ({
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4)
  }
}))

const CardTitle = styled('h3')({
  margin: 0,
  fontSize: 20,
  fontWeight: 700,
  color: creatorFundColors.text
})

const RequirementList = styled('ul')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  margin: `${theme.spacing(2.5)} 0 0`,
  padding: 0,
  listStyle: 'none'
}))

const Requirement = styled('li')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  lineHeight: 1.6,
  color: creatorFundColors.mutedText,
  ['& > svg']: {
    flexShrink: 0,
    marginTop: 2,
    fontSize: 20,
    color: creatorFundColors.primary
  }
}))

export { CardTitle, EligibilityCard, EligibilityGrid, EligibilityTitle, Requirement, RequirementList }
