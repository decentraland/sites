import { Box, Tab, Tabs, Typography, dclColors, styled } from 'decentraland-ui2'

const CreatorsCreateCardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  background: dclColors.neutral.softBlack2,
  borderRadius: '24px',
  width: '1200px',
  padding: theme.spacing(4),
  alignItems: 'center',
  [theme.breakpoints.down('xl')]: {
    width: '1000px',
    minHeight: '550px'
  },
  [theme.breakpoints.down('lg')]: {
    width: '1000px'
  },
  [theme.breakpoints.down('md')]: {
    width: '700px',
    minHeight: '700px'
  },
  [theme.breakpoints.down('xs')]: {
    flexDirection: 'column',
    height: 'auto',
    width: '100%',
    padding: 0
  }
}))

const CreatorsCreateCardImageContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'backgroundUrl'
})<{ backgroundUrl?: string }>(({ theme, backgroundUrl }) => ({
  height: '100%',
  flexShrink: 0,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
  marginRight: theme.spacing(4),
  width: '35%',
  borderRadius: '24px',
  transition: 'transform 0.3s ease-in-out',
  minHeight: '530px',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  ['& img']: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  ['&:hover']: {
    transform: 'scale(1.05)'
  },
  [theme.breakpoints.down('xl')]: {
    minHeight: '550px'
  },
  [theme.breakpoints.down('md')]: {
    minHeight: '700px'
  },
  [theme.breakpoints.down('xs')]: {
    height: '223px',
    minHeight: '223px',
    width: '100%',
    backgroundSize: '100%',
    borderRadius: '24px 24px 0 0',
    marginRight: 0,
    ['& img']: {
      width: 'auto',
      height: '100%',
      transform: 'translate(-50%, -50%)',
      position: 'absolute',
      left: '50%',
      top: '50%'
    }
  }
}))

const CreatorsCreateCardInfoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  width: 'calc(65% - 32px)',
  marginLeft: 'auto',
  marginRight: 0,
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(4, 0),
    margin: theme.spacing(0, 1, 1),
    width: 'calc(100% - 16px)'
  }
}))

const CreatorsCreateCardTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '20px',
  lineHeight: '16px',
  marginBottom: theme.spacing(1),
  color: dclColors.neutral.white,
  [theme.breakpoints.down('xs')]: {
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 700
  }
}))

const CreatorsCreateCardDescription = styled(Typography)(({ theme }) => ({
  fontSize: '16px',
  lineHeight: '24px',
  fontWeight: 400,
  color: dclColors.neutral.gray3,
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('xs')]: {
    textAlign: 'center'
  }
}))

const CreatorsCreateCardTabs = styled(Tabs)(({ theme }) => ({
  minHeight: '24px',
  marginBottom: theme.spacing(3),
  ['& .MuiTabs-indicator']: {
    backgroundColor: dclColors.neutral.white
  },
  ['& .MuiTabs-flexContainer']: {
    borderBottom: 'none'
  },
  [theme.breakpoints.down('xs')]: {
    justifyContent: 'center',
    ['& .MuiTabs-flexContainer']: {
      justifyContent: 'center'
    }
  }
}))

const CreatorsCreateCardTab = styled(Tab)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 500,
  textTransform: 'uppercase',
  minHeight: '24px',
  padding: theme.spacing(0, 0, 1),
  marginRight: theme.spacing(3),
  color: dclColors.neutral.gray2,
  ['&.Mui-selected']: {
    color: dclColors.neutral.white,
    fontWeight: 600
  }
}))

export {
  CreatorsCreateCardContainer,
  CreatorsCreateCardDescription,
  CreatorsCreateCardImageContainer,
  CreatorsCreateCardInfoContainer,
  CreatorsCreateCardTab,
  CreatorsCreateCardTabs,
  CreatorsCreateCardTitle
}
