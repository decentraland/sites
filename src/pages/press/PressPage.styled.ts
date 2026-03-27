import { Box, Link, Typography, styled } from 'decentraland-ui2'

const PressContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  maxWidth: 724,
  textAlign: 'center',
  marginTop: theme.spacing(24),
  marginLeft: 'auto',
  marginRight: 'auto',
  marginBottom: theme.spacing(24),
  padding: `0 ${theme.spacing(5)}`,
  [theme.breakpoints.down('sm')]: {
    marginTop: theme.spacing(12),
    marginBottom: theme.spacing(12),
    maxWidth: '100%'
  }
}))

const PressDescription = styled(Typography)(({ theme }) => ({
  fontSize: 20,
  fontWeight: 400,
  marginBottom: theme.spacing(5),
  color: theme.palette.text.secondary,
  [theme.breakpoints.down('sm')]: {
    fontSize: 16
  }
}))

const PressEmailLink = styled(Link)({
  textDecoration: 'underline'
})

const PressLogoWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4)
}))

const PressTitle = styled(Typography)(({ theme }) => ({
  fontSize: 40,
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    fontSize: 32
  }
}))

export { PressContainer, PressDescription, PressEmailLink, PressLogoWrapper, PressTitle }
