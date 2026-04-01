import { Box, styled } from 'decentraland-ui2'

const ErrorContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(10, 0)
}))

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(10, 0),
  minHeight: '60vh'
}))

export { ErrorContainer, LoadingContainer }
