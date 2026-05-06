import { Box, Button, Checkbox, FormControlLabel, Logo, Typography, styled } from 'decentraland-ui2'

const FormBackground = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: `calc(64px + ${theme.spacing(4)})`,
  paddingBottom: theme.spacing(8),
  paddingLeft: theme.spacing(4),
  paddingRight: theme.spacing(4),
  [theme.breakpoints.up('md')]: {
    paddingTop: `calc(96px + ${theme.spacing(4)})`,
    paddingBottom: theme.spacing(12)
  }
}))

const FormContent = styled(Box)({
  position: 'relative',
  zIndex: 1,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
})

const FormCard = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(22, 7, 35, 0.92)',
  borderRadius: Number(theme.shape.borderRadius) * 2,
  padding: theme.spacing(6, 4),
  maxWidth: 608,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(6),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(6, 8)
  },
  ['& .MuiOutlinedInput-root']: {
    ['& .MuiOutlinedInput-notchedOutline']: {
      borderColor: theme.palette.action.hover
    },
    ['&:hover .MuiOutlinedInput-notchedOutline']: {
      borderColor: theme.palette.action.selected
    },
    ['&.Mui-focused .MuiOutlinedInput-notchedOutline']: {
      borderColor: theme.palette.primary.main
    }
  }
}))

const LogoWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2)
}))

const FormLogo = styled(Logo)({
  height: 64,
  width: 64
})

const FormTitle = styled(Typography)({
  fontWeight: 600,
  textAlign: 'center'
})

const SubmitButton = styled(Button)({
  alignSelf: 'flex-start'
})

const SignInAlert = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(237, 108, 2, 0.12)',
  border: `1px solid ${theme.palette.warning.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5, 2),
  color: theme.palette.warning.main,
  ...theme.typography.body2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2)
}))

const WalletMismatchAlert = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(251, 59, 59, 0.16)',
  border: `1px solid ${theme.palette.error.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5, 2),
  color: theme.palette.error.main,
  ...theme.typography.body2
}))

const ConfirmCheckbox = styled(Checkbox, {
  shouldForwardProp: prop => prop !== 'showError'
})<{ showError: boolean }>(({ theme, showError }) => ({
  color: showError ? theme.palette.error.main : undefined
}))

const ConfirmLabel = styled(FormControlLabel)(({ theme }) => ({
  ['& .MuiTypography-root']: {
    ...theme.typography.body2
  }
}))

const ConfirmError = styled(Typography)(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.palette.error.main
}))

const SubmitError = styled(Typography)(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.palette.error.main
}))

const FooterText = styled(Typography)(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.palette.text.secondary,
  textAlign: 'center',
  marginTop: theme.spacing(2)
}))

const FooterLink = styled('a')(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  ['&:hover']: {
    textDecoration: 'underline'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
    borderRadius: 2
  }
}))

const CharacterCounter = styled(Typography)(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.palette.text.secondary,
  textAlign: 'right'
}))

export {
  CharacterCounter,
  ConfirmCheckbox,
  ConfirmError,
  ConfirmLabel,
  FooterLink,
  FooterText,
  FormBackground,
  FormCard,
  FormContent,
  FormLogo,
  FormTitle,
  LogoWrapper,
  SignInAlert,
  SubmitButton,
  SubmitError,
  WalletMismatchAlert
}
