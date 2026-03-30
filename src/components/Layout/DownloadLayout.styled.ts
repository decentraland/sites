import { Box, Button, Link, Logo, Typography, dclColors, dclModal, styled } from 'decentraland-ui2'
import backgroundImage from '../../images/download/download_background.webp'

const DownloadPageContainer = styled(Box)({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  height: '100vh',
  minHeight: '650px',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundImage: `linear-gradient(150deg, #2A0C43 0%, #2A0C43 25%, transparent 100%), linear-gradient(225deg, #2A0C43 0%, rgba(42, 12, 67, 0.8) 15%, transparent 100%), url(${backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
})

const DownloadWearablePreviewOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'transparent',
  zIndex: 3
})

const DownloadContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderRadius: '32px',
  paddingLeft: theme.spacing(17.5),
  paddingRight: theme.spacing(9),
  paddingTop: 0,
  paddingBottom: 0,
  height: '100vh',
  width: 'calc(100% - 144px)',
  marginLeft: 'auto',
  marginRight: 'auto',
  zIndex: 2,
  [theme.breakpoints.down('lg')]: {
    paddingLeft: theme.spacing(9)
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: 'calc(100% - 32px)',
    padding: theme.spacing(15.5)
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(3),
    width: '100%'
  }
}))

const DownloadOptionsContainer = styled(Box)({
  zIndex: 10,
  position: 'relative',
  width: '100vw'
})

const PreTitleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const AlreadyDownloadedContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: '10%',
  left: '212px',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  zIndex: 10
}))

const AlreadyDownloadedText = styled(Typography)({
  fontSize: '20px',
  fontWeight: 500,
  lineHeight: '160%'
})

const AlreadyDownloadedLink = styled(Link)({
  textDecoration: 'underline',
  textDecorationStyle: 'solid',
  textDecorationOffset: '0%',
  textDecorationThickness: '0%',
  cursor: 'pointer',
  textTransform: 'uppercase'
})

const DownloadImageContainer = styled(Box)(({ theme }) => ({
  maxWidth: '900px',
  minWidth: '50vh',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  borderRadius: '24px',
  border: 'none',
  position: 'relative',
  display: 'flex',
  [theme.breakpoints.down('md')]: {
    width: '100%'
  }
}))

const DownloadWearablePreviewContainer = styled(Box)({
  width: '100%',
  height: '110%',
  maxHeight: '700px',
  minHeight: '500px',
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 2
})

const DclLogo = styled(Logo)(({ theme }) => ({
  height: '48px',
  width: '48px',
  zIndex: 10,
  cursor: 'pointer',
  [theme.breakpoints.up('sm')]: {
    position: 'absolute',
    top: theme.spacing(9),
    left: theme.spacing(9)
  }
}))

const MobileTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(4),
  zIndex: 10,
  fontWeight: 500,
  fontStyle: 'Medium',
  fontSize: '30px',
  lineHeight: '124%',
  letterSpacing: '0px'
}))

const DownloadTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    textAlign: 'center',
    fontSize: '3rem'
  },
  [theme.breakpoints.down('xs')]: {
    fontSize: '1.8rem'
  }
}))

const ShareContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'fixed',
  bottom: 0,
  background: 'linear-gradient(100.12deg, #130119 0%, #320524 100%)',
  width: '100%',
  padding: theme.spacing(3),
  gap: theme.spacing(2),
  zIndex: 100
}))

const ShareButton = styled(Button)({
  width: '100%',
  height: '56px'
})

const Modal = styled(dclModal.Modal)({})

const ModalContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(3),
  paddingTop: theme.spacing(6),
  paddingBottom: theme.spacing(6)
}))

const ModalIcon = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  backgroundColor: dclColors.base.primary,
  width: '48px',
  height: '48px'
})

const ModalTitle = styled(Typography)({
  fontWeight: 500,
  fontStyle: 'Medium',
  fontSize: '20px',
  lineHeight: '160%',
  letterSpacing: '0px',
  textAlign: 'center',
  verticalAlign: 'middle'
})

export {
  AlreadyDownloadedContainer,
  AlreadyDownloadedLink,
  AlreadyDownloadedText,
  DclLogo,
  DownloadContainer,
  DownloadImageContainer,
  DownloadOptionsContainer,
  DownloadPageContainer,
  DownloadTitle,
  DownloadWearablePreviewContainer,
  DownloadWearablePreviewOverlay,
  MobileTitle,
  Modal,
  ModalContent,
  ModalIcon,
  ModalTitle,
  PreTitleContainer,
  ShareButton,
  ShareContainer
}
