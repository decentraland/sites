import { Box, styled } from 'decentraland-ui2'
import topBackground from '../../images/explore/images/top_background.webp'

/* eslint-disable @typescript-eslint/naming-convention */
const MainContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  background: `url(${topBackground}) no-repeat top center, radial-gradient(61.64% 109.58% at 50% 54.49%, #A042CD 0%, #270537 100%)`,
  backgroundSize: '100% 700px, 100% auto',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%)',
    pointerEvents: 'none'
  },
  overflow: 'hidden',
  minHeight: '100vh',
  padding: theme.spacing(5, 8, 0, 8),
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(5, 4, 0, 4)
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(5, 3, 0, 3)
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0, 0, 0, 0),
    background: '#1A0A2E',
    backgroundSize: 'unset',
    '&::before': {
      display: 'none'
    }
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

const ContentWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  paddingTop: '66px',
  [theme.breakpoints.down('sm')]: {
    paddingTop: '56px',
    gap: 0
  }
}))

const DeferredGroup = styled(Box, { shouldForwardProp: prop => prop !== 'deferred' })<{ deferred: boolean }>(({ deferred }) => ({
  display: deferred ? 'none' : 'contents'
}))

export { ContentWrapper, DeferredGroup, MainContainer }
