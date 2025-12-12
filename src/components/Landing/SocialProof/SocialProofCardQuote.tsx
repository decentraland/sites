import { memo } from 'react'
import { Avatar } from 'decentraland-ui2'
import { ContentfulSocialProofQuoteEntryFieldsProps } from '../../../features/landing/landing.types'
import { isWebpSupported, useImageOptimization } from '../../../hooks/contentful'
import { VerifiedIcon } from '../../Icon/VerifiedIcon'
import {
  SocialProofCardContainer,
  SocialProofCardQuoteContainer,
  SocialProofCardQuoteText,
  SocialProofCardUserContainer,
  SocialProofCardUserName
} from './SocialProofCard.styled'

const SocialProofCardQuote = memo((props: ContentfulSocialProofQuoteEntryFieldsProps) => {
  const { text, userName, userAvatar, quoteBackground } = props
  const userAvatarOptimized = useImageOptimization(userAvatar.url)
  return (
    <SocialProofCardContainer>
      <SocialProofCardQuoteContainer sx={{ backgroundColor: quoteBackground }}>
        <SocialProofCardQuoteText variant="body1">&quot;{text.text}&quot;</SocialProofCardQuoteText>
        <SocialProofCardUserContainer>
          <Avatar
            sx={{ width: 32, height: 32 }}
            src={(isWebpSupported() && userAvatarOptimized.webp) || userAvatarOptimized.jpg || userAvatarOptimized.optimized}
          />
          <SocialProofCardUserName>{userName}</SocialProofCardUserName>
          <VerifiedIcon fontSize="medium" />
        </SocialProofCardUserContainer>
      </SocialProofCardQuoteContainer>
    </SocialProofCardContainer>
  )
})

export { SocialProofCardQuote }
