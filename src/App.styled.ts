import { Box, styled } from 'decentraland-ui2'

// Centered 60vh container — reused for both the DappsShell Suspense fallback
// and the pending-migration placeholder. Shared from the main bundle so both
// App.tsx (lightweight) and DappsShell.tsx (lazy) use the same source.
const CenteredBox = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh'
})

export { CenteredBox }
