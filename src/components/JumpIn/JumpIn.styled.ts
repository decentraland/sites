import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const JumpInContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  alignItems: 'center'
})

const JumpInButtonWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  ['& .MuiButton-root.MuiButton-sizeMedium.MuiButton-containedPrimary']: {
    width: '270px',
    gap: theme.spacing(2),
    ['& .MuiButton-endIcon .MuiSvgIcon-root']: {
      width: '32px',
      height: '32px'
    }
  }
}))

const AlreadyUserContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  color: dclColors.neutral.white,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5)
}))

const AlreadyUserLink = styled('a')(({ theme }) => ({
  color: dclColors.neutral.white,
  textDecoration: 'underline',
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  ['&:hover']: {
    opacity: 0.8
  }
}))

const JumpInDownloadCounts = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  width: 'fit-content',
  color: dclColors.neutral.white,
  marginTop: theme.spacing(1)
}))

export { AlreadyUserContainer, AlreadyUserLink, JumpInButtonWrapper, JumpInContainer, JumpInDownloadCounts }
