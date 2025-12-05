import * as React from 'react'
import { ImageList } from 'decentraland-ui2'
import { SocialProofCardImage } from './SocialProofCardImage'
import { SocialProofCardQuote } from './SocialProofCardQuote'
import { SocialProofCardVideo } from './SocialProofCardVideo'
import { ContentfulSocialProofListProps } from '../../../features/landing/landing.types'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { SocialProofContainer, SocialProofSection, SocialProofTitle } from './SocialProof.styled'

const SocialProof = React.memo((props: { socialProof: ContentfulSocialProofListProps }) => {
  const { list } = props.socialProof

  const l = useFormatMessage()

  return (
    <SocialProofSection>
      <SocialProofTitle variant="h3">{l('component.landing.social_proof.title')}</SocialProofTitle>
      <SocialProofContainer>
        <ImageList
          variant="masonry"
          cols={2}
          gap={20}
          sx={{
            columnCount: {
              md: '3 !important',
              lg: '4 !important',
              xl: '5 !important'
            }
          }}
        >
          {list.map((cardProps, key) => {
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
