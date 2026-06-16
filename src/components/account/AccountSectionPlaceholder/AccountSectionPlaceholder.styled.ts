import { Box, Typography, styled } from 'decentraland-ui2'

const PlaceholderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: theme.spacing(2, 0)
}))

const PlaceholderTitle = styled(Typography)(() => ({
  fontWeight: 600
}))

export { PlaceholderContainer, PlaceholderTitle }
