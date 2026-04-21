import { Box, styled } from 'decentraland-ui2'

/* eslint-disable @typescript-eslint/naming-convention */
const MainContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  background: 'radial-gradient(61.64% 109.58% at 50% 54.49%, #A042CD 0%, #270537 100%)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%)',
    pointerEvents: 'none',
    zIndex: 1
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
    background: '#1A0A2E'
  }
}))

// Renders the decorative top banner as a real <img> so the browser's preload scanner
// can discover it and apply fetchpriority=high — unlike a CSS `background-image` which
// is invisible to LCP discovery.
const TopBackgroundImage = styled('img')(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100%',
  maxWidth: 'none',
  height: 700,
  objectFit: 'cover',
  objectPosition: 'top center',
  pointerEvents: 'none',
  userSelect: 'none',
  zIndex: 0,
  [theme.breakpoints.down('sm')]: {
    display: 'none'
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

export { ContentWrapper, DeferredGroup, MainContainer, TopBackgroundImage }
