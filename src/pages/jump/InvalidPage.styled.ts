import { Box, styled } from 'decentraland-ui2'

const InvalidPageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  width: '100%',
  padding: '48px 24px',
  paddingTop: 64,
  color: '#ffffff',
  textAlign: 'center',
  [theme.breakpoints.up('md')]: { paddingTop: 96 },
  [theme.breakpoints.down('md')]: {
    padding: '24px 16px 120px 16px',
    paddingTop: 64
  }
}))

const InvalidPageContent = styled(Box)({
  position: 'relative',
  zIndex: 1,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
})

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

export { ContentBox, InvalidPageContainer, InvalidPageContent, MobileActionsContainer }
