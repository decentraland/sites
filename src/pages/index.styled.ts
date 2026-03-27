import { keyframes } from '@emotion/react'
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

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const BelowFoldContent = styled(Box)({
  animation: `${fadeIn} 400ms ease-out`
})

export { BelowFoldContent, LoadingContainer, SuspenseFallback }
