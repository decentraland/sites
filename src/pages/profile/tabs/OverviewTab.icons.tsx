import type { ComponentType } from 'react'
import {
  BaseFemaleIcon,
  BaseMaleIcon,
  BodyShapeIcon,
  EarringIcon,
  EyebrowsIcon,
  EyesIcon,
  EyewearIcon,
  FacialHairIcon,
  FeetIcon,
  HairIcon,
  HandsWearIcon,
  HatIcon,
  HelmetIcon,
  LowerBodyIcon,
  MaskIcon,
  MouthIcon,
  SkinIcon,
  SmartWearableIcon,
  TiaraIcon,
  Tooltip,
  TopHeadIcon,
  UnisexIcon,
  UpperBodyIcon
} from 'decentraland-ui2'

interface SvgIconLike {
  fontSize?: 'inherit' | 'small' | 'medium' | 'large'
  titleAccess?: string
}

// The keys mirror the marketplace-api snake_case categories (`upper_body`,
// `body_shape`, ...). A Map sidesteps the naming-convention lint on object keys.
const CATEGORY_ICON = new Map<string, ComponentType<SvgIconLike>>([
  ['body_shape', BodyShapeIcon],
  ['earring', EarringIcon],
  ['eyebrows', EyebrowsIcon],
  ['eyes', EyesIcon],
  ['eyewear', EyewearIcon],
  ['facial_hair', FacialHairIcon],
  ['feet', FeetIcon],
  ['hair', HairIcon],
  ['hands_wear', HandsWearIcon],
  ['hat', HatIcon],
  ['helmet', HelmetIcon],
  ['lower_body', LowerBodyIcon],
  ['mask', MaskIcon],
  ['mouth', MouthIcon],
  ['skin', SkinIcon],
  ['tiara', TiaraIcon],
  ['top_head', TopHeadIcon],
  ['upper_body', UpperBodyIcon]
])

function formatCategoryLabel(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface WearableInfoBadgesProps {
  category?: string
  bodyShapes?: readonly string[]
  isSmart?: boolean
}

function WearableInfoBadges({ category, bodyShapes, isSmart }: WearableInfoBadgesProps) {
  // PascalCase is required because React reads the local name to choose between
  // a host element and a component. The lint rule for variables flags it.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const CategoryIcon = category ? CATEGORY_ICON.get(category) : undefined
  const hasMale = bodyShapes?.some(shape => shape.toLowerCase().includes('basemale')) ?? false
  const hasFemale = bodyShapes?.some(shape => shape.toLowerCase().includes('basefemale')) ?? false
  const BodyIcon = hasMale && hasFemale ? UnisexIcon : hasMale ? BaseMaleIcon : hasFemale ? BaseFemaleIcon : undefined
  const bodyLabel = hasMale && hasFemale ? 'Unisex' : hasMale ? 'For male' : hasFemale ? 'For female' : undefined

  return (
    <>
      {CategoryIcon && category ? (
        <Tooltip arrow placement="top" title={formatCategoryLabel(category)}>
          <CategoryIcon fontSize="small" titleAccess={formatCategoryLabel(category)} />
        </Tooltip>
      ) : null}
      {BodyIcon && bodyLabel ? (
        <Tooltip arrow placement="top" title={bodyLabel}>
          <BodyIcon fontSize="small" titleAccess={bodyLabel} />
        </Tooltip>
      ) : null}
      {isSmart ? (
        <Tooltip arrow placement="top" title="Smart wearable">
          <SmartWearableIcon fontSize="small" titleAccess="Smart wearable" />
        </Tooltip>
      ) : null}
    </>
  )
}

export { WearableInfoBadges }
export type { WearableInfoBadgesProps }
