import { styled } from 'decentraland-ui2'
import { creatorFundColors, monoFontFamily } from '../CreatorFund.styled'

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
  fontFamily: monoFontFamily,
  fontSize: 16,
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: creatorFundColors.text,
  [theme.breakpoints.up('sm')]: {
    fontSize: 18
  }
}))

const PayoutValue = styled('dd')({
  margin: 0,
  fontSize: 18,
  lineHeight: 1.55,
  color: creatorFundColors.text
})

export { PayoutLabel, PayoutRow, PayoutTerms, PayoutValue }
