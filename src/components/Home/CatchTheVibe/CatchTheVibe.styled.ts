import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const CatchTheVibeContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(6),
  padding: `${theme.spacing(10)} ${theme.spacing(2.5)}`,
  width: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
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
  [theme.breakpoints.down('lg')]: {
    height: 380
  },
  [theme.breakpoints.down('md')]: {
    height: 320
  }
}))

const VideoElement = styled('video')({
  width: '100%',
  height: '100%',
  objectFit: 'cover'
})

const VideoCardFooter = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))'
}))

const UserInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const UserAvatar = styled('img')(({ theme }) => ({
  width: 35,
  height: 35,
  borderRadius: '50%',
  border: '2.5px solid rgba(255, 255, 255, 0.5)',
  objectFit: 'cover',
  [theme.breakpoints.down('md')]: {
    width: 28,
    height: 28
  }
}))

const UserName = styled(Typography)({
  color: dclColors.neutral.white,
  fontWeight: 600,
  fontSize: 14
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
    paddingBottom: theme.spacing(5)
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-slide': {
    height: 300,
    display: 'flex',
    justifyContent: 'center',
    padding: `0 ${theme.spacing(2)}`
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
  CardsRow,
  CatchTheVibeContainer,
  CatchTheVibeTitle,
  MobileCarouselContainer,
  PersonaImage,
  UserAvatar,
  UserInfo,
  UserName,
  VideoCard,
  VideoCardFooter,
  VideoElement
}
