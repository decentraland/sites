import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const MobileSubtitle = styled(Typography)({
  color: dclColors.neutral.white,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  fontSize: 20,
  lineHeight: '28px',
  textAlign: 'center',
  textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)'
})

const GooglePlayButton = styled('a')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'calc(100% - 32px)',
  maxWidth: 345,
  height: 64,
  borderRadius: 12,
  backgroundColor: '#FF2D55',
  textDecoration: 'none',
  cursor: 'pointer',
  boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    opacity: 0.9
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:active': {
    opacity: 0.8
  }
})

const GooglePlayImage = styled('img')({
  height: 40,
  width: 'auto'
})

const SendLinkButton = styled('button')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: 'calc(100% - 32px)',
  maxWidth: 345,
  height: 46,
  borderRadius: 12,
  backgroundColor: '#FF2D55',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 700,
  fontSize: 16,
  color: '#FCFCFC',
  textTransform: 'uppercase',
  boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px',
  outline: 'none',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    opacity: 0.9
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:active': {
    opacity: 0.8
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  }
})

const ComingSoonRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 46
})

const ComingSoonIcon = styled('img')({
  width: 24,
  height: 32,
  filter: 'brightness(0) invert(1)'
})

const ComingSoonText = styled(Typography)({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  fontSize: 18,
  color: '#FCFCFC'
})

export { ComingSoonIcon, ComingSoonRow, ComingSoonText, GooglePlayButton, GooglePlayImage, MobileSubtitle, SendLinkButton }
