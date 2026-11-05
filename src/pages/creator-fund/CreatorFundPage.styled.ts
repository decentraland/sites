import { Box, dclColors, styled } from 'decentraland-ui2'

// Holds the viewport while the landing chunk loads, so the footer doesn't jump up.
const LandingFallback = styled(Box)({
  minHeight: '100vh',
  backgroundColor: dclColors.neutral.softBlack1
})

export { LandingFallback }
