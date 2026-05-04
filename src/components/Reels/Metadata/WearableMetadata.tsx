import { type MouseEvent, memo, useCallback, useState } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { buildMarketplaceWearableUrl } from '../../../features/reels'
import type { WearableParsed } from '../../../features/reels'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { SegmentEvent } from '../../../modules/segment'
import {
  BuyButton,
  WearableContainer,
  WearableImage,
  WearableName,
  WearableStaticContainer,
  WearableWrapper
} from './WearableMetadata.styled'

interface WearableMetadataProps {
  wearable: WearableParsed
}

const WearableMetadata = memo(({ wearable }: WearableMetadataProps) => {
  const l = useFormatMessage()
  const { track } = useAnalytics()
  const [hovered, setHovered] = useState(false)

  const marketplaceUrl =
    wearable.collectionId && wearable.blockchainId ? buildMarketplaceWearableUrl(wearable.collectionId, wearable.blockchainId) : null

  const handleClick = useCallback(
    (_event: MouseEvent<HTMLAnchorElement>) => {
      track(SegmentEvent.REELS_CLICK_WEARABLE, { wearableUrn: wearable.urn })
    },
    [track, wearable.urn]
  )

  const body = (
    <>
      <WearableWrapper hovered={hovered}>
        <WearableImage rarity={wearable.rarity}>
          <img src={wearable.image} alt={wearable.name} />
        </WearableImage>
        <WearableName>{wearable.name}</WearableName>
      </WearableWrapper>
      {marketplaceUrl && <BuyButton visible={hovered}>{l('component.reels.wearable.buy')}</BuyButton>}
    </>
  )

  if (!marketplaceUrl) {
    return <WearableStaticContainer>{body}</WearableStaticContainer>
  }

  return (
    <WearableContainer
      href={marketplaceUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {body}
    </WearableContainer>
  )
})

export { WearableMetadata }
