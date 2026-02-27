import { mapContentfulAsset, mapFaq, mapRichTextToRaw } from '../contentful/contentful.helper'
import type { ContentfulEntry } from '../contentful/contentful.types'
import type {
  ContentfulCreatorsConnectListProps,
  ContentfulCreatorsCreateListProps,
  ContentfulCreatorsHeroEntryFieldsProps,
  ContentfulCreatorsLearnListProps,
  ContentfulCreatorsWhyListProps,
  ContentfulMediaProps
} from './create.types'

const mapCreatorsHero = (entry: ContentfulEntry): ContentfulCreatorsHeroEntryFieldsProps | null => {
  if (!entry || !entry.fields) {
    return null
  }

  const fields = entry.fields as {
    titleFirstLine?: string
    changingWord?: string[]
    titleLastLine?: string
    subtitle?: string
    imageLandscape?: ContentfulEntry
    videoLandscape?: ContentfulEntry
    imagePortrait?: ContentfulEntry
    videoPortrait?: ContentfulEntry
  }

  return {
    titleFirstLine: fields.titleFirstLine ?? '',
    changingWord: fields.changingWord ?? [],
    titleLastLine: fields.titleLastLine ?? '',
    subtitle: fields.subtitle ?? '',
    imageLandscape: mapContentfulAsset(fields.imageLandscape) || ({} as ContentfulMediaProps),
    videoLandscape: mapContentfulAsset(fields.videoLandscape) || ({} as ContentfulMediaProps),
    imagePortrait: mapContentfulAsset(fields.imagePortrait) || ({} as ContentfulMediaProps),
    videoPortrait: mapContentfulAsset(fields.videoPortrait) || ({} as ContentfulMediaProps),
    id: entry.sys.id
  }
}

const mapCreatorsWhy = (entry: ContentfulEntry): ContentfulCreatorsWhyListProps => {
  if (!entry || !entry.fields || !entry.fields.list) {
    return { list: [] }
  }

  const list = (entry.fields.list as ContentfulEntry[]).map((item: ContentfulEntry) => {
    const fields = item.fields as {
      title?: string
      description?: string
      image?: ContentfulEntry | null
    }

    return {
      title: fields?.title ?? '',
      description: fields?.description ?? '',
      image: mapContentfulAsset(fields?.image) || ({} as ContentfulMediaProps),
      id: item.sys?.id || ''
    }
  })

  return { list }
}

const mapCreatorsCreate = (entry: ContentfulEntry): ContentfulCreatorsCreateListProps => {
  if (!entry || !entry.fields || !entry.fields.list) {
    return { list: [] }
  }

  const list = (entry.fields.list as ContentfulEntry[]).map((item: ContentfulEntry) => {
    const fields = item.fields as {
      title?: string
      description?: string
      image?: ContentfulEntry | null
      imageBackground?: ContentfulEntry | null
      tab1Title?: string
      tab1DescriptionTitle?: string
      tab1DescriptionSubTitle?: string
      tab1Skills?: string[]
      tab1Links?: unknown
      tab2Title?: string
      tab2DescriptionTitle?: string
      tab2DescriptionSubTitle?: string
      tab2Skills?: string[]
      tab2Links?: unknown
    }

    return {
      title: fields?.title ?? '',
      description: fields?.description ?? '',
      image: mapContentfulAsset(fields?.image) || ({} as ContentfulMediaProps),
      imageBackground: mapContentfulAsset(fields?.imageBackground) || ({} as ContentfulMediaProps),
      tab1Title: fields?.tab1Title ?? '',
      tab1DescriptionTitle: fields?.tab1DescriptionTitle ?? '',
      tab1DescriptionSubTitle: fields?.tab1DescriptionSubTitle ?? '',
      tab1Skills: fields?.tab1Skills ?? [],
      tab1Links: mapRichTextToRaw(fields?.tab1Links),
      tab2Title: fields?.tab2Title ?? '',
      tab2DescriptionTitle: fields?.tab2DescriptionTitle ?? '',
      tab2DescriptionSubTitle: fields?.tab2DescriptionSubTitle ?? '',
      tab2Skills: fields?.tab2Skills ?? [],
      tab2Links: mapRichTextToRaw(fields?.tab2Links),
      id: item.sys?.id || ''
    }
  })

  return { list }
}

const mapCreatorsConnect = (entry: ContentfulEntry): ContentfulCreatorsConnectListProps => {
  if (!entry || !entry.fields || !entry.fields.list) {
    return { list: [] }
  }

  const list = (entry.fields.list as ContentfulEntry[]).map((item: ContentfulEntry) => {
    const fields = item.fields as {
      name?: string
      description?: string
      image?: ContentfulEntry | null
      url?: string
    }

    return {
      name: fields?.name ?? '',
      description: fields?.description ?? '',
      image: mapContentfulAsset(fields?.image) || ({} as ContentfulMediaProps),
      url: fields?.url ?? '',
      id: item.sys?.id || ''
    }
  })

  return { list }
}

const mapCreatorsLearn = (entry: ContentfulEntry): ContentfulCreatorsLearnListProps => {
  if (!entry || !entry.fields || !entry.fields.list) {
    return { list: [] }
  }

  const list = (entry.fields.list as ContentfulEntry[]).map((item: ContentfulEntry) => {
    const fields = item.fields as {
      title?: string
      name?: string
      userImage?: ContentfulEntry | null
      image?: ContentfulEntry | null
      url?: string
      date?: string
    }

    return {
      title: fields?.title ?? '',
      name: fields?.name ?? '',
      userImage: mapContentfulAsset(fields?.userImage) || ({} as ContentfulMediaProps),
      image: mapContentfulAsset(fields?.image) || ({} as ContentfulMediaProps),
      url: fields?.url ?? '',
      date: fields?.date ?? '',
      id: item.sys?.id || ''
    }
  })

  return { list }
}

export { mapCreatorsConnect, mapCreatorsCreate, mapCreatorsHero, mapCreatorsLearn, mapCreatorsWhy, mapFaq }
