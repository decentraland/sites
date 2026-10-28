/* eslint-disable @typescript-eslint/naming-convention */
import { VideoTrack } from '@livekit/components-react'
import { styled } from 'decentraland-ui2'

const HandleLayer = styled('div')({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 3
})

const HandleCircle = styled('button', {
  shouldForwardProp: prop => typeof prop === 'string' && !prop.startsWith('$')
})<{ $dragging: boolean }>(({ theme, $dragging }) => ({
  position: 'absolute',
  padding: 0,
  borderRadius: '50%',
  border: `2px dashed ${theme.palette.common.white}`,
  background: 'transparent',
  pointerEvents: 'auto',
  cursor: $dragging ? 'grabbing' : 'grab',
  touchAction: 'none',
  '&:hover': {
    outline: `2px solid ${theme.palette.primary.main}`
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  },
  '&:active': {
    borderStyle: 'solid'
  }
}))

const HandlePreview = styled('div')({
  position: 'absolute',
  inset: 0,
  borderRadius: '50%',
  overflow: 'hidden',
  pointerEvents: 'none'
})

const HandlePreviewVideo = styled(VideoTrack)({
  '&&&': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)',
    borderRadius: 0
  }
})

export { HandleCircle, HandleLayer, HandlePreview, HandlePreviewVideo }
