import { memo } from 'react'
import { useWalletState } from '@dcl/core-web3/lazy'
import type { Avatar } from '@dcl/schemas'
import { BadgeGroup, EventCard, LiveBadge, UserCountBadge } from 'decentraland-ui2'
import type { WhatsOn } from '../../../features/events/events.types'
import { useGetProfileQuery } from '../../../features/profile/profile.client'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { SectionViewedTrack } from '../../../modules/segment'
import { assetUrl } from '../../../utils/assetUrl'
import { CardWrapper } from './WhatsOn.styled'

// AvatarFace only passes through URLs starting with https://, otherwise it
// prepends peer.decentraland.org. In prod assetUrl gives https://cdn..., in
// dev we force https by replacing the protocol.
const DCL_LOGO_URL = assetUrl('/dcl-logo.svg').replace(/^http:\/\//, 'https://')

const DCL_FOUNDATION_NAMES = ['decentraland foundation', 'decentraland', 'dcl']

function isDclFoundation(name?: string): boolean {
  return !!name && DCL_FOUNDATION_NAMES.includes(name.toLowerCase())
}

const WhatsOnCard = memo(({ card, loading }: { card?: WhatsOn; loading?: boolean }) => {
  const { isConnected, address } = useWalletState()
  const isSignedIn = isConnected || !!address
  const onClickHandle = useTrackClick()
  const { data: profile } = useGetProfileQuery(card?.creatorAddress, { skip: !card?.creatorAddress })
  const fetchedAvatar = profile?.avatars?.[0]

  let avatar: Avatar | undefined = fetchedAvatar as Avatar | undefined
  if (!avatar && card?.creatorName) {
    avatar = {
      name: card.creatorName,
      ethAddress: '',
      ...(isDclFoundation(card.creatorName) && {
        avatar: { snapshots: { face256: DCL_LOGO_URL, body: '' } }
      })
    } as Avatar
  }

  return (
    <CardWrapper data-place={SectionViewedTrack.LANDING_WHATS_ON} data-event="click" data-card={card?.title} onClick={onClickHandle}>
      <EventCard
        loading={loading}
        image={card?.image ?? ''}
        sceneName={card?.title ?? ''}
        avatar={avatar as Avatar}
        coordinates={card?.coordinates}
        redirectToAuth={!isSignedIn}
        leftBadgeTransparent
        hideLocation
        leftBadge={
          card ? (
            <BadgeGroup>
              <LiveBadge />
              <UserCountBadge count={card.users} />
            </BadgeGroup>
          ) : undefined
        }
      />
    </CardWrapper>
  )
})

WhatsOnCard.displayName = 'WhatsOnCard'

export { WhatsOnCard }
