// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckIcon from '@mui/icons-material/Check'
import { Box, Button, Typography, styled } from 'decentraland-ui2'

const BannerSection = styled('section')(({ theme }) => ({
  position: 'relative',
  zIndex: 8,
  overflow: 'hidden',
  borderRadius: 24,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(4),
  paddingLeft: 60,
  marginTop: 64,
  minHeight: 308,
  backgroundColor: 'rgba(0, 0, 0, 0.35)',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    gap: 0,
    paddingLeft: 0,
    minHeight: 'auto'
  }
}))

const SceneImageWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  flex: '1 1 0',
  alignSelf: 'stretch',
  minWidth: 0,
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}))

const SceneImage = styled('img')({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'right center',
  display: 'block'
})

const AvatarImage = styled('img')(({ theme }) => ({
  width: 212,
  height: 308,
  objectFit: 'contain',
  objectPosition: 'center',
  flexShrink: 0,
  alignSelf: 'center',
  [theme.breakpoints.down('lg')]: {
    width: 170,
    height: 246
  },
  [theme.breakpoints.down('md')]: {
    width: 160,
    height: 232
  }
}))

const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: theme.spacing(4),
  padding: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 2),
    gap: theme.spacing(3)
  }
}))

const BannerTitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontSize: 32,
  fontWeight: 700,
  lineHeight: 1.235,
  color: theme.palette.common.white,
  margin: 0,
  [theme.breakpoints.down('sm')]: {
    fontSize: 26
  }
}))

const BannerSubtitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontSize: 20,
  fontWeight: 500,
  lineHeight: 1.6,
  color: '#FCFCFC',
  margin: 0,
  [theme.breakpoints.down('sm')]: {
    fontSize: 18
  }
}))

const ChecklistWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5)
}))

const ChecklistItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  width: '100%'
})

const CheckBoxShape = styled(Box)(({ theme }) => ({
  width: 23.389,
  height: 23.389,
  flexShrink: 0,
  borderRadius: 5.411,
  backgroundColor: '#3C1C4B',
  border: `1.082px solid ${theme.palette.primary.main}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}))

const CheckBoxIcon = styled(CheckIcon)({
  fontSize: 18,
  color: '#FFFFFF'
})

const CheckText = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontSize: 20,
  fontWeight: 500,
  lineHeight: 1.6,
  color: '#FCFCFC',
  margin: 0,
  [theme.breakpoints.down('sm')]: {
    fontSize: 16
  }
}))

const ButtonRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: theme.spacing(1.5),
    width: '100%'
  }
}))

const CreateButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1, 2.75),
  fontSize: 15,
  fontWeight: 600,
  lineHeight: '24px',
  letterSpacing: '0.46px',
  textTransform: 'uppercase',
  borderRadius: 6,
  boxShadow: 'none',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': { boxShadow: 'none' }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const LearnMoreButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1, 2.75),
  fontSize: 15,
  fontWeight: 600,
  lineHeight: '24px',
  letterSpacing: '0.46px',
  textTransform: 'uppercase',
  borderRadius: 6,
  boxShadow: 'none',
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  '&:hover': { boxShadow: 'none' }
}))

export {
  AvatarImage,
  BannerSection,
  BannerSubtitle,
  BannerTitle,
  ButtonRow,
  CheckBoxIcon,
  CheckBoxShape,
  CheckText,
  ChecklistItem,
  ChecklistWrapper,
  ContentArea,
  CreateButton,
  LearnMoreButton,
  SceneImage,
  SceneImageWrapper
}
