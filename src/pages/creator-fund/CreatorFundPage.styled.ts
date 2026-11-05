import { Box, styled } from 'decentraland-ui2'

// Darkens the hero video so the white copy stays readable on its brightest frames.
const CreatorFundOverlay = styled(Box)({
  position: 'absolute',
  inset: 0,
  zIndex: 0,
  background: 'linear-gradient(180deg, rgba(22, 21, 24, 0.35) 0%, rgba(22, 21, 24, 0.7) 100%)'
})

export { CreatorFundOverlay }
