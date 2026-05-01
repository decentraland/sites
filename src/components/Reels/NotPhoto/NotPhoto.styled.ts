import { Box, Typography, styled } from 'decentraland-ui2'

const NotPhotoContainer = styled(Box)({
  width: '100vw',
  height: '100vh',
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  backgroundColor: '#242129',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  color: '#fff',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& > img': {
    marginBottom: 24
  }
})

const NotPhotoTitle = styled(Typography)({
  color: '#fcfcfc',
  fontSize: 24,
  fontWeight: 600,
  opacity: 0.8,
  marginBottom: 12
})

const NotPhotoSubtitle = styled(Typography)({
  color: '#fcfcfc',
  fontSize: 14,
  fontWeight: 400,
  lineHeight: '24px',
  paddingLeft: 20,
  paddingRight: 20,
  textAlign: 'center',
  opacity: 0.8,
  maxWidth: 480
})

export { NotPhotoContainer, NotPhotoSubtitle, NotPhotoTitle }
