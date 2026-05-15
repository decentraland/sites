import { Box, styled } from 'decentraland-ui2'

const InvalidStub = styled(Box)(({ theme }) => ({
  width: '100%',
  minHeight: '100vh',
  paddingTop: 64,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  color: theme.palette.text.primary,
  textAlign: 'center',
  padding: theme.spacing(4),
  [theme.breakpoints.up('md')]: {
    paddingTop: 96
  }
}))

export { InvalidStub }
