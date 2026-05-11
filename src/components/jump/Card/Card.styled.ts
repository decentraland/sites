/* eslint-disable @typescript-eslint/naming-convention */
import { Box, styled } from 'decentraland-ui2'

const CardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: 608,
  width: '100%',
  minWidth: 1118,
  maxWidth: 1448,
  overflow: 'hidden',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  [theme.breakpoints.down('xl')]: {
    maxWidth: '100%',
    minWidth: '100%'
  },
  [theme.breakpoints.down('md')]: {
    height: 490,
    width: 'calc(100% - 64px)',
    minWidth: 'auto',
    margin: '0 32px'
  },
  [theme.breakpoints.down('xs')]: {
    flexDirection: 'column',
    height: 'auto',
    width: '100%',
    margin: 0,
    borderRadius: 0,
    paddingBottom: 25,
    background: 'linear-gradient(96.05deg, #2E013E 36.2%, #7F0D59 100.69%)',
    boxShadow: 'none'
  }
}))

const ImageSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  flexGrow: 1,
  maxWidth: 724,
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    height: '100%'
  },
  [theme.breakpoints.down('xs')]: {
    width: '100%',
    height: 250,
    flexGrow: 0,
    maxWidth: '100%'
  }
}))

const ContentSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  flexGrow: 1,
  maxWidth: 724,
  padding: '60px 60px 48px 48px',
  backgroundColor: '#380A4D',
  [theme.breakpoints.down('md')]: {
    padding: 20
  },
  [theme.breakpoints.down('sm')]: {
    padding: 16
  },
  [theme.breakpoints.down('xs')]: {
    padding: '32px 24px 0 24px',
    maxWidth: '100%',
    backgroundColor: 'transparent'
  }
}))

const CardImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center'
})

interface AttendeesBadgeProps {
  backgroundColor?: string
}

const AttendeesBadge = styled(Box, {
  shouldForwardProp: prop => prop !== 'backgroundColor'
})<AttendeesBadgeProps>(({ backgroundColor = '#FF2D55', theme }) => ({
  position: 'absolute',
  top: 16,
  left: 16,
  backgroundColor,
  color: '#161518',
  padding: '8px 16px',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  fontWeight: 700,
  backdropFilter: 'blur(4px)',
  [theme.breakpoints.down('xs')]: {
    padding: '6px 12px',
    borderRadius: 6,
    gap: 6,
    fontSize: 12
  }
}))

const CardContent = styled(Box)({
  display: 'flex',
  flexGrow: 1,
  flexDirection: 'column',
  marginBottom: 30
})

const CardTitle = styled('h2')(({ theme }) => ({
  fontSize: 48,
  fontWeight: 600,
  margin: 0,
  marginBottom: 16,
  color: '#ffffff',
  lineHeight: 1.17,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: { fontSize: 40 },
  [theme.breakpoints.down('sm')]: { fontSize: 32 },
  [theme.breakpoints.down('xs')]: { fontSize: 28, lineHeight: 1.2 }
}))

const CardCreator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 20,
  fontWeight: 500,
  color: '#FF2D55',
  marginBottom: 24,
  [theme.breakpoints.down('xs')]: {
    gap: 6,
    fontSize: 16,
    marginBottom: 16
  }
}))

const CreatorLabel = styled('span')({ color: '#ffffff' })

interface CardDateProps {
  eventHasEnded: boolean
}

const CardDate = styled(Box, {
  shouldForwardProp: prop => prop !== 'eventHasEnded'
})<CardDateProps>(({ eventHasEnded: hasEnded, theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 8px',
  gap: 8,
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.75,
  color: hasEnded ? '#fcfcfc' : '#ffffff',
  backgroundColor: hasEnded ? '#716B7C' : 'rgba(0, 0, 0, 0.4)',
  textTransform: hasEnded ? 'uppercase' : 'none',
  borderRadius: 8,
  backdropFilter: 'blur(4px)',
  width: 'fit-content',
  [theme.breakpoints.down('md')]: { fontSize: 14 },
  [theme.breakpoints.down('xs')]: { gap: 6, fontSize: 14, lineHeight: 1.5, borderRadius: 6 }
}))

const CardLocation = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 8px',
  gap: 8,
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.75,
  color: '#ffffff',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  borderRadius: 8,
  backdropFilter: 'blur(4px)',
  width: 'fit-content',
  [theme.breakpoints.down('xs')]: { gap: 6, fontSize: 14, lineHeight: 1.5, borderRadius: 6 }
}))

const CardLoadingContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  backgroundColor: 'rgba(56, 10, 77, 0.6)'
})

const CreatorAvatar = styled('img', { shouldForwardProp: prop => prop !== 'avatarBackgroundColor' })<{ avatarBackgroundColor?: string }>(
  ({ theme, avatarBackgroundColor }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: avatarBackgroundColor ?? '#f0f0f0',
    flexShrink: 0,
    objectFit: 'cover',
    width: 32,
    height: 32,
    overflow: 'hidden',
    borderRadius: 34,
    [theme.breakpoints.down('xs')]: {
      width: 24,
      height: 24,
      borderRadius: '50%'
    }
  })
)

const UserProfileLink = styled('a')(({ theme }) => ({
  color: '#FF2D55',
  textDecoration: 'none',
  fontSize: 20,
  fontWeight: 500,
  transition: 'color 0.2s ease, text-decoration 0.2s ease',
  '&:hover': {
    color: '#FF4D75',
    textDecoration: 'underline'
  },
  '&:focus-visible': {
    outline: '2px solid #FF2D55',
    outlineOffset: 2,
    borderRadius: 4
  },
  [theme.breakpoints.down('xs')]: { fontSize: 16 }
}))

const MetaRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginBottom: 48,
  [theme.breakpoints.down('xs')]: { marginBottom: 12 }
}))

const DescriptionText = styled(Box)(({ theme }) => ({
  fontSize: 20,
  color: '#ffffff',
  lineHeight: 1.6,
  [theme.breakpoints.down('xs')]: { fontSize: 16, lineHeight: 1.5 }
}))

const StickyBottomContainer = styled(Box)({
  position: 'fixed',
  bottom: -1,
  left: 0,
  right: 0,
  minHeight: 115,
  padding: '32px 24px',
  background: 'linear-gradient(100.12deg, #130119 0%, #320524 100%)',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'row',
  gap: 12,
  backdropFilter: 'blur(8px)',
  boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.2)'
})

export {
  AttendeesBadge,
  CardContainer,
  CardContent,
  CardCreator,
  CardDate,
  CardImage,
  CardLoadingContainer,
  CardLocation,
  CardTitle,
  ContentSection,
  CreatorAvatar,
  CreatorLabel,
  DescriptionText,
  ImageSection,
  MetaRow,
  StickyBottomContainer,
  UserProfileLink
}
