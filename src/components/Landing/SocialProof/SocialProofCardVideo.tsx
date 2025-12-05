import * as React from 'react'
import { ContentfulSocialProofVideoEntryFieldsProps } from '../../../features/landing/landing.types'
import { useVideoOptimization } from '../../../hooks/contentful'
import { SocialProofCardContainer, SocialProofCardVideoMedia } from './SocialProofCard.styled'

const SocialProofCardVideo = React.memo((props: ContentfulSocialProofVideoEntryFieldsProps) => {
  const { video } = props
  const videoOptimized = useVideoOptimization(video.url)

  return (
    <SocialProofCardContainer>
      <SocialProofCardVideoMedia
        loop
        muted
        autoPlay
        playsInline={true}
        width={video.width}
        height={video.height}
        source={videoOptimized || video.url}
        type={video.mimeType}
      />
    </SocialProofCardContainer>
  )
})

export { SocialProofCardVideo }
