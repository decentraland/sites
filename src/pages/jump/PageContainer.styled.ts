import { Box, styled } from 'decentraland-ui2'

const JumpPageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 96px)',
  width: '100%',
  background: 'linear-gradient(96.05deg, #2E013E 36.2%, #7F0D59 100.69%)',
  paddingTop: 64,
  paddingBottom: 40,
  [theme.breakpoints.up('md')]: {
    paddingTop: 96,
    paddingBottom: 64
  },
  [theme.breakpoints.down('md')]: {
    alignItems: 'stretch',
    paddingTop: 64,
    paddingBottom: 0
  }
}))

export { JumpPageContainer }
