import { hexToRgba } from 'decentraland-ui2/dist/utils/colors'
import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const PrivateMessageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(3),
  width: '1920px',
  maxWidth: '100%',
  height: '571px',
  padding: theme.spacing(6, 15, 0, 15),
  borderTop: `1px solid ${hexToRgba(dclColors.neutral.white, 0.3)}`,
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    height: 'auto',
    padding: theme.spacing(4),
    gap: theme.spacing(3)
  }
}))

const PrivateMessageContent = styled(Box)(({ theme }) => ({
  width: '550px',
  maxWidth: '100%',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3)
}))

const PrivateMessageTitle = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.softWhite,
  textAlign: 'center',
  fontSize: theme.typography.subtitle1.fontSize,
  fontWeight: 600,
  fontFamily: theme.typography.fontFamily
}))

const PrivateMessageText = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.softWhite,
  textAlign: 'center',
  fontSize: theme.typography.body2.fontSize,
  fontWeight: 400,
  fontFamily: theme.typography.fontFamily
}))

const LockIconBox = styled(Box)({
  width: '100px',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

export { LockIconBox, PrivateMessageContainer, PrivateMessageContent, PrivateMessageText, PrivateMessageTitle }
