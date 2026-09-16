jest.mock('decentraland-ui2', () => jest.requireActual('../../../../__test-utils__/styledMock'))

import { render, screen } from '@testing-library/react'
import { AssetImage, AssetTile, AssetTileGrid, THUMBNAIL_SCALE } from './FeaturedAssetThumbnail.styled'

describe('FeaturedAssetThumbnail.styled', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the scale table is read', () => {
    it('should keep the Figma proportions for both sizes', () => {
      expect(THUMBNAIL_SCALE.large).toEqual({ tile: 52, radius: 8, single: 43, tiled: 25 })
      expect(THUMBNAIL_SCALE.small.tile).toBeLessThan(THUMBNAIL_SCALE.large.tile)
    })
  })

  describe('when the tile is rendered', () => {
    it('should mount the plate, the grid and the image', () => {
      render(
        <AssetTile $size="large" data-testid="tile">
          <AssetTileGrid $size="large" data-testid="grid">
            <AssetImage $size="large" $tiled src="a.png" alt="asset" />
          </AssetTileGrid>
        </AssetTile>
      )

      expect(screen.getByTestId('tile')).toBeInTheDocument()
      expect(screen.getByTestId('grid')).toBeInTheDocument()
      expect(screen.getByAltText('asset')).toHaveAttribute('src', 'a.png')
    })
  })
})
