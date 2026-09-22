import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { EventSmallCard } from 'decentraland-ui2'
import { getThumbnailUrl } from '../../../features/communities/communities.helpers'
import type { DiscoverCommunity } from '../../../features/discover'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { getSyntheticAvatarUrl } from '../../../utils/avatarColor'

interface CommunityCardProps {
  community: DiscoverCommunity
}

// Community row card for the discover Communities list, so
// the discover grids — places, worlds, communities — share one card
// shape, one hover behavior, one typography family. Member count lands in
// the `timeLabel` slot (the clock icon doubles as a generic "activity"
// indicator the way it does for live people counts on PlaceCard).
function CommunityCardComponent({ community }: CommunityCardProps) {
  const t = useFormatMessage()
  const navigate = useNavigate()

  // Stable CDN convention for community thumbnails. URL always resolves
  // but 404s for communities that never uploaded one — let EventSmallCard
  // try, and pass the synthesized fallback so the avatar slot inside the
  // card body never reads as empty.
  const thumbnailUrl = getThumbnailUrl(community.id) ?? community.thumbnails?.raw ?? Object.values(community.thumbnails ?? {})[0]

  const membersLabel = t('discover.communities.members_count', { count: community.membersCount })

  const handleClick = useCallback(() => {
    navigate(`/social/communities/${community.id}`)
  }, [navigate, community.id])

  return (
    <EventSmallCard
      image={thumbnailUrl || getSyntheticAvatarUrl(community.name)}
      title={community.name}
      creatorName={community.description || undefined}
      creatorAvatarUrl={community.description ? getSyntheticAvatarUrl(community.name) : undefined}
      timeLabel={membersLabel}
      onClick={handleClick}
    />
  )
}

const CommunityCard = memo(CommunityCardComponent)

export { CommunityCard }
