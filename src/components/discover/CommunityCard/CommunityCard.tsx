import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { EventSmallCard } from 'decentraland-ui2'
import { getThumbnailUrl } from '../../../features/communities/communities.helpers'
import type { SocialCommunity } from '../../../features/discover'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { getAvatarBackgroundColor } from '../../../utils/avatarColor'

// Same colored-disc-with-initial pattern PlaceCard uses for owners
// without a deployed face256. Lets community cards land on a recognizable
// avatar slot even when the CDN's `/social/communities/<id>/raw-thumbnail`
// 404s, matching the rest of the app's avatar fallback look (ADR-292
// NameColorHelper FNV-1a/HSV palette).
function getSyntheticAvatarUrl(name: string): string {
  const bg = getAvatarBackgroundColor(name)
  const initial = (name.match(/[\p{L}\p{N}]/u)?.[0] ?? '?').toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${bg}"/><text x="16" y="22" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="white">${initial}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

interface CommunityCardProps {
  community: SocialCommunity
}

// Wraps the shared `EventSmallCard` primitive (same one PlaceCard uses) so
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

  const membersLabel = t('social.communities.members_count', { count: community.membersCount })

  const handleClick = useCallback(() => {
    navigate(`/discover/communities/${community.id}`)
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
