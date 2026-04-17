import { Box, styled } from 'decentraland-ui2'

const FallbackContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh'
})

const PlaceholderContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh'
})

export { FallbackContainer, PlaceholderContainer }
