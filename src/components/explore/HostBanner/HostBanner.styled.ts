// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import { Box, Typography, styled } from 'decentraland-ui2'

const BannerSection = styled('section')(({ theme }) => ({
  position: 'relative',
  zIndex: 8,
  overflow: 'hidden',
  borderRadius: theme.spacing(2),
  background: 'radial-gradient(63.39% 112.69% at 49.33% 50.11%, #6B2A8A 0%, #1E0A2E 100%)',
  display: 'flex',
  alignItems: 'center',
  minHeight: 240,
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    minHeight: 'auto'
  }
}))

const AvatarImage = styled('img')(({ theme }) => ({
  width: 200,
  height: '100%',
  objectFit: 'contain',
  objectPosition: 'bottom left',
  flexShrink: 0,
  alignSelf: 'flex-end',
  [theme.breakpoints.down('lg')]: {
    width: 160
  },
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}))

const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: theme.spacing(4, 3),
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 2)
  }
}))

const BannerTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 600,
  lineHeight: 1.334,
  color: theme.palette.text.primary
}))

const BannerSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
  color: theme.palette.text.secondary
}))

const ChecklistItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const CheckIcon = styled(CheckBoxIcon)(({ theme }) => ({
  fontSize: 20,
  color: theme.palette.primary.main
}))

const CheckText = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 400,
  color: theme.palette.text.primary
}))

const ButtonRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch'
  }
}))

const CreateButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(0.5),
  background: theme.palette.primary.main,
  border: 'none',
  borderRadius: 6,
  color: theme.palette.common.white,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontSize: '0.875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  padding: '6px 16px',
  cursor: 'pointer',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    background: theme.palette.primary.dark
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.text.primary}`,
    outlineOffset: 2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const LearnMoreButton = styled('button')(({ theme }) => ({
  background: 'transparent',
  border: '1px solid rgba(255, 255, 255, 0.23)',
  borderRadius: 6,
  color: theme.palette.text.primary,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontSize: '0.875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  padding: '6px 16px',
  cursor: 'pointer',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    background: theme.palette.action.hover
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.text.primary}`,
    outlineOffset: 2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const SceneImage = styled('img')(({ theme }) => ({
  width: 420,
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center',
  flexShrink: 0,
  borderRadius: `0 ${theme.spacing(2)} ${theme.spacing(2)} 0`,
  [theme.breakpoints.down('lg')]: {
    width: 320
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
    height: 200,
    borderRadius: `0 0 ${theme.spacing(2)} ${theme.spacing(2)}`
  }
}))

export {
  AvatarImage,
  BannerSection,
  BannerSubtitle,
  BannerTitle,
  ButtonRow,
  CheckIcon,
  CheckText,
  ChecklistItem,
  ContentArea,
  CreateButton,
  LearnMoreButton,
  SceneImage
}
