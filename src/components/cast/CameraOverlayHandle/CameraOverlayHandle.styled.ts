/* eslint-disable @typescript-eslint/naming-convention */
import { styled } from 'decentraland-ui2'

const HandleLayer = styled('div')({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 3
})

const HandleCircle = styled('button', {
  shouldForwardProp: prop => typeof prop === 'string' && !prop.startsWith('$')
})<{ $left: number; $top: number; $size: number; $dragging: boolean }>(({ theme, $left, $top, $size, $dragging }) => ({
  position: 'absolute',
  left: $left,
  top: $top,
  width: $size,
  height: $size,
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

export { HandleCircle, HandleLayer }
