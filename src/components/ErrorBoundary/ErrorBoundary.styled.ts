import { Box, Button, Typography, styled } from 'decentraland-ui2'

// The boundary replaces the whole routed tree, so there is no navbar to clear and
// the fallback owns the viewport.
const FallbackContainer = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(3),
  textAlign: 'center'
}))

const FallbackTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary
}))

const FallbackMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  maxWidth: 420
}))

const ReloadButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1)
}))

export { FallbackContainer, FallbackMessage, FallbackTitle, ReloadButton }
