import { memo } from 'react'
import { ImageList } from 'decentraland-ui2'
import { ContentfulSocialProofListProps } from '../../../features/landing/landing.types'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { SocialProofCardImage } from './SocialProofCardImage'
import { SocialProofCardQuote } from './SocialProofCardQuote'
import { SocialProofCardVideo } from './SocialProofCardVideo'
import { SocialProofContainer, SocialProofSection, SocialProofTitle } from './SocialProof.styled'

const IMAGE_LIST_SX = {
  columnCount: {
    md: '3 !important',
    lg: '4 !important',
    xl: '5 !important'
  }
}

function getSocialProofItemKey(cardProps: ContentfulSocialProofListProps['list'][number], index: number) {
  switch (cardProps.type) {
    case 'image':
      return `image-${cardProps.image.url}-${index}`
    case 'video':
      return `video-${cardProps.video.url}-${index}`
    case 'quote':
      return `quote-${cardProps.userName}-${cardProps.userAvatar.url}-${index}`
  }
}

const SocialProof = memo((props: { socialProof: ContentfulSocialProofListProps }) => {
  const { list } = props.socialProof

  const l = useFormatMessage()

  return (
    <SocialProofSection>
      <SocialProofTitle variant="h3">{l('component.landing.social_proof.title')}</SocialProofTitle>
      <SocialProofContainer>
        <ImageList variant="masonry" cols={2} gap={20} sx={IMAGE_LIST_SX}>
          {list.map((cardProps, index) => {
            const key = getSocialProofItemKey(cardProps, index)

            switch (cardProps.type) {
              case 'image':
                return <SocialProofCardImage key={key} {...cardProps} />
              case 'video':
                return <SocialProofCardVideo key={key} {...cardProps} />
              case 'quote':
                return <SocialProofCardQuote key={key} {...cardProps} />
            }
          })}
        </ImageList>
      </SocialProofContainer>
    </SocialProofSection>
  )
})

export { SocialProof }
