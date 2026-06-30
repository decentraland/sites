import { Box, Link, Typography, styled } from 'decentraland-ui2'

// "Buy MANA" modal, faithful to the standalone account dapp: a subtitle, then one section per network
// (Ethereum MANA / Polygon MANA) each with a description and one gateway card per provider.
const Subtitle = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  color: '#CFCDD4',
  marginBottom: theme.spacing(1)
}))

const NetworkSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  ['& + &']: {
    marginTop: theme.spacing(2)
  }
}))

const NetworkLabel = styled(Typography)(() => ({
  fontSize: 15,
  fontWeight: 700,
  color: '#FCFCFC'
}))

const NetworkDescription = styled(Typography)(({ theme }) => ({
  fontSize: 13,
  color: '#A09BA8',
  marginBottom: theme.spacing(0.5)
}))

const GatewayCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: theme.spacing(1.5)
}))

// Gateway brand banner, faithful to the standalone account dapp's Buy modal (decentraland-ui's
// Network card renders the provider logo centred on a white banner above the title).
const GatewayLogo = styled('img')(({ theme }) => ({
  width: '100%',
  height: 120,
  objectFit: 'contain',
  background: '#FFFFFF',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1)
}))

// The Transak session widget rendered in-modal (the account dapp's Transak SDK does the same: it embeds
// the hosted widget URL in an iframe rather than opening a new tab).
const TransakFrame = styled('iframe')(({ theme }) => ({
  width: '100%',
  height: 600,
  maxHeight: '70vh',
  border: 'none',
  borderRadius: theme.spacing(1),
  background: '#FFFFFF'
}))

const GatewayTitle = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 700,
  color: '#FCFCFC'
}))

const GatewaySubtitle = styled(Typography)(() => ({
  fontSize: 13,
  color: '#A09BA8'
}))

const LearnMore = styled(Link)(() => ({
  fontSize: 12,
  color: '#FF2D55',
  textDecoration: 'underline',
  alignSelf: 'flex-start',
  ['&:hover']: {
    opacity: 0.85
  }
}))

export {
  GatewayCard,
  GatewayLogo,
  GatewaySubtitle,
  GatewayTitle,
  LearnMore,
  NetworkDescription,
  NetworkLabel,
  NetworkSection,
  Subtitle,
  TransakFrame
}
