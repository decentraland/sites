import { Box, styled } from 'decentraland-ui2'
import { creatorFundColors } from '../CreatorFund.styled'

const LandingRoot = styled(Box)(({ theme }) => ({
  // Clears the fixed global navbar (64px mobile / 92px desktop, like the /create hero).
  paddingTop: 64,
  backgroundColor: creatorFundColors.background,
  color: creatorFundColors.text,
  // `clip`, not `hidden`: it trims the fanned-out scene cards without breaking the sticky section nav.
  overflowX: 'clip',
  [theme.breakpoints.up('md')]: {
    paddingTop: 92
  }
}))

export { LandingRoot }
