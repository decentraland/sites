import { memo } from 'react'
import type { Avatar } from '@dcl/schemas'
import { BadgeGroup, EventCard, LiveBadge, UserCountBadge } from 'decentraland-ui2'
import { WhatsOnCardType } from '../../../features/events/events.types'
import type { WhatsOn } from '../../../features/events/events.types'
import { useGetProfileQuery } from '../../../features/profile/profile.client'

const WhatsOnCard = memo(({ card, loading }: { card?: WhatsOn; loading?: boolean }) => {
  const { data: profile } = useGetProfileQuery(card?.creatorAddress, { skip: !card?.creatorAddress })
  const fetchedAvatar = profile?.avatars?.[0]
  const avatar: Avatar | undefined =
    fetchedAvatar ?? (card?.creatorName ? ({ name: card.creatorName, ethAddress: '' } as Avatar) : undefined)

  return (
    <EventCard
      loading={loading}
      image={card?.image ?? ''}
      sceneName={card?.title ?? ''}
      avatar={avatar as Avatar}
      coordinates={card?.coordinates}
      leftBadgeTransparent
      hideLocation
      leftBadge={
        card?.type === WhatsOnCardType.EVENT ? (
          <BadgeGroup>
            <LiveBadge />
            <UserCountBadge count={card.users} />
          </BadgeGroup>
        ) : card ? (
          <UserCountBadge count={card.users} />
        ) : undefined
      }
    />
  )
})

WhatsOnCard.displayName = 'WhatsOnCard'

export { WhatsOnCard }
