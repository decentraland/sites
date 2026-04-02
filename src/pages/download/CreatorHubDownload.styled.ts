import { Box, Typography, styled } from 'decentraland-ui2'

const PageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(150deg, #2A0C43 0%, #1A0A2E 50%, #3D1464 100%)',
  minHeight: 'calc(100vh - 64px)',
  padding: theme.spacing(10, 0),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(5, 0)
  }
}))

const CardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: 'calc(100% - 144px)',
  maxWidth: '1100px',
  minHeight: '460px',
  background: 'rgba(28, 7, 47, 0.7)',
  borderRadius: '32px',
  border: '1px solid rgba(160, 155, 168, 0.2)',
  padding: theme.spacing(8),
  gap: theme.spacing(6),
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    width: 'calc(100% - 48px)',
    padding: theme.spacing(5),
    minHeight: 'auto'
  }
}))

const InfoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  flex: 1,
  minWidth: 0
}))

const Title = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '2.5rem',
  lineHeight: 1.2,
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.75rem'
  }
}))

const BannerImage = styled('img')(({ theme }) => ({
  maxWidth: '480px',
  width: '50%',
  height: 'auto',
  objectFit: 'contain',
  flexShrink: 0,
  [theme.breakpoints.down('md')]: {
    width: '100%',
    maxWidth: '400px'
  }
}))

const DownloadActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}))

export { BannerImage, CardContainer, DownloadActions, InfoContainer, PageContainer, Title }
