import { Box, Typography, styled } from 'decentraland-ui2'

// Figma 322:101466 — Account Settings sits on the same brand violet radial gradient as the
// profile area (mirrors ProfileLayout). Full-bleed background wrapper; the centred column
// renders above it via zIndex.
const AccountLayoutRoot = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  minHeight: '100vh',
  paddingTop: 64,
  paddingBottom: theme.spacing(8),
  background: 'radial-gradient(123.58% 82% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
  isolation: 'isolate',
  [theme.breakpoints.up('md')]: {
    paddingTop: 96
  }
}))

const AccountPageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: 1440,
  margin: '0 auto',
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing(4),
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4)
  }
}))

const AccountContent = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  width: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(2, 0, 0)
  }
}))

const SignInPrompt = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(3),
  textAlign: 'center',
  minHeight: '50vh',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2)
}))

const SignInTitle = styled(Typography)(() => ({
  fontWeight: 600,
  color: '#FCFCFC'
}))

export { AccountContent, AccountLayoutRoot, AccountPageContainer, SignInPrompt, SignInTitle }
