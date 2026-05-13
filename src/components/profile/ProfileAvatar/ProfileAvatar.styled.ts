import { Box, styled } from 'decentraland-ui2'

type ContainerProps = { $size: number; $borderColor: string; $backgroundColor: string }

const AvatarContainer = styled(Box, {
  shouldForwardProp: prop => prop !== '$size' && prop !== '$borderColor' && prop !== '$backgroundColor'
})<ContainerProps>(({ $size, $borderColor, $backgroundColor }) => ({
  position: 'relative',
  width: $size,
  height: $size,
  padding: $size * 0.05,
  borderRadius: '50%',
  border: `${$size * 0.0417}px solid ${$borderColor}`,
  backgroundColor: $backgroundColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  boxSizing: 'border-box'
}))

const AvatarImage = styled('img')({
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  objectFit: 'cover',
  display: 'block'
})

const AvatarFallback = styled(Box)({
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 600
})

type InitialProps = { $size: number }

const AvatarInitial = styled('span', {
  shouldForwardProp: prop => prop !== '$size'
})<InitialProps>(({ $size }) => ({
  fontSize: Math.round($size * 0.45),
  lineHeight: 1,
  textTransform: 'uppercase',
  fontFamily: 'Inter, sans-serif'
}))

export { AvatarContainer, AvatarFallback, AvatarImage, AvatarInitial }
