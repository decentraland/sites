import { Box, styled } from 'decentraland-ui2'

const RenderRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  width: 500,
  maxWidth: '100%',
  height: 706.442,
  // Some avatars (wings, tall hats, oversized props) overflow the natural
  // bounding box. We allow the preview to spill into the adjacent column and
  // sit behind the info cards (their semi-opaque bg covers the overlap).
  overflow: 'visible',
  // Mobile: shrink the preview so it fits above the body content instead of
  // dominating the viewport (Figma mobile spec keeps the avatar to ~360px tall).
  [theme.breakpoints.down('md')]: {
    height: 360,
    width: '100%'
  }
}))

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
