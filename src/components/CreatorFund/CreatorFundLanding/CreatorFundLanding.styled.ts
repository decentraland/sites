import { Box, styled } from 'decentraland-ui2'
import { creatorFundColors } from '../CreatorFund.styled'

const LandingRoot = styled(Box)({
  backgroundColor: creatorFundColors.background,
  color: creatorFundColors.text,
  // `clip`, not `hidden`: it trims the fanned-out scene cards without breaking the sticky section nav.
  overflowX: 'clip'
})

export { LandingRoot }
