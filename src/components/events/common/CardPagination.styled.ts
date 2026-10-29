import { Box, styled } from 'decentraland-ui2'

const DOT_SIZE = 8
const DOT_GAP = 8
// Distance between consecutive dot centers. The track is translated in multiples
// of this value to slide the window by one dot.
const DOT_SLOT = DOT_SIZE + DOT_GAP
// Width of the fade at each edge so dots appear/disappear softly at the sides.
const EDGE_FADE = 12

const PaginationViewport = styled(Box, {
  shouldForwardProp: prop => prop !== 'viewportWidth' && prop !== 'fadeStart' && prop !== 'fadeEnd'
})<{ viewportWidth: number; fadeStart: boolean; fadeEnd: boolean }>(({ theme, viewportWidth, fadeStart, fadeEnd }) => {
  // Fade only the side that still has hidden dots beyond it, so the very first
  // and very last dots are never clipped when the window sits at an end.
  const leftStop = fadeStart ? 'transparent' : 'black'
  const rightStop = fadeEnd ? 'transparent' : 'black'
  const mask = `linear-gradient(to right, ${leftStop}, black ${EDGE_FADE}px, black calc(100% - ${EDGE_FADE}px), ${rightStop})`
  return {
    display: 'flex',
    overflow: 'hidden',
    width: viewportWidth,
    marginTop: theme.spacing(2),
    marginLeft: 'auto',
    marginRight: 'auto',
    maskImage: mask,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    WebkitMaskImage: mask
  }
})

const PaginationTrack = styled(Box, {
  shouldForwardProp: prop => prop !== 'offset'
})<{ offset: number }>(({ offset }) => ({
  display: 'flex',
  flexShrink: 0,
  gap: DOT_GAP,
  transform: `translateX(${-offset}px)`,
  transition: 'transform 250ms ease'
}))

const PaginationDot = styled('button', {
  shouldForwardProp: prop => prop !== 'active'
})<{ active: boolean }>(({ theme, active }) => ({
  flex: `0 0 ${DOT_SIZE}px`,
  width: DOT_SIZE,
  height: DOT_SIZE,
  borderRadius: '50%',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  backgroundColor: active ? theme.palette.common.white : 'rgba(255, 255, 255, 0.3)',
  transition: 'background-color 250ms ease'
}))

export { DOT_GAP, DOT_SIZE, DOT_SLOT, PaginationDot, PaginationTrack, PaginationViewport }
