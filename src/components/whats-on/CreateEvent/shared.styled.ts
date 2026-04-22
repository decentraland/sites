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

export { ErrorIcon, ErrorRow, ErrorText, OptimizeLink, OverlayText, PreviewImage, PreviewOverlay, errorPulse, errorShake }
