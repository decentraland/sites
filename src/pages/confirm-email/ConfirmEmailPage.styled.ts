import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const ConfirmEmailContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6),
  boxSizing: 'border-box',
  background: 'radial-gradient(circle at 50% 40%, #a326d5 0%, #691fa9 100%)',
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(3),
    background: '#350f44'
  }
}))

const Logo = styled('img')(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(4),
  left: theme.spacing(4),
  width: 48,
  height: 48
}))

const Card = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 576,
  padding: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  boxSizing: 'border-box',
  borderRadius: 24,
  background: '#2d004d',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  [theme.breakpoints.down('xs')]: {
    maxWidth: '100%',
    padding: theme.spacing(3),
    gap: theme.spacing(2.5),
    borderRadius: 0,
    background: 'transparent',
    boxShadow: 'none'
  }
}))

const Title = styled(Typography)(({ theme }) => ({
  margin: 0,
  textAlign: 'center',
  fontSize: 48,
  fontWeight: 700,
  color: dclColors.neutral.white,
  [theme.breakpoints.down('xs')]: {
    fontSize: 32
  }
}))

const Description = styled(Typography)(({ theme }) => ({
  margin: 0,
  width: '100%',
  textAlign: 'center',
  lineHeight: 1.5,
  fontSize: 20,
  color: dclColors.neutral.white,
  [theme.breakpoints.down('xs')]: {
    fontSize: 16,
    maxWidth: 328,
    marginLeft: 'auto',
    marginRight: 'auto'
  }
}))

const TurnstileContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  minHeight: 65,
  margin: theme.spacing(1, 0)
}))

const ButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  marginTop: theme.spacing(1)
}))

const ConfirmButton = styled('button')(({ theme }) => ({
  minWidth: 160,
  padding: theme.spacing(2, 4),
  border: 'none',
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  color: dclColors.neutral.white,
  backgroundColor: dclColors.brand.ruby,
  transition: 'all 0.2s ease',
  ['&:hover']: {
    backgroundColor: '#ff1a45',
    transform: 'translateY(-1px)'
  },
  ['&:active']: {
    transform: 'translateY(0)'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.neutral.white}`,
    outlineOffset: 2
  },
  ['&:disabled']: {
    backgroundColor: '#666',
    cursor: 'not-allowed',
    transform: 'none'
  },
  [theme.breakpoints.down('xs')]: {
    minWidth: 140,
    padding: theme.spacing(1.75, 3.5),
    fontSize: 14
  }
}))

export { ButtonContainer, Card, ConfirmButton, ConfirmEmailContainer, Description, Logo, Title, TurnstileContainer }
