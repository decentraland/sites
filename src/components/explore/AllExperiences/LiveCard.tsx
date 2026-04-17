import { memo, useCallback } from 'react'
import type { Avatar } from '@dcl/schemas'
import { BadgeGroup, EventCard, LiveBadge, UserCountBadge } from 'decentraland-ui2'
import type { EventEntry } from '../../../features/explore-events'
import { useGetProfileQuery } from '../../../features/profile/profile.client'
import { LiveCardWrapper } from './AllExperiencesCard.styled'

interface LiveCardProps {
  event: EventEntry
  onClick: (event: EventEntry) => void
}

const LiveCard = memo(({ event, onClick }: LiveCardProps) => {
  const { data: profile } = useGetProfileQuery(event.user, { skip: !event.user })
  const fetchedAvatar = profile?.avatars?.[0]

  const handleClick = useCallback(() => {
    onClick(event)
  }, [onClick, event])

  // EventCard expects Avatar which requires userId as non-optional,
  // but ProfileAvatarsItem has it optional. Build a Pick with the fields EventCard uses.
  // ProfileAvatarsItem has optional fields that Avatar requires (userId, bodyShape, etc.)
  // EventCard only reads name, ethAddress, and avatar.snapshots.face256 —
  // the structural mismatch is safe to cast at this boundary.
  const avatar = fetchedAvatar?.avatar ? (fetchedAvatar as unknown as Avatar) : undefined

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
