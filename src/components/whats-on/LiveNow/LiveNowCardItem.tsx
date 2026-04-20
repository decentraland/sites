import { memo, useCallback } from 'react'
import type { Avatar } from '@dcl/schemas'
import { BadgeGroup, EventCard, LiveBadge, UserCountBadge } from 'decentraland-ui2'
import { useGetProfileQuery } from '../../../features/profile/profile.client'
import type { LiveNowCard } from '../../../features/whats-on-events'

const DCL_LOGO_URL = `${window.location.origin}/dcl-logo.svg`

interface CardAvatar {
  name: string
  ethAddress: string
  avatar?: { snapshots?: { face256?: string; body?: string } }
}

const LiveNowCardItem = memo(({ card, onClick }: { card: LiveNowCard; onClick: (card: LiveNowCard) => void }) => {
  const isGenesis = card.title.toLowerCase().includes('genesis plaza')
  const { data: profile } = useGetProfileQuery(card.creatorAddress, { skip: !card.creatorAddress })
  const fetchedAvatar = profile?.avatars?.[0]

  const handleClick = useCallback(() => {
    onClick(card)
  }, [onClick, card])

  let cardAvatar: CardAvatar | undefined
  if (isGenesis) {
    cardAvatar = {
      name: card.creatorName ?? 'Decentraland Foundation',
      ethAddress: '',
      avatar: { snapshots: { face256: DCL_LOGO_URL, body: '' } }
    }
  } else if (fetchedAvatar) {
    cardAvatar = { name: fetchedAvatar.name ?? '', ethAddress: fetchedAvatar.ethAddress ?? '', avatar: fetchedAvatar.avatar }
  } else if (card.creatorName) {
    cardAvatar = { name: card.creatorName, ethAddress: '' }
  }

  return (
    <EventCard
      image={card.image}
      sceneName={card.title}
      coordinates={card.coordinates}
      avatar={cardAvatar as Avatar | undefined}
      onClick={handleClick}
      hoverEffect="lift"
      leftBadge={
        <BadgeGroup>
          {card.type === 'event' && <LiveBadge />}
          <UserCountBadge count={card.users} />
        </BadgeGroup>
      }
      leftBadgeTransparent
      hideLocation
    />
  )
})

LiveNowCardItem.displayName = 'LiveNowCardItem'

export { LiveNowCardItem }
