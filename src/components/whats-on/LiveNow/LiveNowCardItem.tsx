import { memo } from 'react'
import type { Avatar } from '@dcl/schemas'
import type { LiveNowCard as LiveNowCardData } from '../../../features/whats-on-events'
import { useCreatorAvatar } from '../../../hooks/useCreatorAvatar'
import { LiveNowCard } from './LiveNowCard'

const DCL_LOGO_URL = `${window.location.origin}/dcl-logo.svg`

const LiveNowCardItem = memo(
  ({ card, onClick, eager }: { card: LiveNowCardData; onClick: (card: LiveNowCardData) => void; eager?: boolean }) => {
    const isGenesis = card.title.toLowerCase().includes('genesis plaza')
    // Hook must be called unconditionally; skip by passing undefined for Genesis Plaza (DCL logo is used instead).
    const { avatar: fetchedAvatar } = useCreatorAvatar(isGenesis ? undefined : card.creatorAddress, card.creatorName ?? undefined)

    let cardAvatar: Avatar | undefined
    if (isGenesis) {
      cardAvatar = {
        name: card.creatorName ?? 'Decentraland Foundation',
        ethAddress: '',
        avatar: { snapshots: { face256: DCL_LOGO_URL, body: '' } }
      } as unknown as Avatar
    } else if (fetchedAvatar) {
      cardAvatar = fetchedAvatar
    } else if (card.creatorName) {
      cardAvatar = { name: card.creatorName, ethAddress: '' } as unknown as Avatar
    }

    return <LiveNowCard card={card} avatar={cardAvatar} eager={eager} onClick={onClick} />
  }
)

LiveNowCardItem.displayName = 'LiveNowCardItem'

export { LiveNowCardItem }
