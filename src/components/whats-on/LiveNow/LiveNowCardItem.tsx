import { memo } from 'react'
import { useTranslation } from '@dcl/hooks'
import type { LiveNowCard as LiveNowCardData } from '../../../features/whats-on-events'
import { useCreatorAvatar } from '../../../hooks/useCreatorAvatar'
import { assetUrl } from '../../../utils/assetUrl'
import { formatEthAddress } from '../../../utils/avatar'
import { DCL_FOUNDATION_BACKGROUND_COLOR } from '../../../utils/avatarColor'
import { LiveNowCard } from './LiveNowCard'

// `/dcl-logo.svg` lives in /public, which Vite serves from the CDN base URL in
// prod (VITE_BASE_URL). Using `window.location.origin` here would hit
// decentraland.zone/dcl-logo.svg — a path the SPA rewrite silently resolves to
// index.html (content-type: text/html) → <img> renders blank.
const DCL_LOGO_URL = assetUrl('/dcl-logo.svg')
const DCL_FOUNDATION_NAME = 'Decentraland Foundation'

function resolveCreatorName(card: LiveNowCardData, unknownLabel: string): string {
  if (card.creatorName) return card.creatorName
  if (card.isGenesisPlaza) return DCL_FOUNDATION_NAME
  if (card.creatorAddress) return formatEthAddress(card.creatorAddress)
  return unknownLabel
}

const LiveNowCardItem = memo(
  ({ card, onClick, eager }: { card: LiveNowCardData; onClick: (card: LiveNowCardData) => void; eager?: boolean }) => {
    const { t } = useTranslation()
    // Hook must be called unconditionally; Genesis Plaza opts out of the face probe
    // because we always paint the DCL logo for it.
    const { avatarFace, backgroundColor } = useCreatorAvatar(
      card.isGenesisPlaza ? undefined : card.creatorAddress,
      card.creatorName ?? undefined
    )

    const creatorName = resolveCreatorName(card, t('live_now.unknown_creator'))
    const creatorFaceUrl = card.isGenesisPlaza ? DCL_LOGO_URL : avatarFace
    const avatarBackgroundColor = card.isGenesisPlaza ? DCL_FOUNDATION_BACKGROUND_COLOR : backgroundColor

    return (
      <LiveNowCard
        card={card}
        creatorName={creatorName}
        creatorFaceUrl={creatorFaceUrl}
        creatorBackgroundColor={avatarBackgroundColor}
        eager={eager}
        onClick={onClick}
      />
    )
  }
)

LiveNowCardItem.displayName = 'LiveNowCardItem'

export { LiveNowCardItem }
