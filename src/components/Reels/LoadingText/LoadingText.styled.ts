import { keyframes } from '@emotion/react'
import { Box, styled } from 'decentraland-ui2'

const loadingShimmer = keyframes`
  to { background-position-x: -200%; }
`

type LoadingSize = 'small' | 'medium' | 'large' | 'full'
type LoadingType = 'span' | 'h1' | 'h2' | 'h3' | 'p'

const widthBySize: Record<LoadingSize, string> = {
  small: '20%',
  medium: '45%',
  large: '75%',
  full: '100%'
}

const heightByType: Record<LoadingType, string> = {
  span: '15px',
  h1: '2em',
  h2: '1.71em',
  h3: '1.29em',
  p: '1em'
}

interface LoadingBoxProps {
  size: LoadingSize
  type: LoadingType
}

const LoadingBox = styled(Box, {
  shouldForwardProp: prop => prop !== 'size' && prop !== 'type'
})<LoadingBoxProps>(({ size, type }) => ({
  width: widthBySize[size],
  height: heightByType[type],
  background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 100%)',
  backgroundSize: '200% 100%',
  animation: `${loadingShimmer} 1.5s linear infinite`,
  borderRadius: 8,
  marginBottom: 10
}))

export { LoadingBox }
export type { LoadingSize, LoadingType }
