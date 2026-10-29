import { memo, useCallback, useMemo } from 'react'
import { BadgeGroup, EventCard, LiveBadge, UserCountBadge } from 'decentraland-ui2'
import type { EventEntry } from '../../../features/events'
import { useCreatorAvatar } from '../../../hooks/useCreatorAvatar'
import { optimizedImageUrl } from '../../../utils/imageUrl'
import { LiveCardWrapper } from './AllExperiencesCard.styled'

interface LiveCardProps {
  event: EventEntry
  onClick: (event: EventEntry) => void
}

const LiveCard = memo(({ event, onClick }: LiveCardProps) => {
  const { avatar } = useCreatorAvatar(event.user, event.user_name ?? undefined)

  const optimizedImage = useMemo(() => optimizedImageUrl(event.image, { width: 1120 }), [event.image])

  const handleClick = useCallback(() => {
    onClick(event)
  }, [onClick, event])

  return (
    <LiveCardWrapper>
      <EventCard
        image={optimizedImage}
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
