import { usePlaceCreator } from '../../../hooks/usePlaceCreator'
import { CreatorByLineName } from '../../places/_shared/CreatorByLineName'
import { AvatarImage, CreatorName, CreatorRow } from '../DetailModal/DetailModal.styled'
import type { PlaceDetailModalCreatorProps } from './PlaceDetailModal.types'

function PlaceDetailModalCreator({ data, prefixLabel }: PlaceDetailModalCreatorProps) {
  /* eslint-disable @typescript-eslint/naming-convention -- preserve Places API metadata field names */
  const { creatorName, creatorAddress, creatorAvatar, avatarBg } = usePlaceCreator({
    title: data.title,
    contact_name: data.contactName,
    owner: data.ownerAddress ?? null,
    creator_address: data.creatorAddress
  })
  /* eslint-enable @typescript-eslint/naming-convention */

  if (!creatorName || !avatarBg) return null

  return (
    <CreatorRow>
      {creatorAvatar && <AvatarImage src={creatorAvatar} alt={creatorName} fallbackColor={avatarBg} />}
      <CreatorName>
        {prefixLabel}
        <CreatorByLineName name={creatorName} address={creatorAddress} />
      </CreatorName>
    </CreatorRow>
  )
}

export { PlaceDetailModalCreator }
