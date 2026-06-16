import { Box, Typography, styled } from 'decentraland-ui2'

// LandingNavbar is position:fixed (64px mobile / 92px desktop). Clear it (rule 13).
const AccountPageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: 1440,
  margin: '0 auto',
  paddingTop: 64,
  paddingBottom: theme.spacing(6),
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing(4),
    paddingTop: 96,
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
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(3),
  textAlign: 'center',
  minHeight: '60vh',
  paddingTop: 64,
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    paddingTop: 96
  }
}))

const SignInTitle = styled(Typography)(() => ({
  fontWeight: 600
}))

export { AccountContent, AccountPageContainer, SignInPrompt, SignInTitle }
