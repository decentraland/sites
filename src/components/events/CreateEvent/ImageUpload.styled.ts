import { Box, Typography, styled } from 'decentraland-ui2'
import { OverlayText, PreviewImage, PreviewOverlay, errorPulse, errorShake } from './shared.styled'

const DropZone = styled(Box, {
  shouldForwardProp: prop => prop !== '$hasImage' && prop !== '$hasError'
})<{ $hasImage: boolean; $hasError: boolean }>(({ $hasImage, $hasError, theme }) => ({
  position: 'relative',
  border: $hasImage ? 'none' : `2px dashed ${$hasError ? theme.palette.error.main : 'rgba(255, 255, 255, 0.5)'}`,
  borderRadius: 20,
  width: '100%',
  aspectRatio: '16 / 9',
  background: $hasImage ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  overflow: 'hidden',
  padding: 12,
  transition: 'border-color 0.2s ease',
  animation: $hasError ? `${errorShake} 0.4s ease-in-out, ${errorPulse} 1.6s ease-out 0.4s infinite` : 'none',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    borderColor: $hasImage ? undefined : 'rgba(255, 255, 255, 0.7)'
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none'
  },
  [theme.breakpoints.down('md')]: {
    aspectRatio: $hasImage ? '16 / 9' : 'auto',
    minHeight: $hasImage ? 0 : 240,
    padding: $hasImage ? 0 : '48px 12px'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const DropZoneContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16
})

const IconAndTitle = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 1,
  width: 255
})

const CameraIcon = styled(Box)(({ theme }) => ({
  width: 104.5,
  height: 104.5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  [theme.breakpoints.down('md')]: {
    width: 80,
    height: 80
  }
}))

const SelectText = styled(Typography)(({ theme }) => ({
  fontSize: 20,
  fontWeight: 600,
  color: '#fcfcfc',
  textAlign: 'center',
  lineHeight: '30px',
  fontFamily: "'Inter', sans-serif",
  [theme.breakpoints.down('md')]: {
    fontSize: 16
  }
}))

const UploadHintGroup = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  width: '100%'
})

const ChooseLink = styled('span')({
  fontWeight: 700,
  fontSize: 14,
  color: '#fcfcfc',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif"
})

const DropHintText = styled('span')({
  fontSize: 14,
  fontWeight: 500,
  color: '#fcfcfc',
  textAlign: 'center',
  fontFamily: "'Inter', sans-serif"
})

const RecommendedSize = styled(Typography)({
  fontSize: 12,
  fontWeight: 400,
  color: 'rgba(255, 255, 255, 0.7)',
  textAlign: 'center',
  fontFamily: "'Inter', sans-serif"
})

const HelperRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  marginTop: 12,
  [theme.breakpoints.down('md')]: {
    gap: 8
  }
}))

const HelperIcon = styled(Box)(({ theme }) => ({
  width: 20,
  height: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  [theme.breakpoints.down('md')]: {
    width: 16,
    height: 16
  }
}))

const HelperText = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 400,
  color: '#fcfcfc',
  lineHeight: 1.43,
  fontFamily: "'Inter', sans-serif",
  flex: 1,
  [theme.breakpoints.down('md')]: {
    fontSize: 12,
    lineHeight: 1.5
  }
}))

export {
  CameraIcon,
  ChooseLink,
  DropHintText,
  DropZone,
  DropZoneContent,
  HelperIcon,
  HelperRow,
  HelperText,
  IconAndTitle,
  OverlayText,
  PreviewImage,
  PreviewOverlay,
  RecommendedSize,
  SelectText,
  UploadHintGroup
}
