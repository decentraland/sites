import { Box, Typography, styled } from 'decentraland-ui2'

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

const DiscordButton = styled('a')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
  fontWeight: 600,
  padding: `${theme.spacing(1.5)} ${theme.spacing(4)}`,
  borderRadius: 8,
  textTransform: 'none',
  textDecoration: 'none',
  color: theme.palette.primary.contrastText,
  backgroundColor: theme.palette.primary.main,
  cursor: 'pointer',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    backgroundColor: theme.palette.primary.dark
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&[data-loading]': {
    opacity: 0.6,
    pointerEvents: 'none'
  }
}))

const DiscordError = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  color: theme.palette.error.main,
  marginBottom: theme.spacing(2)
}))

export { DiscordButton, DiscordDescription, DiscordError, DiscordPageContainer, DiscordTitle }
