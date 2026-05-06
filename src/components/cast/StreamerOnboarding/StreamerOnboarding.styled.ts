import { keyframes } from '@emotion/react'
import { Box, TextField, Typography, styled } from 'decentraland-ui2'
import backgroundImage from '../../../assets/images/cast/background.png'

const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' }
})

const OnboardingContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100dvh',
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(216, 0, 41, 0.3) 0%, rgba(22, 33, 62, 0.5) 50%, rgba(13, 17, 23, 0.7) 100%)',
    zIndex: 0
  }
})

const OnboardingModal = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: theme.spacing(2),
  padding: `${theme.spacing(4)} ${theme.spacing(9)} ${theme.spacing(5)} ${theme.spacing(9)}`,
  maxWidth: '603px',
  width: '90%',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    maxHeight: '100dvh',
    overflowY: 'auto',
    width: '95%',
    padding: `${theme.spacing(3)} ${theme.spacing(4)} ${theme.spacing(4)} ${theme.spacing(4)}`
  }
}))

const LogoContainer = styled(Box)({
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px'
})

const LogoImage = styled('img')({
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  objectFit: 'cover',
  background: 'white'
})

const Title = styled(Typography)(({ theme }) => ({
  ...theme.typography.h5,
  fontWeight: 700,
  color: '#1a1a1a',
  textAlign: 'center',
  marginTop: theme.spacing(1),
  maxWidth: '100%',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.25rem',
    whiteSpace: 'normal',
    wordBreak: 'break-word'
  }
}))

const ParticipantLabel = styled(Typography)(({ theme }) => ({
  ...theme.typography.body2,
  color: '#666',
  textAlign: 'center',
  marginTop: -theme.spacing(2)
}))

const StyledTextField = styled(TextField)(({ theme }) => ({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1),
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)'
    },
    '&:hover fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)'
    },
    '&.Mui-focused fieldset': {
      borderColor: '#FF2D55'
    }
  },
  '& .MuiInputBase-input': {
    color: '#1a1a1a'
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#999',
    opacity: 1
  }
}))

const DeviceSelectorsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(2),
  width: '100%',
  justifyContent: 'space-between',
  [theme.breakpoints.down('sm')]: {
    justifyContent: 'center'
  }
}))

const DeviceSelectorRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flex: 1,
  position: 'relative',
  justifyContent: 'center',
  '& svg': {
    color: '#1a1a1a',
    fontSize: '20px',
    flexShrink: 0
  },
  [theme.breakpoints.down('sm')]: {
    '& svg': {
      fontSize: '24px'
    }
  }
}))

const SelectorButton = styled('button')<{ $isOpen: boolean }>(({ theme, $isOpen }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'auto',
  minWidth: 'auto',
  padding: `${theme.spacing(0.5)} ${theme.spacing(0.75)}`,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#1a1a1a',
  fontFamily: 'inherit',
  transition: 'background-color 0.2s ease',
  borderRadius: theme.spacing(0.5),
  gap: theme.spacing(0.25),
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)'
  },
  '& svg': {
    color: '#1a1a1a',
    transition: 'transform 0.2s ease',
    transform: $isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    flexShrink: 0
  },
  [theme.breakpoints.down('sm')]: {
    padding: `${theme.spacing(0.5)} ${theme.spacing(0.5)}`,
    minWidth: 'auto',
    width: 'auto'
  }
}))

const SelectorLabel = styled('span')(({ theme }) => ({
  flex: 1,
  textAlign: 'left',
  fontSize: '14px',
  color: '#1a1a1a',
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

const DropdownList = styled('div')(({ theme }) => ({
  position: 'fixed',
  minWidth: '250px',
  marginTop: theme.spacing(0.5),
  background: 'white',
  border: '1px solid #e0e0e0',
  borderRadius: theme.spacing(1),
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  zIndex: 10001,
  maxHeight: '200px',
  overflowY: 'auto',
  [theme.breakpoints.down('sm')]: {
    minWidth: '200px',
    maxWidth: '90vw'
  }
}))

const DropdownItem = styled('div')<{ $isSelected: boolean }>(({ theme, $isSelected }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
  fontSize: '14px',
  color: $isSelected ? '#FF2D55' : '#1a1a1a',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)'
  },
  '& svg': {
    fontSize: '18px',
    color: '#FF2D55'
  }
}))

const JoinButton = styled('button')(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  border: 'none',
  background: 'linear-gradient(90deg, #FF2D55 0%, #FF6B82 100%)',
  color: 'white',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  '&:hover': {
    background: 'linear-gradient(90deg, #E02849 0%, #E65970 100%)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(255, 45, 85, 0.3)'
  },
  '&:active': {
    transform: 'translateY(0)'
  },
  '&:disabled': {
    background: theme.palette.grey[300],
    cursor: 'not-allowed',
    transform: 'none'
  }
}))

const JoiningContainer = styled(Box)({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px'
})

const JoiningLogo = styled(Box)({
  width: '96px',
  height: '96px',
  borderRadius: '50%',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px',
  boxShadow: '0 8px 24px rgba(255, 45, 85, 0.4)'
})

const JoiningLogoImage = styled('img')({
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  objectFit: 'cover',
  background: 'white'
})

const JoiningText = styled(Typography)({
  color: 'white',
  fontSize: '24px',
  fontWeight: 500
})

const JoiningSpinner = styled('div')({
  width: '48px',
  height: '48px',
  border: '4px solid rgba(255, 255, 255, 0.2)',
  borderTop: '4px solid #FF2D55',
  borderRadius: '50%',
  animation: `${spin} 1s linear infinite`
})

export {
  DeviceSelectorRow,
  DeviceSelectorsContainer,
  DropdownItem,
  DropdownList,
  JoinButton,
  JoiningContainer,
  JoiningLogo,
  JoiningLogoImage,
  JoiningSpinner,
  JoiningText,
  LogoContainer,
  LogoImage,
  OnboardingContainer,
  OnboardingModal,
  ParticipantLabel,
  SelectorButton,
  SelectorLabel,
  StyledTextField,
  Title
}
