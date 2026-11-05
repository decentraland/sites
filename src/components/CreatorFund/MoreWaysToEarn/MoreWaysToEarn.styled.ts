import { Box, styled } from 'decentraland-ui2'
import { CardTitle, creatorFundColors, purpleBandStyles } from '../CreatorFund.styled'

const MoreWaysBand = styled(Box)(({ theme }) => ({
  ...purpleBandStyles,
  padding: theme.spacing(3),
  borderRadius: 16,
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4)
  }
}))

const MoreWaysHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2)
}))

const MoreWaysTitle = styled(CardTitle)({})

const MoreWaysList = styled('ul')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1.5),
  margin: `${theme.spacing(3)} 0 0`,
  padding: 0,
  listStyle: 'none',
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    columnGap: theme.spacing(4)
  }
}))

const MoreWaysItem = styled('li')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(1.5),
  fontSize: 16,
  lineHeight: 1.5,
  color: creatorFundColors.text,
  ['& > svg']: {
    flexShrink: 0,
    marginTop: 2,
    fontSize: 20,
    color: creatorFundColors.white
  }
}))

export { MoreWaysBand, MoreWaysHeader, MoreWaysItem, MoreWaysList, MoreWaysTitle }
