import { Box, styled } from 'decentraland-ui2'
import eventsBackground from '../../images/jump/background-invalid-events-page.webp'
import placesBackground from '../../images/jump/background-invalid-places-page.webp'

interface ContainerProps {
  isEventPage: boolean
  isMobile: boolean
}

const InvalidPageContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'isEventPage' && prop !== 'isMobile'
})<ContainerProps>(({ isEventPage, isMobile, theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 96px)',
  width: '100%',
  padding: isMobile ? '24px 16px 120px 16px' : '48px 24px',
  paddingTop: 64,
  [theme.breakpoints.up('md')]: { paddingTop: 96 },
  backgroundImage: `url(${isEventPage ? eventsBackground : placesBackground})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: '#ffffff',
  textAlign: 'center'
}))

const ContentBox = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 520,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%'
  }
}))

const MobileActionsContainer = styled(Box)({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '16px 24px 32px 24px',
  background: 'linear-gradient(100.12deg, #130119 0%, #320524 100%)',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  zIndex: 1000
})

export { ContentBox, InvalidPageContainer, MobileActionsContainer }
