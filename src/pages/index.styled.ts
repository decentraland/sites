import { Box, styled } from 'decentraland-ui2'

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  color: theme.palette.common.white
}))

const SuspenseFallback = styled(Box)(({ theme }) => ({
  minHeight: theme.spacing(12.5)
}))
export { LoadingContainer, SuspenseFallback }
