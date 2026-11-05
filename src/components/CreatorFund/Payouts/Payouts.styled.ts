import { styled } from 'decentraland-ui2'
import { creatorFundColors, labelStyles } from '../CreatorFund.styled'

const PayoutTerms = styled('dl')(({ theme }) => ({
  margin: `${theme.spacing(5)} 0 0`,
  borderTop: `1px solid ${creatorFundColors.glassBorder}`
}))

const PayoutRow = styled('div')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1),
  padding: `${theme.spacing(3)} 0`,
  borderBottom: `1px solid ${creatorFundColors.glassBorder}`,
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: '210px 1fr',
    columnGap: theme.spacing(4)
  }
}))

const PayoutLabel = styled('dt')(({ theme }) => ({
  ...labelStyles,
  fontSize: 14,
  color: creatorFundColors.heading,
  [theme.breakpoints.up('sm')]: {
    fontSize: 16
  }
}))

const PayoutValue = styled('dd')({
  margin: 0,
  fontSize: 18,
  lineHeight: 1.5,
  color: creatorFundColors.text
})

export { PayoutLabel, PayoutRow, PayoutTerms, PayoutValue }
