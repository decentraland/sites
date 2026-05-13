import { Box, styled } from 'decentraland-ui2'

const RenderRoot = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  width: 389,
  maxWidth: '100%',
  height: 706.442,
  overflow: 'hidden'
})

const FallbackLayer = styled(Box)({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  pointerEvents: 'none',
  padding: 0
})

const FallbackImg = styled('img')({
  width: 'auto',
  height: '100%',
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
  objectPosition: 'center bottom',
  display: 'block'
})

export { FallbackImg, FallbackLayer, RenderRoot }
