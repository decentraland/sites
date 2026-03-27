import { keyframes } from '@emotion/react'
import { Box, styled } from 'decentraland-ui2'

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  color: theme.palette.common.white
}))

const SuspenseFallback = styled(Box)({
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #39055C 0%, #1a0230 100%)'
})

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const BelowFoldContent = styled(Box)({
  animation: `${fadeIn} 400ms ease-out`
})

export { BelowFoldContent, LoadingContainer, SuspenseFallback }
