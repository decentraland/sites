import { memo, useCallback, useMemo } from 'react'
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
  const { avatar: fetchedAvatar, avatarFace } = useProfileAvatar(event.user, { skip: !event.user })

  const handleClick = useCallback(() => {
    onClick(event)
  }, [onClick, event])

  // Build only the fields EventCard reads (name, ethAddress, avatar.snapshots.face256).
  // Forwarding the hook's sanitized face256 (undefined when the CDN URL is broken)
  // makes MUI's Avatar inside EventCard fall back to its placeholder.
  const avatar = useMemo<Avatar | undefined>(() => {
    if (!fetchedAvatar) return undefined
    return {
      name: fetchedAvatar.name ?? '',
      ethAddress: fetchedAvatar.ethAddress ?? '',
      avatar: { snapshots: { face256: avatarFace } }
    } as unknown as Avatar
  }, [fetchedAvatar, avatarFace])

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
