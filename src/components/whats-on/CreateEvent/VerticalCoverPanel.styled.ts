import { keyframes } from '@emotion/react'
import { Box, Typography, styled } from 'decentraland-ui2'

const errorShake = keyframes`
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
`

const errorPulse = keyframes`
  0%, 100% {
    border-color: #f70038;
    box-shadow: 0 0 0 0 rgba(247, 0, 56, 0.45);
  }
  50% {
    border-color: #ff6b8a;
    box-shadow: 0 0 0 8px rgba(247, 0, 56, 0);
  }
`

const PanelContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  [theme.breakpoints.down('md')]: {
    alignItems: 'center'
  }
}))

const DropZone = styled(Box, {
  shouldForwardProp: prop => prop !== '$hasImage' && prop !== '$hasError'
})<{ $hasImage: boolean; $hasError: boolean }>(({ $hasImage, $hasError, theme }) => ({
  position: 'relative',
  border: $hasImage ? 'none' : `2px dashed ${$hasError ? theme.palette.error.main : 'rgba(255, 255, 255, 0.5)'}`,
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
  animation: $hasError ? `${errorShake} 0.4s ease-in-out, ${errorPulse} 1.6s ease-out 0.4s infinite` : 'none',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    borderColor: $hasImage ? undefined : 'rgba(255, 255, 255, 0.7)'
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none'
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

const ErrorRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8.04,
  marginTop: 12,
  color: theme.palette.error.main
}))

const ErrorIcon = styled(Box)({
  width: 16,
  height: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  /* eslint-disable @typescript-eslint/naming-convention */
  '& svg': {
    fontSize: 16
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const ErrorText = styled(Typography)(({ theme }) => ({
  flex: 1,
  fontSize: 12,
  fontWeight: 400,
  lineHeight: 1,
  color: theme.palette.error.main,
  fontFamily: "'Inter', sans-serif"
}))

const OptimizeLink = styled('a')(({ theme }) => ({
  color: theme.palette.error.main,
  fontWeight: 700,
  textDecoration: 'underline',
  cursor: 'pointer'
}))

export {
  CameraIcon,
  ChooseLink,
  DropZone,
  DropZoneContent,
  ErrorIcon,
  ErrorRow,
  ErrorText,
  HintGroup,
  HintText,
  IconAndTitle,
  OptimizeLink,
  OverlayText,
  PanelContainer,
  PreviewImage,
  PreviewOverlay,
  RecommendedSize,
  SelectText
}
