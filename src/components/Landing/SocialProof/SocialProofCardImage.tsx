import { memo } from 'react'
import { ContentfulSocialProofImageEntryFieldsProps } from '../../../features/landing/landing.types'
import { isWebpSupported, useImageOptimization } from '../../../hooks/contentful'
import { SocialProofCardContainer, SocialProofCardImage as SocialProofCardImageMedia } from './SocialProofCard.styled'

const SocialProofCardImage = memo((props: ContentfulSocialProofImageEntryFieldsProps) => {
  const { image } = props
  const imageOptimized = useImageOptimization(image.url)
  return (
    <SocialProofCardContainer>
      <SocialProofCardImageMedia src={(isWebpSupported() && imageOptimized.webp) || imageOptimized.jpg || imageOptimized.optimized} />
    </SocialProofCardContainer>
  )
})

export { SocialProofCardImage }
