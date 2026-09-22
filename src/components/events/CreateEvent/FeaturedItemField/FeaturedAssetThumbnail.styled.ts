import { Box, styled } from 'decentraland-ui2'

type ThumbnailSize = 'large' | 'small'

/**
 * Figma renders the tile at 52px with a 43px item render inside, and tiles a collection as a 2x2
 * grid of 25px renders. The `small` scale keeps the same proportions for the picker's input
 * adornment, which has to fit inside a 56px-tall field.
 */
const THUMBNAIL_SCALE: Record<ThumbnailSize, { tile: number; radius: number; single: number; tiled: number }> = {
  large: { tile: 52, radius: 8, single: 43, tiled: 25 },
  small: { tile: 32, radius: 5, single: 26, tiled: 15 }
}

const AssetTile = styled(Box, { shouldForwardProp: prop => prop !== '$size' })<{ $size: ThumbnailSize }>(({ $size }) => ({
  width: THUMBNAIL_SCALE[$size].tile,
  height: THUMBNAIL_SCALE[$size].tile,
  flexShrink: 0,
  borderRadius: THUMBNAIL_SCALE[$size].radius,
  // neutrals/gray-5 — the light plate every marketplace render sits on.
  backgroundColor: '#ecebed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
}))

const AssetTileGrid = styled(Box, { shouldForwardProp: prop => prop !== '$size' })<{ $size: ThumbnailSize }>(({ $size }) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(2, ${THUMBNAIL_SCALE[$size].tiled}px)`,
  gridAutoRows: THUMBNAIL_SCALE[$size].tiled
}))

const AssetImage = styled('img', { shouldForwardProp: prop => prop !== '$size' && prop !== '$tiled' })<{
  $size: ThumbnailSize
  $tiled: boolean
}>(({ $size, $tiled }) => ({
  width: $tiled ? THUMBNAIL_SCALE[$size].tiled : THUMBNAIL_SCALE[$size].single,
  height: $tiled ? THUMBNAIL_SCALE[$size].tiled : THUMBNAIL_SCALE[$size].single,
  objectFit: 'contain',
  filter: $tiled ? 'drop-shadow(0.123px 0.493px 0.616px rgba(0, 0, 0, 0.1))' : 'drop-shadow(0.212px 0.848px 1.06px rgba(0, 0, 0, 0.1))'
}))

export { AssetImage, AssetTile, AssetTileGrid, THUMBNAIL_SCALE }
export type { ThumbnailSize }
