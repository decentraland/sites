import { memo } from 'react'
import { BadgeGroup, EventCard, LiveBadge, UserCountBadge } from 'decentraland-ui2'
import { WhatsOnCardType } from '../../../features/events/events.types'
import type { WhatsOnCard } from '../../../features/events/events.types'
import { useGetProfileQuery } from '../../../features/profile/profile.client'

const WhatsOnCard = memo(({ card }: { card: WhatsOnCard }) => {
  const { data: profile } = useGetProfileQuery(card.creatorAddress)
  const avatar = profile?.avatars?.[0]

  return (
    <EventCard
      image={card.image}
      sceneName={card.title}
      avatar={avatar}
      coordinates={card.coordinates}
      leftBadgeTransparent
      hideLocation
      leftBadge={
        card.type === WhatsOnCardType.EVENT ? (
          <BadgeGroup>
            <LiveBadge />
            <UserCountBadge count={card.users} />
          </BadgeGroup>
        ) : (
          <UserCountBadge count={card.users} />
        )
      }
    />
  )
})

WhatsOnCard.displayName = 'WhatsOnCard'

export { WhatsOnCard }
