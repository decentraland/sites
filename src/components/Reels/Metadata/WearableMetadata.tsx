import { type MouseEvent, memo, useCallback } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { buildMarketplaceWearableUrl } from '../../../features/reels'
import type { WearableParsed } from '../../../features/reels'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { SegmentEvent } from '../../../modules/segment'
import { BuyButton, WearableContainer, WearableImage, WearableName, WearableWrapper } from './WearableMetadata.styled'

interface WearableMetadataProps {
  wearable: WearableParsed
}

const WearableMetadata = memo(({ wearable }: WearableMetadataProps) => {
  const l = useFormatMessage()
  const { track } = useAnalytics()

  const marketplaceUrl =
    wearable.collectionId && wearable.blockchainId ? buildMarketplaceWearableUrl(wearable.collectionId, wearable.blockchainId) : '#'

  const handleClick = useCallback(
    (_event: MouseEvent<HTMLAnchorElement>) => {
      track(SegmentEvent.REELS_CLICK_WEARABLE, { wearableUrn: wearable.urn })
    },
    [track, wearable.urn]
  )

  return (
    <WearableContainer href={marketplaceUrl} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
      <WearableWrapper className="reels-wearable-wrapper">
        <WearableImage rarity={wearable.rarity}>
          <img src={wearable.image} alt={wearable.name} />
        </WearableImage>
        <WearableName>{wearable.name}</WearableName>
      </WearableWrapper>
      <BuyButton className="reels-wearable-buy" variant="contained" color="primary">
        {l('component.reels.wearable.buy')}
      </BuyButton>
    </WearableContainer>
  )
})

export { WearableMetadata }
