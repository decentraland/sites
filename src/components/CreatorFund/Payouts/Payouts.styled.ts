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
    gridTemplateColumns: '250px 1fr',
    alignItems: 'center',
    columnGap: theme.spacing(4)
  }
}))

const PAYOUT_ICON_GRADIENT_ID = 'creator-fund-payout-icon-gradient'

// Holds the gradient definition only; takes no space.
const PayoutIconGradient = styled('svg')({
  position: 'absolute',
  width: 0,
  height: 0,
  overflow: 'hidden'
})

// Label in a dark pill, led by an icon painted with the red-orange gradient.
const PayoutLabel = styled('dt')(({ theme }) => ({
  ...labelStyles,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  boxSizing: 'border-box',
  width: '100%',
  padding: `${theme.spacing(1.5)} ${theme.spacing(2.5)}`,
  borderRadius: 9999,
  backgroundColor: creatorFundColors.darkSurface,
  fontSize: 14,
  color: creatorFundColors.onBand,
  ['& > svg']: {
    flexShrink: 0,
    fontSize: 28,
    fill: `url(#${PAYOUT_ICON_GRADIENT_ID})`
  },
  [theme.breakpoints.up('sm')]: {
    fontSize: 16
  }
}))

// Soft white, not gray5: the gray read too faint on the purple band.
const PayoutValue = styled('dd')({
  margin: 0,
  fontSize: 18,
  lineHeight: 1.5,
  color: creatorFundColors.onBand
})

// "See Below": underlined like the "See Terms" link in the closing section.
const PayoutLink = styled('a')({
  color: 'inherit',
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

export { PAYOUT_ICON_GRADIENT_ID, PayoutIconGradient, PayoutLabel, PayoutLink, PayoutRow, PayoutTerms, PayoutValue }
