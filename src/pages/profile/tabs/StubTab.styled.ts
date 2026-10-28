import { Box, Typography, styled } from 'decentraland-ui2'

const StubRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(6, 2),
  minHeight: 360,
  textAlign: 'center',
  color: theme.palette.text.secondary
}))

const StubTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 500
}))

export { StubRoot, StubTitle }
