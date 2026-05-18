import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getThumbnailUrl } from '../../../features/communities/communities.helpers'
import type { SocialCommunity } from '../../../features/social'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { Body, Card, Cover, CoverFallback, CoverImage, Description, FallbackDisc, Meta, Title } from './CommunityCard.styled'

interface CommunityCardProps {
  community: SocialCommunity
}

function CommunityCardComponent({ community }: CommunityCardProps) {
  const t = useFormatMessage()
  const navigate = useNavigate()
  // The list endpoint doesn't include thumbnails — assets are served from the
  // CDN under a stable convention. `getThumbnailUrl` is the same helper used
  // by the existing CommunityDetail page so the same image renders in both.
  // The URL always resolves, but for communities that never uploaded a face
  // image the CDN 404s. We track that with `imageBroken` and swap to the
  // gradient + initial fallback — without it the cover shows the browser's
  // broken-image glyph (or nothing at all) and the card looks empty.
  const thumbnail = getThumbnailUrl(community.id) ?? community.thumbnails?.raw ?? Object.values(community.thumbnails ?? {})[0]
  const [imageBroken, setImageBroken] = useState(false)
  const showFallback = !thumbnail || imageBroken

  const onOpen = () => navigate(`/discover/communities/${community.id}`)

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <Cover>
        {thumbnail && !imageBroken && (
          <CoverImage src={thumbnail} alt={community.name} loading="lazy" onError={() => setImageBroken(true)} />
        )}
        {showFallback && (
          <CoverFallback>
            <FallbackDisc>{community.name.charAt(0).toUpperCase()}</FallbackDisc>
          </CoverFallback>
        )}
      </Cover>
      <Body>
        <Title title={community.name}>{community.name}</Title>
        {community.description && <Description>{community.description}</Description>}
        <Meta>{t('social.communities.members_count', { count: community.membersCount })}</Meta>
      </Body>
    </Card>
  )
}

const CommunityCard = memo(CommunityCardComponent)

export { CommunityCard }
