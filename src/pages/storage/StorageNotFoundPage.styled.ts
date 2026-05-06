import { Box, styled } from 'decentraland-ui2'

const NotFoundContainer = styled(Box)(({ theme }) => ({
  paddingTop: 64,
  paddingBottom: theme.spacing(6),
  paddingInline: theme.spacing(2),
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  textAlign: 'center',
  [theme.breakpoints.up('md')]: {
    paddingTop: 96
  }
}))

export { NotFoundContainer }
