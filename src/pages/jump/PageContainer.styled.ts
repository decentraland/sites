import { Box, styled } from 'decentraland-ui2'

// Wraps the UI2 AnimatedBackground as the site-wide background for /jump
// routes. The background sits at z-index 0; the card content is layered on
// top via a relative wrapper so it stays clickable.
const JumpPageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  width: '100%',
  paddingTop: 64,
  paddingBottom: 40,
  [theme.breakpoints.up('md')]: {
    paddingTop: 96,
    paddingBottom: 64
  },
  [theme.breakpoints.down('md')]: {
    alignItems: 'stretch',
    paddingBottom: 0
  }
}))

const JumpPageContent = styled(Box)({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%'
})

export { JumpPageContainer, JumpPageContent }
