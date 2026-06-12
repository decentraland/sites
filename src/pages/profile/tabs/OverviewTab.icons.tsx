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

// Custom Pronouns icon — three overlapping circles. MUI ships no pronoun-
// specific glyph, so we inline the spec from the profile Figma. `currentColor`
// inherits from the surrounding `<InfoIcon>` styled wrapper.
function PronounsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M8.41591 3.20801C10.7861 3.20803 12.7079 5.12981 12.7079 7.5C12.7079 9.87017 10.7861 11.792 8.41591 11.792C6.04573 11.792 4.12394 9.87018 4.12392 7.5C4.12392 5.1298 6.04571 3.20801 8.41591 3.20801Z"
        stroke="currentColor"
        strokeWidth="1.41667"
      />
      <path
        d="M5.41665 8.20813C7.78683 8.20815 9.70864 10.1299 9.70864 12.5001C9.70862 14.8703 7.78682 16.7921 5.41665 16.7921C3.04646 16.7921 1.12468 14.8703 1.12465 12.5001C1.12465 10.1299 3.04645 8.20813 5.41665 8.20813Z"
        stroke="currentColor"
        strokeWidth="1.41667"
      />
      <path
        d="M11.5 8.20813C13.8701 8.20815 15.7919 10.1299 15.7919 12.5001C15.7919 14.8703 13.8701 16.7921 11.5 16.7921C9.12976 16.7921 7.20798 14.8703 7.20796 12.5001C7.20796 10.1299 9.12975 8.20813 11.5 8.20813Z"
        stroke="currentColor"
        strokeWidth="1.41667"
      />
    </svg>
  )
}

export { PronounsIcon, WearableInfoBadges }
export type { WearableInfoBadgesProps }
