import { memo, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ImageViewer } from '../../components/Reels/ImageViewer'
import { Metadata } from '../../components/Reels/Metadata'
import { NotPhoto } from '../../components/Reels/NotPhoto'
import { useReelImageById } from '../../hooks/useReelImageById'

const ReelsImagePage = memo(() => {
  const { imageId } = useParams<{ imageId: string }>()
  const { image, isLoading, error } = useReelImageById(imageId)
  const [metadataVisible, setMetadataVisible] = useState(false)

  useEffect(() => {
    const previous = document.title
    if (image) {
      const userName = image.metadata.visiblePeople[0]?.userName ?? image.metadata.userName ?? 'Someone'
      const sceneName = image.metadata.scene.name
      document.title = `${userName} took this photo in ${sceneName}`
    } else {
      document.title = 'Decentraland Reels'
    }
    return () => {
      document.title = previous
    }
  }, [image])

  if (!isLoading && (error || !image)) {
    return <NotPhoto />
  }

  if (!image) {
    return null
  }

  return (
    <>
      <ImageViewer
        image={image}
        metadataVisible={metadataVisible}
        onToggleMetadata={() => setMetadataVisible(value => !value)}
        loading={isLoading}
      />
      <Metadata metadata={image.metadata} loading={isLoading} visible={metadataVisible} />
    </>
  )
})

export { ReelsImagePage }
