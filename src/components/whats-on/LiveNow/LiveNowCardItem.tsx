import { memo } from 'react'
import type { Avatar } from '@dcl/schemas'
import type { LiveNowCard as LiveNowCardData } from '../../../features/whats-on-events'
import { useCreatorAvatar } from '../../../hooks/useCreatorAvatar'
import { assetUrl } from '../../../utils/assetUrl'
import { buildMinimalAvatar } from '../../../utils/avatar'
import { LiveNowCard } from './LiveNowCard'

// `/dcl-logo.svg` lives in /public, which Vite serves from the CDN base URL in
// prod (VITE_BASE_URL). Using `window.location.origin` here would hit
// decentraland.zone/dcl-logo.svg — a path the SPA rewrite silently resolves to
// index.html (content-type: text/html) → <img> renders blank.
const DCL_LOGO_URL = assetUrl('/dcl-logo.svg')
const DCL_FOUNDATION_NAME = 'Decentraland Foundation'

const LiveNowCardItem = memo(
  ({ card, onClick, eager }: { card: LiveNowCardData; onClick: (card: LiveNowCardData) => void; eager?: boolean }) => {
    // Hook must be called unconditionally; Genesis Plaza opts out of the face probe
    // because we always paint the DCL logo for it.
    const { avatar: fetchedAvatar } = useCreatorAvatar(card.isGenesisPlaza ? undefined : card.creatorAddress, card.creatorName ?? undefined)

    let cardAvatar: Avatar | undefined
    if (card.isGenesisPlaza) {
      cardAvatar = buildMinimalAvatar({
        name: card.creatorName ?? DCL_FOUNDATION_NAME,
        ethAddress: '',
        faceUrl: DCL_LOGO_URL
      })
    } else if (fetchedAvatar) {
      cardAvatar = fetchedAvatar
    } else if (card.creatorName) {
      cardAvatar = buildMinimalAvatar({ name: card.creatorName, ethAddress: '' })
    }

    return <LiveNowCard card={card} avatar={cardAvatar} eager={eager} onClick={onClick} />
  }
)

LiveNowCardItem.displayName = 'LiveNowCardItem'

export { LiveNowCardItem }
