import type { Document } from '@contentful/rich-text-types'
import type { ContentfulCreatorsCreateEntryProps, ContentfulCreatorsCreateListProps } from '../../../features/landing/landing.types'

type CreatorsCreateProps = {
  items: ContentfulCreatorsCreateListProps
}

type CreatorsCreateCardProps = {
  item: ContentfulCreatorsCreateEntryProps
}

type CreatorsCreateTabProps = {
  title: string
  subtitle: string
  skills: string[]
  links: Document
}

export type { CreatorsCreateCardProps, CreatorsCreateProps, CreatorsCreateTabProps }
