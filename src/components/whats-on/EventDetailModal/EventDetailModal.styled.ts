import { keyframes } from '@emotion/react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
// eslint-disable-next-line @typescript-eslint/naming-convention
import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded'
import { Box, Dialog, Typography, styled } from 'decentraland-ui2'

const MOBILE_NAVBAR_OFFSET = 64

const StyledDialog = styled(Dialog)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    maxWidth: 880,
    width: '100%',
    maxHeight: '80vh',
    margin: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    backgroundColor: 'transparent',
    boxShadow: '0px 4px 25px 0px #FFFFFF40',
    display: 'flex',
    flexDirection: 'column',
    scrollbarWidth: 'none'
  },
  '& .MuiDialog-paper::-webkit-scrollbar': {
    display: 'none'
  },
  [theme.breakpoints.down('sm')]: {
    '& .MuiDialog-paper': {
      borderRadius: 0,
      maxWidth: '100%',
      maxHeight: `calc(100% - ${MOBILE_NAVBAR_OFFSET}px)`,
      height: `calc(100% - ${MOBILE_NAVBAR_OFFSET}px)`,
      margin: 0,
      marginTop: MOBILE_NAVBAR_OFFSET,
      backgroundColor: '#1A0A2E'
    }
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: 880,
  height: 450,
  maxWidth: '100%',
  overflow: 'hidden',
  flexShrink: 0,
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    height: 'auto'
  }
}))

const HeroImage = styled('img')(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  [theme.breakpoints.down('sm')]: {
    position: 'relative',
    aspectRatio: '16 / 9',
    height: 'auto'
  }
}))

const HeroOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(0deg, #000000 0%, rgba(0, 0, 0, 0.8) 30.02%, rgba(0, 0, 0, 0) 106.22%)',
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

const CloseButton = styled('button')(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1.5),
  right: theme.spacing(1.5),
  width: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  zIndex: 2,
  padding: 0,
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.6)'
  },
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  },
  [theme.breakpoints.down('sm')]: {
    top: theme.spacing(1),
    left: theme.spacing(1),
    right: 'auto'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const CloseIconStyled = styled(CloseIcon)({
  fontSize: 20,
  color: '#FCFCFC'
})

const HeroContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(0, 3.75, 6.25, 3.75),
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    position: 'relative',
    padding: theme.spacing(2),
    background: 'linear-gradient(180deg, #1A0A2E 0%, #32134C 100%)'
  }
}))

const CategoryLabel = styled(Typography)({
  fontSize: 14,
  fontWeight: 600,
  color: '#FCFCFC',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
})

/* eslint-disable @typescript-eslint/naming-convention */
const livePulse = keyframes({
  '0%, 100%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.3)' }
})
/* eslint-enable @typescript-eslint/naming-convention */

const LiveNowLabel = styled(Typography)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  fontSize: 14,
  fontWeight: 600,
  color: theme.palette.error.main,
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
}))

const LiveNowIconStyled = styled(SensorsRoundedIcon)({
  fontSize: 16,
  animation: `${livePulse} 1.5s ease-in-out infinite`
})

const ModalTitle = styled(Typography)({
  fontSize: 32,
  fontWeight: 600,
  lineHeight: 1.24,
  color: '#FCFCFC',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  /* eslint-disable @typescript-eslint/naming-convention */
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical'
  /* eslint-enable @typescript-eslint/naming-convention */
})

const CreatorRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const AvatarImage = styled('img')(({ theme }) => ({
  width: theme.spacing(3),
  height: theme.spacing(3),
  borderRadius: '50%',
  border: '1.5px solid rgba(255, 255, 255, 0.5)',
  flexShrink: 0,
  objectFit: 'cover'
}))

const AvatarFallback = styled(Box)(({ theme }) => ({
  width: theme.spacing(3),
  height: theme.spacing(3),
  borderRadius: '50%',
  backgroundColor: '#00B453',
  border: '1.5px solid rgba(255, 255, 255, 0.5)',
  flexShrink: 0
}))

const CreatorName = styled(Typography)({
  fontSize: 14,
  lineHeight: 1,
  color: '#FCFCFC',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

const CreatorNameHighlight = styled('span')({
  color: '#FF2D55'
})

const ActionsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const SecondaryButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  backgroundColor: 'transparent',
  color: '#FCFCFC',
  border: '1px solid #FCFCFC',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1, 2),
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:disabled': {
    opacity: 0.5,
    cursor: 'default'
  },
  '&:hover:not(:disabled)': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const CopyButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  border: '1px solid #FCFCFC',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1, 2),
  flexShrink: 0,
  cursor: 'pointer',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const CopyIconStyled = styled(ContentCopyIcon)({
  fontSize: 18,
  color: '#FCFCFC'
})

const EditButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  marginLeft: 'auto',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: '#FCFCFC',
  border: 'none',
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1.5, 2),
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.48px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const ContentSection = styled(Box)(({ theme }) => ({
  background: 'radial-gradient(47.37% 84.21% at 42.4% 26.48%, #6E31A7 0%, #32134C 100%)',
  padding: theme.spacing(3.75, 6.25),
  flex: 1,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 2)
  }
}))

const SectionLabel = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.75,
  textTransform: 'uppercase',
  color: '#A09BA8',
  marginBottom: theme.spacing(1)
}))

const DescriptionText = styled(Typography)({
  fontSize: 14,
  lineHeight: 1.6,
  color: '#FCFCFC'
})

const ContentDivider = styled(Box)(({ theme }) => ({
  height: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  margin: theme.spacing(2, 0)
}))

const ScheduleRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1.5)
}))

const ScheduleIconButton = styled('button')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: '#A09BA8',
  flexShrink: 0,
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    color: '#FCFCFC'
  },
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  },
  '& .MuiSvgIcon-root': {
    fontSize: 20
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const ScheduleText = styled(Typography)({
  fontSize: 14,
  lineHeight: 1.5,
  color: '#FCFCFC'
})

const RecurrenceText = styled(Typography)(({ theme }) => ({
  fontSize: 12,
  color: '#A09BA8',
  marginTop: theme.spacing(0.5)
}))

const AdminActionsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2)
}))

export {
  ActionsRow,
  AdminActionsRow,
  AvatarFallback,
  AvatarImage,
  CategoryLabel,
  CloseButton,
  CloseIconStyled,
  ContentDivider,
  ContentSection,
  CopyButton,
  CopyIconStyled,
  CreatorName,
  CreatorNameHighlight,
  CreatorRow,
  DescriptionText,
  EditButton,
  HeroContent,
  HeroImage,
  HeroOverlay,
  HeroSection,
  LiveNowIconStyled,
  LiveNowLabel,
  ModalTitle,
  RecurrenceText,
  ScheduleIconButton,
  ScheduleRow,
  ScheduleText,
  SecondaryButton,
  SectionLabel,
  StyledDialog
}
