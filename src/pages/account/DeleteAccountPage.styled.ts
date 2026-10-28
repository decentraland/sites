import { Box, styled } from 'decentraland-ui2'

// Figma 797:78245 — Delete Account page. No page heading (the sidebar marks the active section,
// matching every other account section); the panel starts directly with the Delete Account banner.

const PageRoot = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 16
})

// Shown only during the brief async window while Magic detection resolves (email-less logins), so
// the page never flashes the "unavailable" message before the real provider is known.
const LoadingState = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  padding: 48
})

export { LoadingState, PageRoot }
