import { Box, Button, Typography, styled } from 'decentraland-ui2'

const DownloadOptionsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  width: '100%'
})

const DownloadActions = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  marginTop: '60px'
})

const DownloadButtonsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: '16px',
  [theme.breakpoints.down('xl')]: {
    flexDirection: 'column',
    alignItems: 'flex-start'
  }
}))

const DownloadButtonImage = styled('img')({
  height: '32px',
  width: '32px',
  filter: 'brightness(0) invert(1)'
})

const DownloadCounts = styled(Typography)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  borderRight: '0.5px solid',
  marginTop: '8px !important',
  paddingRight: '16px',
  marginRight: '16px',
  width: 'fit-content'
})

const AlternativeContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  marginTop: '16px',
  [theme.breakpoints.down('md')]: {
    justifyContent: 'center'
  }
}))

const AlternativeButtonsWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(1.25)
}))

const AlternativeButton = styled(Button)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  minWidth: 24,
  ['& span.MuiButton-icon.MuiButton-startIcon.MuiButton-iconSizeMedium']: {
    marginRight: 0,
    marginLeft: 0
  },
  ['&.MuiButtonBase-root.MuiButton-root.MuiButton-sizeMedium']: {
    gap: theme.spacing(0.5),
    ...theme.typography.body1,
    fontWeight: 400,
    letterSpacing: '0px',
    textTransform: 'capitalize'
  }
}))

const AlternativeButtonImage = styled('img')({
  height: '24px',
  width: '24px',
  filter: 'brightness(0) invert(1)'
})

export {
  AlternativeButton,
  AlternativeButtonImage,
  AlternativeButtonsWrapper,
  AlternativeContainer,
  DownloadActions,
  DownloadButtonImage,
  DownloadButtonsContainer,
  DownloadCounts,
  DownloadOptionsContainer
}
