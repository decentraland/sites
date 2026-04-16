import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const CatchTheVibeContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(6),
  padding: `${theme.spacing(10)} ${theme.spacing(2.5)}`,
  width: '100%',
  backgroundColor: '#570F88',
  overflow: 'hidden',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .desktop-only-ellipse': {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  [theme.breakpoints.down('sm')]: {
    padding: `${theme.spacing(6)} 0`,
    gap: theme.spacing(4)
  }
}))

const CatchTheVibeTitle = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.white,
  fontWeight: 600,
  textAlign: 'center',
  position: 'relative',
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    fontSize: 32,
    padding: `0 ${theme.spacing(3)}`
  }
}))

const CardsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(3),
  width: '100%',
  justifyContent: 'center',
  padding: `0 ${theme.spacing(2.5)}`,
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

const VideoCard = styled(Box)(({ theme }) => ({
  position: 'relative',
  flex: '1 1 0',
  minWidth: 0,
  maxWidth: 680,
  height: 450,
  borderRadius: theme.spacing(3),
  overflow: 'hidden',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.04)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover .catch-vibe-video, &.playing .catch-vibe-video': {
    opacity: 1
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover .catch-vibe-image, &.playing .catch-vibe-image': {
    opacity: 0
  },
  [theme.breakpoints.down('lg')]: {
    height: 380
  },
  [theme.breakpoints.down('md')]: {
    height: 320
  },
  [theme.breakpoints.down('sm')]: {
    margin: '0 auto'
  }
}))

const MediaContainer = styled(Box)({
  position: 'relative',
  flex: 1,
  minHeight: 0,
  borderRadius: '24px',
  overflow: 'hidden'
})

const CardImage = styled('img')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'opacity 0.4s ease',
  zIndex: 1
})

const VideoElement = styled('video')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  opacity: 0,
  transition: 'opacity 0.4s ease'
})

const VideoCardFooter = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${theme.spacing(2)} ${theme.spacing(1.5)} ${theme.spacing(2)} ${theme.spacing(2)}`,
  flexShrink: 0
}))

const UserInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const UserName = styled(Typography)({
  color: dclColors.neutral.white,
  fontWeight: 600,
  fontSize: 14,
  lineHeight: 1.57
})

const CommunityLabel = styled(Typography)({
  color: dclColors.neutral.white,
  fontWeight: 600,
  fontSize: 14,
  lineHeight: 1.57
})

const PlayBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  zIndex: 2,
  cursor: 'pointer',
  transition: 'opacity 0.3s ease',
  // Desktop: small badge at bottom-left
  [theme.breakpoints.up('sm')]: {
    top: 'auto',
    right: 'auto',
    bottom: 13,
    left: 13,
    width: 'auto',
    height: 26,
    padding: '5.5px 6px',
    borderRadius: 8,
    backgroundColor: '#161518'
  }
}))

const MuteButton = styled('button')({
  position: 'absolute',
  top: 12,
  right: 12,
  width: 32,
  height: 32,
  borderRadius: 8,
  border: 'none',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: '#FCFCFC',
  fontSize: 16,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 3,
  transition: 'background-color 0.2s ease',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  }
})

const PlayIcon = styled(Box)(({ theme }) => ({
  width: 0,
  height: 0,
  borderStyle: 'solid',
  borderColor: 'transparent transparent transparent #FCFCFC',
  flexShrink: 0,
  // Mobile: large centered play triangle
  borderWidth: '20px 0 20px 34px',
  // Desktop: small badge play triangle
  [theme.breakpoints.up('sm')]: {
    borderWidth: '5px 0 5px 8px'
  }
}))

const DurationText = styled(Typography)(({ theme }) => ({
  color: '#FCFCFC',
  fontWeight: 600,
  fontSize: 14,
  lineHeight: 'normal',
  whiteSpace: 'nowrap',
  // Hide duration in mobile overlay — only show on desktop badge
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

const PersonaImage = styled('img')(({ theme }) => ({
  position: 'absolute',
  right: -20,
  bottom: -40,
  height: '110%',
  maxHeight: 650,
  pointerEvents: 'none',
  zIndex: 0,
  [theme.breakpoints.down('lg')]: {
    right: -60,
    opacity: 0.5
  },
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}))

const MobileCarouselContainer = styled(Box)(({ theme }) => ({
  display: 'none',
  width: '100%',
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    display: 'block'
  }
}))

export {
  CardImage,
  CardsRow,
  MediaContainer,
  CatchTheVibeContainer,
  CatchTheVibeTitle,
  CommunityLabel,
  DurationText,
  MobileCarouselContainer,
  MuteButton,
  PersonaImage,
  PlayBadge,
  PlayIcon,
  UserInfo,
  UserName,
  VideoCard,
  VideoCardFooter,
  VideoElement
}
