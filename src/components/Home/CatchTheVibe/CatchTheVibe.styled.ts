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
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '60%',
    height: '100%',
    backgroundImage: 'url(/ellipse_gradient.webp)',
    backgroundSize: 'cover',
    backgroundPosition: 'center left',
    backgroundRepeat: 'no-repeat',
    pointerEvents: 'none',
    zIndex: 0
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
  '&:hover .catch-vibe-video': {
    opacity: 1
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover .catch-vibe-image': {
    opacity: 0
  },
  [theme.breakpoints.down('lg')]: {
    height: 380
  },
  [theme.breakpoints.down('md')]: {
    height: 320
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

const PlayBadge = styled(Box)({
  position: 'absolute',
  bottom: 13,
  left: 13,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  height: 26,
  padding: '5.5px 6px',
  borderRadius: 8,
  backgroundColor: '#161518',
  zIndex: 2,
  transition: 'opacity 0.3s ease'
})

const PlayIcon = styled(Box)({
  width: 0,
  height: 0,
  borderStyle: 'solid',
  borderWidth: '5px 0 5px 8px',
  borderColor: 'transparent transparent transparent #FCFCFC',
  flexShrink: 0
})

const DurationText = styled(Typography)({
  color: '#FCFCFC',
  fontWeight: 600,
  fontSize: 14,
  lineHeight: 'normal',
  whiteSpace: 'nowrap'
})

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
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper': {
    paddingBottom: theme.spacing(6)
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-slide': {
    height: 300,
    padding: '0 16px',
    boxSizing: 'border-box'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-pagination': {
    bottom: '0 !important'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-pagination-bullet': {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    opacity: 1,
    width: 8,
    height: 8
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-pagination-bullet-active': {
    backgroundColor: dclColors.neutral.white
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
  PersonaImage,
  PlayBadge,
  PlayIcon,
  UserInfo,
  UserName,
  VideoCard,
  VideoCardFooter,
  VideoElement
}
