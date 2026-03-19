import { Box, Button, Typography, dclColors, styled } from 'decentraland-ui2'

const DownloadOptionsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  alignItems: 'center'
})

const DownloadButtonsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(2)
}))

const DownloadButtonImage = styled('img')({
  height: '32px',
  width: '32px',
  filter: 'brightness(0) invert(1)'
})

const DownloadCounts = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  width: 'fit-content',
  color: dclColors.neutral.white,
  borderRight: `0.5px solid ${dclColors.neutral.white}`,
  paddingRight: theme.spacing(2),
  marginRight: theme.spacing(2),
  height: '24px'
}))

const AlternativeContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: theme.spacing(2),
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
  DownloadButtonImage,
  DownloadButtonsContainer,
  DownloadCounts,
  DownloadOptionsContainer
}
