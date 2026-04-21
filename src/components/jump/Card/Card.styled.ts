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
  }
}))

const LeftSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  flexGrow: 1,
  maxWidth: 724,
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    height: '100%'
  }
}))

const RightSection = styled(Box)(({ theme }) => ({
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
})<AttendeesBadgeProps>(({ backgroundColor = '#FF2D55' }) => ({
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
  backdropFilter: 'blur(4px)'
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
  color: '#ffffff',
  lineHeight: 1.17,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: { fontSize: 40 },
  [theme.breakpoints.down('sm')]: { fontSize: 32 }
}))

const CardCreator = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 20,
  fontWeight: 500,
  color: '#FF2D55',
  marginBottom: 24
})

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
  [theme.breakpoints.down('md')]: { fontSize: 14 }
}))

const CardLocation = styled(Box)({
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
  width: 'fit-content'
})

const CardLoadingContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  backgroundColor: 'rgba(56, 10, 77, 0.6)'
})

const CreatorAvatar = styled('img')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f0f0f0',
  flexShrink: 0,
  objectFit: 'cover',
  width: 32,
  height: 32,
  overflow: 'hidden',
  borderRadius: 34,
  border: '2px solid #ffffff'
})

const UserProfileLink = styled('a')({
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
  }
})

const MetaRow = styled(Box)({
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginBottom: 48
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
  CreatorAvatar,
  CreatorLabel,
  LeftSection,
  MetaRow,
  RightSection,
  UserProfileLink
}
