import { Box, styled } from 'decentraland-ui2'

// Figma 821:87052 — the credits section content sits on a translucent black "principal" panel
// (#00000033 = rgba(0,0,0,0.2)), matching the wallets section.
const CreditsPanel = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  background: 'rgba(0, 0, 0, 0.2)',
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3)
  }
}))

export { CreditsPanel }
