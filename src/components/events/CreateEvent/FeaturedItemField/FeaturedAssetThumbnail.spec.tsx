import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { FeaturedAssetThumbnail } from './FeaturedAssetThumbnail'

// The real styled engine strips `$`-prefixed props; the shared passthrough mock does not, so the
// local stubs drop them here and `FeaturedAssetThumbnail.styled.spec.tsx` covers the style file.
jest.mock('./FeaturedAssetThumbnail.styled', () => ({
  AssetTile: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'asset-tile' }, children),
  AssetTileGrid: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'asset-grid' }, children),
  AssetImage: ({ src, alt, onError }: { src: string; alt: string; onError?: React.ReactEventHandler<HTMLImageElement> }) =>
    React.createElement('img', { src, alt, onError })
}))

describe('FeaturedAssetThumbnail', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the asset has a single render', () => {
    it('should show it once, outside the tiled grid', () => {
      render(<FeaturedAssetThumbnail thumbnails={['https://peer.test/a.png']} />)

      expect(screen.getAllByRole('presentation')).toHaveLength(1)
      expect(screen.getByRole('presentation')).toHaveAttribute('src', 'https://peer.test/a.png')
      expect(screen.queryByTestId('asset-grid')).not.toBeInTheDocument()
    })
  })

  describe('when the asset has several renders', () => {
    it('should tile every one of them', () => {
      render(<FeaturedAssetThumbnail thumbnails={['a.png', 'b.png', 'c.png', 'd.png']} />)

      expect(screen.getByTestId('asset-grid')).toBeInTheDocument()
      expect(screen.getAllByRole('presentation')).toHaveLength(4)
    })
  })

  describe('when the asset has no render at all', () => {
    it('should render the empty plate without an image', () => {
      render(<FeaturedAssetThumbnail thumbnails={[]} />)

      expect(screen.getByTestId('asset-tile')).toBeInTheDocument()
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument()
    })
  })

  describe('when a thumbnail fails to load', () => {
    it('should hide the image so the broken-image glyph never lands on the plate', () => {
      render(<FeaturedAssetThumbnail thumbnails={['gone.png']} />)
      const image = screen.getByRole('presentation')

      fireEvent.error(image)

      expect(image).toHaveStyle({ visibility: 'hidden' })
    })
  })

  describe('when rendered at the small scale', () => {
    it('should still render the asset', () => {
      render(<FeaturedAssetThumbnail thumbnails={['a.png']} size="small" />)

      expect(screen.getByRole('presentation')).toHaveAttribute('src', 'a.png')
    })
  })
})
