/* eslint-disable @typescript-eslint/naming-convention */
import { Card, styled } from 'decentraland-ui2'

// Heights subtract sites' fixed navbar (64px mobile, 92px desktop) so the
// view fits within the Layout outlet without scrolling past the footer.
const ViewContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 'calc(100dvh - 64px)',
  background: 'linear-gradient(247deg, #210A35 0%, #000 50%, #210A35 100%)',
  [theme.breakpoints.up('md')]: {
    minHeight: 'calc(100dvh - 92px)'
  },
  [theme.breakpoints.down('sm')]: {
    paddingTop: 0
  }
}))

const ViewLayout = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100dvh - 64px)',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.up('md')]: {
    height: 'calc(100dvh - 92px)'
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column'
  }
}))

const MainContent = styled('div')(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  minHeight: 0,
  transition: 'all 0.3s ease-in-out',
  padding: 24,
  [theme.breakpoints.down('sm')]: {
    padding: 0
  }
}))

const VideoContainer = styled('div')<{ $sidebarOpen: boolean }>(({ theme }) => ({
  flex: 1,
  display: 'flex',
  position: 'relative',
  minHeight: 0,
  gap: 18,
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    gap: 0
  }
}))

const VideoArea = styled('div')<{ $sidebarOpen: boolean }>(({ theme, $sidebarOpen }) => ({
  flex: 1,
  minWidth: 0,
  background: '#1a0b2e',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  boxSizing: 'border-box',
  borderRadius: 12,
  marginRight: $sidebarOpen ? '418px' : '0',
  transition: 'margin-right 0.3s ease-out',
  willChange: $sidebarOpen ? 'margin-right' : 'auto',
  '& video': {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  [theme.breakpoints.down('lg')]: {
    marginRight: $sidebarOpen ? '338px' : '0'
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: 0,
    padding: 0,
    margin: 0
  }
}))

const Sidebar = styled('div')<{ $isOpen: boolean }>(({ theme, $isOpen }) => {
  return {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #66497f 0%, #3f2357 100%)',
    borderRadius: 12,
    boxSizing: 'border-box',
    flexShrink: 0,
    transform: $isOpen ? 'translateX(0)' : 'translateX(calc(100% + 18px))',
    transition: 'transform 0.3s ease-out',
    willChange: $isOpen ? 'transform' : 'auto',
    [theme.breakpoints.down('lg')]: {
      width: '320px'
    },
    [theme.breakpoints.down('sm')]: {
      position: 'fixed',
      left: 0,
      width: '100%',
      height: '100dvh',
      padding: 16,
      paddingBottom: 80,
      borderRadius: 0,
      zIndex: 100,
      transform: $isOpen ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.3s ease-out'
    }
  }
})

const ControlsArea = styled('div')({
  position: 'relative',
  zIndex: 20,
  width: '100%',
  background: 'transparent',
  flexShrink: 0
})

const ErrorContainer = styled(Card)(() => ({
  padding: 24,
  margin: 20,
  background: 'rgba(255, 77, 77, 0.1)',
  border: '1px solid rgba(255, 77, 77, 0.3)',
  color: 'white'
}))

const AuthPrompt = styled('div')({
  marginTop: 12,
  padding: 12,
  background: 'rgba(0, 0, 0, 0.6)',
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  alignItems: 'center',
  '& .MuiTypography-root': {
    marginBottom: 8
  }
})

export { AuthPrompt, ControlsArea, ErrorContainer, MainContent, Sidebar, VideoArea, VideoContainer, ViewContainer, ViewLayout }
