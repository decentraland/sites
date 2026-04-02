import { Box, Button, Typography, styled } from 'decentraland-ui2'

const DiscordPageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  textAlign: 'center',
  padding: theme.spacing(2.5)
}))

const DiscordTitle = styled(Typography)(({ theme }) => ({
  fontSize: 48,
  fontWeight: 700,
  lineHeight: '56px',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    fontSize: 32,
    lineHeight: '40px'
  }
}))

const DiscordDescription = styled(Typography)(({ theme }) => ({
  fontSize: 18,
  fontWeight: 400,
  lineHeight: '28px',
  color: theme.palette.text.secondary,
  maxWidth: 500,
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    fontSize: 16,
    lineHeight: '24px'
  }
}))

const DiscordButton = styled(Button)(({ theme }) => ({
  fontSize: 16,
  fontWeight: 600,
  padding: `${theme.spacing(1.5)} ${theme.spacing(4)}`,
  borderRadius: 8,
  textTransform: 'none'
}))

export { DiscordButton, DiscordDescription, DiscordPageContainer, DiscordTitle }
