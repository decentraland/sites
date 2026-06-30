import { Box, styled } from 'decentraland-ui2'

// Figma 797:78245 — Delete Account page. No page heading (the sidebar marks the active section,
// matching every other account section); the panel starts directly with the Danger Zone banner.

const PageRoot = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 16
})

export { PageRoot }
