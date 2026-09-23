import { Box, styled } from 'decentraland-ui2'

const PageRoot = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 16
})

// Shown only during the brief async window while Magic detection resolves, so the page never flashes
// the "unavailable" message before the real provider is known (mirrors DeleteAccountPage).
const LoadingState = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  padding: 48
})

export { LoadingState, PageRoot }
