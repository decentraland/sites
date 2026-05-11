import { styled } from 'decentraland-ui2'

const WatcherPageRoot = styled('div')(({ theme }) => ({
  paddingTop: 64,
  [theme.breakpoints.up('md')]: {
    paddingTop: 92
  }
}))

export { WatcherPageRoot }
