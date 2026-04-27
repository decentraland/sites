import { Box, Typography, styled } from 'decentraland-ui2'

const SuccessOverlay = styled(Box)({
  position: 'fixed',
  inset: 0,
  zIndex: 1400,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  background: 'radial-gradient(52.86% 115.71% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)'
})

const SuccessContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 48,
  width: '100%',
  maxWidth: 737,
  padding: theme.spacing(6, 3),
  [theme.breakpoints.down('md')]: {
    gap: 32,
    padding: theme.spacing(4, 2)
  }
}))

const CheckCircle = styled(Box)({
  width: 94,
  height: 94,
  borderRadius: '50%',
  background: '#2ecc71',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  /* eslint-disable @typescript-eslint/naming-convention */
  '& svg': {
    fontSize: 56,
    color: '#ffffff'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const SuccessMessage = styled(Typography)(({ theme }) => ({
  fontSize: 24,
  fontWeight: 500,
  lineHeight: 1.334,
  color: '#ffffff',
  textAlign: 'center',
  fontFamily: "'Inter', sans-serif",
  [theme.breakpoints.down('md')]: {
    fontSize: 18
  }
}))

const ActionsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: 24,
  alignItems: 'center',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    width: '100%',
    gap: 12
  }
}))

const baseButton = {
  height: 46,
  borderRadius: 12,
  padding: '8px 22px',
  border: 'none',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: '0.46px',
  textTransform: 'uppercase' as const,
  lineHeight: '24px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'opacity 0.2s ease, box-shadow 0.2s ease',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    opacity: 0.9,
    boxShadow: '0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 1px 5px rgba(0,0,0,0.12)'
  },
  '&:focus-visible': {
    outline: '2px solid #ecebed',
    outlineOffset: 2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}

const SecondaryButton = styled('button')(({ theme }) => ({
  ...baseButton,
  background: '#ecebed',
  color: '#242129',
  [theme.breakpoints.down('sm')]: {
    width: '100%'
  }
}))

const PrimaryButton = styled('button')(({ theme }) => ({
  ...baseButton,
  background: theme.palette.primary.main,
  color: '#ffffff',
  minWidth: 189,
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    ...baseButton['&:hover'],
    background: theme.palette.primary.dark
  },
  /* eslint-enable @typescript-eslint/naming-convention */
  [theme.breakpoints.down('sm')]: {
    width: '100%'
  }
}))

export { ActionsRow, CheckCircle, PrimaryButton, SecondaryButton, SuccessContainer, SuccessMessage, SuccessOverlay }
