import { Box, Typography, styled } from 'decentraland-ui2'

const PanelContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  [theme.breakpoints.down('md')]: {
    alignItems: 'center'
  }
}))

const DropZone = styled(Box, {
  shouldForwardProp: prop => prop !== '$hasImage'
})<{ $hasImage: boolean }>(({ $hasImage, theme }) => ({
  position: 'relative',
  border: $hasImage ? 'none' : '2px dashed rgba(255, 255, 255, 0.5)',
  borderRadius: 20,
  width: 301,
  height: 522,
  background: $hasImage ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: $hasImage ? 'default' : 'pointer',
  overflow: 'hidden',
  padding: 12,
  transition: 'border-color 0.2s ease',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    borderColor: $hasImage ? undefined : 'rgba(255, 255, 255, 0.7)'
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
    maxWidth: 301
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const DropZoneContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  width: '100%',
  padding: '0 12px'
})

const IconAndTitle = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 1,
  width: 255
})

const CameraIcon = styled(Box)({
  width: 104,
  height: 104,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  /* eslint-disable @typescript-eslint/naming-convention */
  '& svg': {
    fontSize: 64,
    color: 'rgba(255, 255, 255, 0.5)'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const SelectText = styled(Typography)({
  fontSize: 16,
  fontWeight: 400,
  color: '#fcfcfc',
  textAlign: 'center',
  lineHeight: 1.5,
  fontFamily: "'Inter', sans-serif"
})

const HintGroup = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  width: '100%'
})

const ChooseLink = styled('span')({
  fontWeight: 700,
  fontSize: 12,
  color: '#fcfcfc',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif"
})

const HintText = styled('span')({
  fontSize: 12,
  fontWeight: 500,
  color: '#fcfcfc',
  textAlign: 'center',
  fontFamily: "'Inter', sans-serif",
  lineHeight: 1.6
})

const RecommendedSize = styled(Typography)({
  fontSize: 12,
  fontWeight: 400,
  color: '#cfcdd4',
  textAlign: 'center',
  lineHeight: 1,
  fontFamily: "'Inter', sans-serif"
})

const PreviewImage = styled('img')({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 20
})

const PreviewOverlay = styled(Box)({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.5)',
  opacity: 0,
  transition: 'opacity 0.2s ease',
  borderRadius: 20,
  cursor: 'pointer',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    opacity: 1
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const OverlayText = styled(Typography)({
  fontSize: 14,
  fontWeight: 600,
  color: '#fff',
  textTransform: 'uppercase'
})

export {
  CameraIcon,
  ChooseLink,
  DropZone,
  DropZoneContent,
  HintGroup,
  HintText,
  IconAndTitle,
  OverlayText,
  PanelContainer,
  PreviewImage,
  PreviewOverlay,
  RecommendedSize,
  SelectText
}
