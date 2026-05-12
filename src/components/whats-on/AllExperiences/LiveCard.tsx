import { memo, useCallback } from 'react'
import { BadgeGroup, EventCard, LiveBadge, UserCountBadge } from 'decentraland-ui2'
import type { EventEntry } from '../../../features/events'
import { useCreatorAvatar } from '../../../hooks/useCreatorAvatar'
import { LiveCardWrapper } from './AllExperiencesCard.styled'

interface LiveCardProps {
  event: EventEntry
  onClick: (event: EventEntry) => void
}

const LiveCard = memo(({ event, onClick }: LiveCardProps) => {
  const { avatar } = useCreatorAvatar(event.user, event.user_name ?? undefined)

  const handleClick = useCallback(() => {
    onClick(event)
  }, [onClick, event])

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
