import { memo, useCallback } from 'react'
import type { SyntheticEvent } from 'react'
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

  // A dead thumbnail URL would otherwise paint the browser's broken-image glyph on the light plate;
  // an empty plate reads as "no render" instead of "something is broken".
  const hideBrokenImage = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.visibility = 'hidden'
  }, [])

  return (
    <AssetTile $size={size}>
      {isTiled ? (
        <AssetTileGrid $size={size}>
          {/* Two items in a collection can legitimately share a render, so the URL alone is not unique. */}
          {thumbnails.map((thumbnail, index) => (
            <AssetImage key={`${thumbnail}-${index}`} $size={size} $tiled src={thumbnail} alt="" loading="lazy" onError={hideBrokenImage} />
          ))}
        </AssetTileGrid>
      ) : (
        thumbnails[0] && <AssetImage $size={size} $tiled={false} src={thumbnails[0]} alt="" loading="lazy" onError={hideBrokenImage} />
      )}
    </AssetTile>
  )
}

const FeaturedAssetThumbnail = memo(FeaturedAssetThumbnailComponent)

export { FeaturedAssetThumbnail }
export type { FeaturedAssetThumbnailProps }
