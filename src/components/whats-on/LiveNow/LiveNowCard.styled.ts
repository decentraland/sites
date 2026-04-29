import { Box, Card, CardActionArea, CardContent, Typography, styled } from 'decentraland-ui2'

const JUMP_IN_BUTTON_HEIGHT = 46

const CardRoot = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxSizing: 'border-box',
  minWidth: 400,
  maxWidth: 850,
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  height: '100%',
  backgroundColor: 'transparent',
  position: 'relative',
  overflow: 'hidden',
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.complex
  }),
  [theme.breakpoints.up('sm')]: {
    ['&:hover']: {
      transform: 'translateY(-4px)',
      boxShadow: '0px 2px 12px 12px rgba(255, 255, 255, 0.3)'
    }
  }
}))

const LiveNowActionArea = styled(CardActionArea)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  backgroundColor: 'transparent'
}))

const MediaBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  backgroundColor: theme.palette.mode === 'dark' ? '#2a2435' : '#e8e8e8',
  borderRadius: `${theme.spacing(2)} ${theme.spacing(2)} 0 0`
}))

const MediaImage = styled('img')<{ fetchpriority?: 'high' | 'low' | 'auto' }>(({ theme }) => ({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: `${theme.spacing(2)} ${theme.spacing(2)} 0 0`,
  userSelect: 'none',
  pointerEvents: 'none'
}))

const BadgesOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  left: theme.spacing(2),
  right: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
  zIndex: 2,
  pointerEvents: 'none',
  ['& > *']: {
    pointerEvents: 'auto'
  }
}))

const CardBody = styled(CardContent)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)',
  borderRadius: `0 0 ${theme.spacing(2)} ${theme.spacing(2)}`,
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  padding: theme.spacing(2),
  minHeight: 123,
  ['&:last-child']: {
    paddingBottom: theme.spacing(2)
  },
  [theme.breakpoints.down('sm')]: {
    minHeight: 149
  }
}))

const SceneInfo = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  width: '100%'
})

const SceneTitle = styled(Typography)({
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 600
})

const AvatarRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
  marginTop: 'auto',
  minWidth: 0,
  maxWidth: '100%',
  overflow: 'hidden',
  [theme.breakpoints.up('sm')]: {
    transition: theme.transitions.create('margin-bottom', {
      duration: theme.transitions.duration.complex
    }),
    ['.MuiCardActionArea-root:hover &']: {
      marginBottom: `calc(${JUMP_IN_BUTTON_HEIGHT}px + ${theme.spacing(2)})`
    }
  }
}))

const AvatarTextContainer = styled(Box)({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  ['& .MuiTypography-root']: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
})

const AVATAR_SIZE = 32

const AvatarImage = styled('img', { shouldForwardProp: prop => prop !== 'fallbackColor' })<{ fallbackColor: string }>(
  ({ theme, fallbackColor }) => ({
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: '50%',
    border: `1.4px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)'}`,
    flexShrink: 0,
    objectFit: 'cover',
    backgroundColor: fallbackColor
  })
)

const AvatarFallback = styled(Box, { shouldForwardProp: prop => prop !== 'fallbackColor' })<{ fallbackColor: string }>(
  ({ theme, fallbackColor }) => ({
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: '50%',
    backgroundColor: fallbackColor,
    border: `1.4px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)'}`,
    flexShrink: 0
  })
)

const JumpInButtonContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  left: theme.spacing(2),
  right: theme.spacing(2),
  opacity: 0,
  transform: `translateY(calc(100% + ${theme.spacing(2)}))`,
  transition: theme.transitions.create(['opacity', 'transform'], {
    duration: theme.transitions.duration.complex
  }),
  [theme.breakpoints.up('sm')]: {
    ['.MuiCardActionArea-root:hover &']: {
      opacity: 1,
      transform: 'translateY(0)'
    }
  },
  [theme.breakpoints.down('sm')]: {
    position: 'relative',
    opacity: 1,
    transform: 'none',
    bottom: 'auto',
    left: 'auto',
    right: 'auto',
    marginTop: theme.spacing(1)
  }
}))

const JumpInButton = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  width: '100%',
  height: JUMP_IN_BUTTON_HEIGHT,
  border: 'none',
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontSize: 16,
  fontWeight: theme.typography.fontWeightBold,
  textTransform: 'uppercase',
  cursor: 'pointer',
  ['& svg']: {
    width: 24,
    height: 24
  },
  ['&:hover']: {
    backgroundColor: theme.palette.primary.dark
  }
}))

export {
  AvatarFallback,
  AvatarImage,
  AvatarRow,
  AvatarTextContainer,
  BadgesOverlay,
  CardBody,
  CardRoot,
  JumpInButton,
  JumpInButtonContainer,
  LiveNowActionArea,
  MediaBox,
  MediaImage,
  SceneInfo,
  SceneTitle
}
