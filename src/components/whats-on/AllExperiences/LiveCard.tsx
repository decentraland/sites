import { memo, useCallback } from 'react'
import type { Avatar } from '@dcl/schemas'
import { BadgeGroup, EventCard, LiveBadge, UserCountBadge } from 'decentraland-ui2'
import type { EventEntry } from '../../../features/whats-on-events'
import { useProfileAvatar } from '../../../hooks/useProfileAvatar'
import { LiveCardWrapper } from './AllExperiencesCard.styled'

interface LiveCardProps {
  event: EventEntry
  onClick: (event: EventEntry) => void
}

const LiveCard = memo(({ event, onClick }: LiveCardProps) => {
  const { avatarForCard } = useProfileAvatar(event.user, { skip: !event.user })

  const handleClick = useCallback(() => {
    onClick(event)
  }, [onClick, event])

  // ProfileAvatarsItem has optional fields that Avatar marks as required (userId,
  // bodyShape, etc.). EventCard only reads name, ethAddress and snapshots.face256,
  // which ProfileAvatarsItem provides — so the single cast is safe at this boundary.
  // Forward the hook's pre-sanitized shape (face256 undefined when the CDN URL
  // is broken) so MUI's Avatar inside EventCard falls back to its placeholder.
  const avatar = avatarForCard as unknown as Avatar | undefined

  return (
    <LiveCardWrapper>
      <EventCard
        image={event.image ?? ''}
        sceneName={event.name}
        coordinates={`${event.x},${event.y}`}
        avatar={avatar}
        onClick={handleClick}
        leftBadge={
          <BadgeGroup>
            <LiveBadge />
            <UserCountBadge count={event.total_attendees} />
          </BadgeGroup>
        }
        leftBadgeTransparent
        hideLocation
      />
    </LiveCardWrapper>
  )
})

LiveCard.displayName = 'LiveCard'

export { LiveCard }
