import type { ContentfulCreatorsWhyEntryProps, ContentfulCreatorsWhyListProps } from '../../../features/landing/landing.types'

type CreatorsWhyProps = {
  items: ContentfulCreatorsWhyListProps
}

type CreatorsWhyCardProps = {
  item: ContentfulCreatorsWhyEntryProps
}

export type { CreatorsWhyCardProps, CreatorsWhyProps }
