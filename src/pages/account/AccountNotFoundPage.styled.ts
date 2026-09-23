import { Box, Typography, styled } from 'decentraland-ui2'

const NotFoundContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
  padding: theme.spacing(4, 0)
}))

const NotFoundTitle = styled(Typography)(() => ({
  fontWeight: 600
}))

export { NotFoundContainer, NotFoundTitle }
