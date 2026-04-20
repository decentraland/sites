// eslint-disable-next-line @typescript-eslint/naming-convention
import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded'
import { Box, IconButton, Typography, styled } from 'decentraland-ui2'

const LiveNowSection = styled('section')(({ theme }) => ({
  position: 'relative',
  zIndex: 10,
  marginTop: theme.spacing(4),
  padding: theme.spacing(4, 3),
  background: 'radial-gradient(63.39% 112.69% at 49.33% 50.11%, #A042CD 0%, #32134C 100%)',
  borderRadius: theme.spacing(2),
  boxShadow: '0px 4px 25px 0px rgba(255, 255, 255, 0.25)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 2),
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    background: 'radial-gradient(63.39% 112.69% at 49.33% 50.11%, #A042CD 0%, #32134C 100%)',
    borderRadius: 0,
    boxShadow: 'none'
  }
}))

const LiveNowHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 24,
  [theme.breakpoints.down('sm')]: {
    justifyContent: 'center',
    padding: theme.spacing(0, 2)
  }
}))

const LiveNowTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: 32,
  [theme.breakpoints.down('sm')]: {
    fontSize: 24,
    textAlign: 'center',
    width: '100%'
  }
}))

const JUMP_IN_HEIGHT = 62
const FADE_WIDTH = 60

/* eslint-disable @typescript-eslint/naming-convention */
const CarouselWrapper = styled(Box, {
  shouldForwardProp: prop => prop !== 'fadeLeft' && prop !== 'fadeRight' && prop !== 'hasScroll'
})<{ fadeLeft?: boolean; fadeRight?: boolean; hasScroll?: boolean }>(({ theme, fadeLeft, fadeRight, hasScroll }) => {
  const masks: string[] = []
  if (fadeLeft) {
    masks.push(`linear-gradient(to right, transparent, black ${FADE_WIDTH}px)`)
  }
  if (fadeRight) {
    masks.push(`linear-gradient(to left, transparent, black ${FADE_WIDTH}px)`)
  }

  return {
    position: 'relative',
    ...(hasScroll
      ? {
          overflowX: 'auto',
          padding: '24px 16px 16px',
          margin: '-24px -16px -16px',
          scrollSnapType: 'x mandatory',
          scrollPaddingInline: 16,
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      : {
          overflow: 'visible'
        }),
    ...(masks.length > 0 && {
      maskImage: masks.join(', '),
      WebkitMaskImage: masks.join(', ')
    }),
    ...(masks.length > 1 && {
      maskComposite: 'intersect',
      WebkitMaskComposite: 'source-in'
    }),
    [theme.breakpoints.down('sm')]: {
      maskImage: 'none',
      WebkitMaskImage: 'none'
    }
  }
})
/* eslint-enable @typescript-eslint/naming-convention */

const ChevronButton = styled(IconButton)<{ side: 'left' | 'right' }>(({ theme, side }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  [side]: theme.spacing(1),
  zIndex: 2,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: theme.palette.common.white,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

/* eslint-disable @typescript-eslint/naming-convention */
const LiveNowGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  justifyContent: 'safe center',
  alignItems: 'stretch',
  '&::after': {
    content: '""',
    flexShrink: 0,
    width: 1
  },
  '& .MuiCard-root': {
    minWidth: 'max(300px, calc((100% - 48px) / 4))',
    maxWidth: 850,
    flex: '1 1 0',
    containerType: 'inline-size',
    scrollSnapAlign: 'start',
    overflow: 'hidden'
  },
  '& .MuiCardActionArea-root': {
    height: '100%'
  },
  '&& .MuiCardMedia-root': {
    height: 'min(62.5cqw, 297px)'
  },
  '&& .MuiCardActionArea-root:hover .MuiCardMedia-root': {
    height: 'min(62.5cqw, 297px)'
  },
  '&& .MuiCardActionArea-root:hover .MuiCardContent-root > div:first-of-type > div:last-child': {
    marginBottom: 0
  },
  '& .MuiCardContent-root .MuiTypography-h6': {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    WebkitLineClamp: 'unset',
    WebkitBoxOrient: 'unset'
  },
  '& .MuiCardContent-root .MuiBox-root .MuiBox-root:has(.MuiAvatar-root)': {
    maxWidth: '100%'
  },
  [theme.breakpoints.down('sm')]: {
    '& .MuiCard-root': {
      minWidth: 'unset',
      maxWidth: 'unset',
      maxHeight: 'none',
      flex: '0 0 100%'
    },
    '&& .MuiCardMedia-root': {
      height: `calc(62.5cqw - ${JUMP_IN_HEIGHT}px)`
    },
    '&& .MuiCardActionArea-root:hover .MuiCardMedia-root': {
      height: `calc(62.5cqw - ${JUMP_IN_HEIGHT}px)`
    },
    '&& .MuiCardActionArea-root:hover .MuiCardContent-root > div:first-of-type > div:last-child': {
      marginBottom: 0
    },
    '&& .MuiCardContent-root > .MuiBox-root:last-child': {
      display: 'flex',
      opacity: 1,
      transform: 'translateY(0)'
    }
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

const LiveNowIcon = styled(SensorsRoundedIcon)(({ theme }) => ({
  color: '#E00000',
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

const ChevronLayer = styled(Box)({
  position: 'relative'
})

export { CarouselWrapper, ChevronButton, ChevronLayer, LiveNowGrid, LiveNowHeader, LiveNowIcon, LiveNowSection, LiveNowTitle }
