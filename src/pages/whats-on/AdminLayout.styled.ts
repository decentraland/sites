import { Box, Typography, styled } from 'decentraland-ui2'

const AdminPageContainer = styled(Box)(({ theme }) => ({
  background: 'radial-gradient(61.64% 109.58% at 50% 54.49%, #A042CD 0%, #270537 100%)',
  minHeight: '100vh',
  padding: theme.spacing(5, 8),
  paddingTop: theme.spacing(20),
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(5, 4),
    paddingTop: theme.spacing(20)
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(5, 3),
    paddingTop: theme.spacing(18)
  },
  [theme.breakpoints.down('sm')]: {
    background: '#1A0A2E',
    padding: theme.spacing(3, 2),
    paddingTop: theme.spacing(18)
  }
}))

const AdminPageTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontSize: theme.typography.h4.fontSize,
  fontWeight: 600,
  marginBottom: theme.spacing(3)
})) as typeof Typography

export { AdminPageContainer, AdminPageTitle }
