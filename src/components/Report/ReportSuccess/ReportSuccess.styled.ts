import { Box, Logo, Typography, styled } from 'decentraland-ui2'

const SuccessBackground = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: `calc(64px + ${theme.spacing(4)})`,
  paddingBottom: theme.spacing(8),
  paddingLeft: theme.spacing(4),
  paddingRight: theme.spacing(4),
  [theme.breakpoints.up('md')]: {
    paddingTop: `calc(96px + ${theme.spacing(4)})`,
    paddingBottom: theme.spacing(12)
  }
}))

const SuccessContent = styled(Box)({
  position: 'relative',
  zIndex: 1,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
})

const SuccessCard = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(22, 7, 35, 0.92)',
  borderRadius: Number(theme.shape.borderRadius) * 2,
  padding: theme.spacing(7, 4),
  maxWidth: 608,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(7, 9)
  }
}))

const SuccessLogoWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2)
}))

const SuccessLogo = styled(Logo)({
  height: 64,
  width: 64
})

const SuccessTitle = styled(Typography)({
  fontWeight: 600,
  textAlign: 'center'
})

const SuccessTextGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  textAlign: 'center'
}))

const SuccessSecondary = styled(Typography)(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.palette.text.secondary
}))

export { SuccessBackground, SuccessCard, SuccessContent, SuccessLogo, SuccessLogoWrapper, SuccessSecondary, SuccessTextGroup, SuccessTitle }
