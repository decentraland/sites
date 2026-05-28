import { Box, Link, Logo, Typography, dclColors, dclModal, styled } from 'decentraland-ui2'
import backgroundImage from '../../images/download/download_background.webp'

// Signed-in keeps the original framing (darkens the top/left corners around the
// avatar). Signed-out fades the left side behind the copy into the page purple
// while leaving the right side of the scene visible.
const SIGNED_IN_BACKGROUND = `linear-gradient(150deg, #2A0C43 0%, #2A0C43 25%, transparent 100%), linear-gradient(225deg, #2A0C43 0%, rgba(42, 12, 67, 0.8) 15%, transparent 100%), url(${backgroundImage})`
const SIGNED_OUT_BACKGROUND = `linear-gradient(270deg, rgba(42, 12, 67, 0.00) 13.9%, rgba(42, 12, 67, 0.84) 53.91%, #2A0C43 86.65%), url(${backgroundImage})`
// Mobile signed-out: top-to-bottom gradient over the scene image (purple behind
// the copy up top, fading to reveal the theatre below).
const SIGNED_OUT_BACKGROUND_MOBILE = `linear-gradient(180deg, #380169 16.82%, rgba(56, 1, 105, 0.00) 76.7%), url(${backgroundImage})`

const DownloadPageContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'hasPreview'
})<{ hasPreview?: boolean }>(({ theme, hasPreview }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  height: '100vh',
  minHeight: '650px',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundImage: hasPreview ? SIGNED_IN_BACKGROUND : SIGNED_OUT_BACKGROUND,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  [theme.breakpoints.down('sm')]: {
    height: '100svh',
    minHeight: 'unset',
    overflow: 'hidden',
    ...(!hasPreview && { backgroundImage: SIGNED_OUT_BACKGROUND_MOBILE })
  }
}))

const DownloadWearablePreviewOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'transparent',
  zIndex: 3
})

const DownloadContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'hasPreview'
})<{ hasPreview?: boolean }>(({ theme, hasPreview }) => ({
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
    // With the avatar preview present the title sits above it (space-between).
    // Without it (signed-out), keep the title near the top instead of letting
    // space-between push it to the bottom of the viewport.
    justifyContent: hasPreview ? 'space-between' : 'flex-start',
    alignItems: 'flex-start',
    width: 'calc(100% - 32px)',
    padding: theme.spacing(15.5),
    // Signed-in mounts the fixed navbar (64px on mobile); clear it so the title
    // isn't tucked underneath. Signed-out has no navbar, so keep the small inset.
    ...(hasPreview && { paddingTop: theme.spacing(8) }),
    height: '100svh',
    overflow: 'visible'
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(3),
    ...(hasPreview && { paddingTop: theme.spacing(8) }),
    width: '100%'
  }
}))

const DownloadOptionsContainer = styled(Box)({
  zIndex: 10,
  position: 'relative',
  // Size to the content instead of `100vw`: a full-viewport width turned this
  // (zIndex:10) block into an invisible overlay spanning the right side, covering
  // the empty area when signed out and the avatar when signed in. `flexShrink: 0`
  // keeps the title on two lines when the avatar shares the row (signed in).
  width: 'fit-content',
  flexShrink: 0
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
  },
  [theme.breakpoints.down('sm')]: {
    minWidth: 'unset',
    maxWidth: '100%',
    overflow: 'visible'
  }
}))

const DownloadWearablePreviewContainer = styled(Box)(({ theme }) => ({
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
  zIndex: 2,
  [theme.breakpoints.down('sm')]: {
    minHeight: 'unset',
    height: '60%',
    top: '40%'
  }
}))

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
  marginTop: theme.spacing(6),
  zIndex: 10,
  fontWeight: 600,
  fontSize: '30px',
  lineHeight: '124%',
  letterSpacing: '0px',
  whiteSpace: 'pre-line'
}))

const DownloadTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  whiteSpace: 'pre-line',
  [theme.breakpoints.down('sm')]: {
    textAlign: 'center',
    fontSize: '3rem'
  },
  [theme.breakpoints.down('xs')]: {
    fontSize: '1.8rem'
  }
}))

const FooterWrapper = styled(Box)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    paddingBottom: '200px'
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

const SignInButton = styled('button')(({ theme }) => ({
  all: 'unset',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 22px',
  border: `1px solid ${dclColors.neutral.softWhite}`,
  borderRadius: 6,
  fontWeight: 600,
  fontSize: 15,
  lineHeight: '24px',
  letterSpacing: 0.46,
  textTransform: 'uppercase',
  color: dclColors.neutral.softWhite,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  zIndex: 10,
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
  position: 'absolute',
  top: theme.spacing(9),
  right: theme.spacing(9),
  ['&:hover']: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.7)'
  },
  ['&:active']: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: 2
  },
  [theme.breakpoints.down('sm')]: {
    top: theme.spacing(4),
    right: theme.spacing(3)
  }
}))

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
  FooterWrapper,
  MobileTitle,
  Modal,
  ModalContent,
  ModalIcon,
  ModalTitle,
  PreTitleContainer,
  ShareContainer,
  SignInButton
}
