import { memo } from 'react'
import { CircularProgress, useMediaQuery } from 'decentraland-ui2'
import type { Image } from '../../../features/reels'
import { ImageActions } from '../ImageActions'
import { Logo } from '../Logo'
import { Gradient, ImageWrapper, InlineLogo, LoaderOverlay, ViewerContainer } from './ImageViewer.styled'

interface ImageViewerProps {
  image: Image
  metadataVisible: boolean
  onToggleMetadata: () => void
  loading: boolean
}

const ImageViewer = memo(({ image, metadataVisible, onToggleMetadata, loading }: ImageViewerProps) => {
  const isDesktop = useMediaQuery('(min-width: 1200px)')
  return (
    <ViewerContainer metadataVisible={metadataVisible}>
      <Gradient />
      {!isDesktop && (
        <InlineLogo>
          <Logo />
        </InlineLogo>
      )}
      <ImageActions image={image} metadataVisible={metadataVisible} onToggleMetadata={onToggleMetadata} />
      <ImageWrapper>
        {loading ? (
          <LoaderOverlay>
            <CircularProgress size={56} sx={{ color: '#fff' }} />
          </LoaderOverlay>
        ) : (
          <img src={image.url} alt={image.metadata.scene.name} />
        )}
      </ImageWrapper>
    </ViewerContainer>
  )
})

export { ImageViewer }
