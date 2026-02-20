import { memo, useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { ContentfulSocialProofVideoEntryFieldsProps } from '../../../features/landing/landing.types'
import { useVideoOptimization } from '../../../hooks/contentful'
import { SocialProofCardContainer, SocialProofCardVideoMedia, SocialProofCardVideoPlaceholder } from './SocialProofCard.styled'

const SocialProofCardVideo = memo((props: ContentfulSocialProofVideoEntryFieldsProps) => {
  const { video } = props
  const videoOptimized = useVideoOptimization(video.url)
  const { ref, inView } = useInView({
    rootMargin: '200px 0px'
  })
  const [hasBeenInView, setHasBeenInView] = useState(false)

  useEffect(() => {
    if (inView) {
      setHasBeenInView(true)
    }
  }, [inView])

  return (
    <SocialProofCardContainer ref={ref}>
      {hasBeenInView ? (
        <SocialProofCardVideoMedia
          loop
          muted
          play={inView}
          preload={inView ? 'metadata' : 'none'}
          playsInline={true}
          width={video.width}
          height={video.height}
          source={videoOptimized || video.url}
          type={video.mimeType}
        />
      ) : (
        <SocialProofCardVideoPlaceholder aspectRatio={video.width / video.height} />
      )}
    </SocialProofCardContainer>
  )
})

export { SocialProofCardVideo }
