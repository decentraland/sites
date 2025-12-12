import { Box, Button, Typography, dclColors, styled } from 'decentraland-ui2'

const DownloadDetail = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  border: 'none',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    alignItems: 'center',
    marginTop: theme.spacing(6)
  }
}))

const DownloadImageContainer = styled(Box)(({ theme }) => ({
  maxWidth: '900px',
  width: '50%',
  height: '100%',
  overflow: 'hidden',
  borderRadius: theme.spacing(3),
  border: 'none',
  [theme.breakpoints.down('md')]: {
    width: '100%'
  }
}))

const DownloadImage = styled('img', {
  shouldForwardProp: prop => prop !== 'objectFit'
})<{ objectFit?: 'cover' | 'contain' }>(props => ({
  width: '100%',
  height: '100%',
  objectFit: props.objectFit || 'cover'
}))

const DownloadTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    textAlign: 'center',
    fontSize: '3rem'
  },
  [theme.breakpoints.down('xs')]: {
    fontSize: '1.8rem'
  }
}))

const DecentralandText = styled('span')({
  fontFamily: 'DecentralandHero',
  background: `linear-gradient(261.51deg, ${dclColors.brand.ruby} 6.92%, ${dclColors.brand.yellow} 83.3%)`,
  backgroundClip: 'text',
  webkitBackgroundClip: 'text',
  webkitTextFillColor: 'transparent',
  color: 'transparent',
  fontSize: 'inherit',
  fontWeight: 'inherit',
  lineHeight: 'inherit',
  letterSpacing: 'inherit'
})

const DownloadSubtitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
  color: theme.palette.text.secondary,
  ['& span']: {
    fontWeight: 700
  },
  [theme.breakpoints.down('sm')]: {
    textAlign: 'center'
  }
}))

const DownloadUnavailable = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  width: '460px',
  [theme.breakpoints.down('xl')]: {
    width: '390px'
  },
  [theme.breakpoints.down('lg')]: {
    width: '320px'
  }
}))

const DownloadUnavailableIFrame = styled('iframe')({
  width: '100%',
  border: 'none'
})

const DownloadActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  marginTop: theme.spacing(7.5)
}))

const DownloadButtonsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(2),
  ['@media (max-width: 1830px)']: {
    flexDirection: 'column',
    alignItems: 'flex-start'
  }
}))

const DownloadButtonImage = styled('img')({
  height: '32px',
  width: '32px',
  filter: 'brightness(0) invert(1)'
})

const DownloadAlternativeContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  marginTop: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    justifyContent: 'center'
  }
}))

const DownloadCounts = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  borderRight: '0.5px solid',
  marginTop: `${theme.spacing(1)} !important`,
  paddingRight: theme.spacing(2),
  marginRight: theme.spacing(2),
  ['& svg']: {
    ['& path']: {
      fill: theme.palette.common.white
    },
    ['& path:nth-of-type(3)']: {
      fill: theme.palette.common.black
    }
  }
}))

const DownloadAlternativeTitle = styled(Typography)(({ theme }) => ({
  ['&.MuiTypography-root.MuiTypography-body1']: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1)
  }
}))

const DownloadAlternativeButtonsWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(1.25)
}))

const DownloadAlternativeButton = styled(Button)({
  display: 'flex',
  alignItems: 'center',
  ['& span.MuiButton-icon.MuiButton-startIcon.MuiButton-iconSizeMedium']: {
    marginRight: 0,
    marginLeft: 0
  },
  ['&.MuiButtonBase-root.MuiButton-root.MuiButton-sizeMedium']: {
    gap: '4px',
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: '150%',
    letterSpacing: '0px',
    textTransform: 'capitalize'
  }
})

const DownloadAlternativeButtonImage = styled('img')({
  height: '24px',
  width: '24px',
  filter: 'brightness(0) invert(1)'
})

export {
  DecentralandText,
  DownloadActions,
  DownloadAlternativeButton,
  DownloadAlternativeButtonImage,
  DownloadAlternativeButtonsWrapper,
  DownloadAlternativeContainer,
  DownloadAlternativeTitle,
  DownloadButtonImage,
  DownloadButtonsContainer,
  DownloadCounts,
  DownloadDetail,
  DownloadImage,
  DownloadImageContainer,
  DownloadSubtitle,
  DownloadTitle,
  DownloadUnavailable,
  DownloadUnavailableIFrame
}
