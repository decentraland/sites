import { Box, styled } from 'decentraland-ui2'

// Figma 322:101467 — the section content sits on a translucent black "principal" panel
// (#00000033 = rgba(0,0,0,0.2)); the inner balance cards use the same value so they layer
// slightly darker against it.
const WalletsPanel = styled(Box)(({ theme }) => ({
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

export { WalletsPanel }
