import { memo } from 'react'
import { AssetImage, AssetTile, AssetTileGrid } from './FeaturedAssetThumbnail.styled'
import type { ThumbnailSize } from './FeaturedAssetThumbnail.styled'

interface FeaturedAssetThumbnailProps {
  thumbnails: string[]
  size?: ThumbnailSize
}

/**
 * The plate a featured asset is previewed on. An item shows its single render; a collection tiles
 * up to four of its items' renders in a 2x2 grid. A collection that yielded only one render falls
 * back to the single-render layout — a lone tile in one corner reads as a broken image.
 */
function FeaturedAssetThumbnailComponent({ thumbnails, size = 'large' }: FeaturedAssetThumbnailProps) {
  const isTiled = thumbnails.length > 1

  return (
    <AssetTile $size={size}>
      {isTiled ? (
        <AssetTileGrid $size={size}>
          {thumbnails.map(thumbnail => (
            <AssetImage key={thumbnail} $size={size} $tiled src={thumbnail} alt="" loading="lazy" />
          ))}
        </AssetTileGrid>
      ) : (
        thumbnails[0] && <AssetImage $size={size} $tiled={false} src={thumbnails[0]} alt="" loading="lazy" />
      )}
    </AssetTile>
  )
}

const FeaturedAssetThumbnail = memo(FeaturedAssetThumbnailComponent)

export { FeaturedAssetThumbnail }
export type { FeaturedAssetThumbnailProps }
