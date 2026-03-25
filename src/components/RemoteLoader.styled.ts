import { Box, styled } from 'decentraland-ui2'

const ErrorContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(10, 0)
}))

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(10, 0)
}))

export { ErrorContainer, LoadingContainer }
