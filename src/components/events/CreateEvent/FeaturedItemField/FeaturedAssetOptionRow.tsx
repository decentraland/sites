import { memo } from 'react'
import type { HTMLAttributes } from 'react'
import { useTranslation } from '@dcl/hooks'
import type { FeaturedAssetOption } from '../../../../hooks/useFeaturedAssetSearch.types'
import { FeaturedAssetThumbnail } from './FeaturedAssetThumbnail'
import { FeaturedAssetCreator, FeaturedAssetName, FeaturedAssetRow, FeaturedAssetTexts } from './FeaturedItemField.styled'

interface FeaturedAssetOptionRowProps extends HTMLAttributes<HTMLLIElement> {
  option: FeaturedAssetOption
}

function FeaturedAssetOptionRowComponent({ option, ...liProps }: FeaturedAssetOptionRowProps) {
  const { t } = useTranslation()
  // A creator with no deployed profile leaves only their address, and an unresolved pasted URN
  // leaves nothing at all — neither is worth a "By" line.
  const creator = option.creatorName ?? (option.creator || undefined)

  return (
    <FeaturedAssetRow {...liProps}>
      <FeaturedAssetThumbnail thumbnails={option.thumbnails} />
      <FeaturedAssetTexts>
        <FeaturedAssetName title={option.name}>{option.name}</FeaturedAssetName>
        {creator && <FeaturedAssetCreator>{t('create_event.featured_item_by', { creator })}</FeaturedAssetCreator>}
      </FeaturedAssetTexts>
    </FeaturedAssetRow>
  )
}

const FeaturedAssetOptionRow = memo(FeaturedAssetOptionRowComponent)

export { FeaturedAssetOptionRow }
export type { FeaturedAssetOptionRowProps }
