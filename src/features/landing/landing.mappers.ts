import { mapContentfulAsset, mapFaq } from '../contentful/contentful.helper'
import type { ContentfulEntry } from '../contentful/contentful.types'
import type {
  ContentfulBannerCTAEntryFieldsProps,
  ContentfulHeroEntryFieldsProps,
  ContentfulMediaProps,
  ContentfulMissionsListProps,
  ContentfulSocialProofListProps,
  ContentfulTextMarqueeEntry,
  ContentfulWhatsHotListProps
} from './landing.types'

function mapHero(entry: ContentfulEntry): ContentfulHeroEntryFieldsProps | null {
  if (!entry || !entry.fields) {
    return null
  }

  const fields = entry.fields as {
    title?: string
    subtitle?: string | { text?: string }
    buttonPrimaryPreLabel?: string
    buttonPrimaryLabel?: string
    buttonPrimaryLink?: string
    buttonSecondaryPreLabel?: string
    buttonSecondaryLabel?: string
    buttonSecondaryLink?: string
    imageLandscape?: ContentfulEntry
    videoLandscape?: ContentfulEntry
    imagePortrait?: ContentfulEntry
    videoPortrait?: ContentfulEntry
  }

  return {
    title: (fields.title as string) || '',
    subtitle: {
      text:
        (typeof fields.subtitle === 'object' && fields.subtitle?.text) || (typeof fields.subtitle === 'string' ? fields.subtitle : '') || ''
    },
    buttonPrimaryPreLabel: fields.buttonPrimaryPreLabel,
    buttonPrimaryLabel: fields.buttonPrimaryLabel,
    buttonPrimaryLink: fields.buttonPrimaryLink,
    buttonSecondaryPreLabel: fields.buttonSecondaryPreLabel,
    buttonSecondaryLabel: fields.buttonSecondaryLabel,
    buttonSecondaryLink: fields.buttonSecondaryLink,
    imageLandscape: mapContentfulAsset(fields.imageLandscape) || ({} as ContentfulMediaProps),
    videoLandscape: mapContentfulAsset(fields.videoLandscape) || ({} as ContentfulMediaProps),
    imagePortrait: mapContentfulAsset(fields.imagePortrait) || ({} as ContentfulMediaProps),
    videoPortrait: mapContentfulAsset(fields.videoPortrait) || ({} as ContentfulMediaProps),
    id: entry.sys.id
  }
}

function mapBannerCta(entry: ContentfulEntry): ContentfulBannerCTAEntryFieldsProps | null {
  if (!entry || !entry.fields) {
    return null
  }

  const fields = entry.fields as {
    title?: string
    subtitle?: string
    buttonLabel?: string
    url?: string
    imageLandscape?: ContentfulEntry | null
    videoLandscape?: ContentfulEntry | null
    imagePortrait?: ContentfulEntry | null
    videoPortrait?: ContentfulEntry | null
    textPosition?: 'left' | 'center'
    titlePosition?: 'first' | 'center'
  }

  return {
    title: fields.title ?? '',
    subtitle: fields.subtitle ?? '',
    buttonLabel: fields.buttonLabel ?? '',
    url: fields.url ?? '',
    imageLandscape: mapContentfulAsset(fields.imageLandscape) || ({} as ContentfulMediaProps),
    videoLandscape: mapContentfulAsset(fields.videoLandscape) || ({} as ContentfulMediaProps),
    imagePortrait: mapContentfulAsset(fields.imagePortrait) || ({} as ContentfulMediaProps),
    videoPortrait: mapContentfulAsset(fields.videoPortrait) || ({} as ContentfulMediaProps),
    textPosition: (fields.textPosition as 'left' | 'center') || 'center',
    titlePosition: (fields.titlePosition as 'first' | 'center') || 'center',
    id: entry.sys.id
  }
}

function mapMissions(entry: ContentfulEntry): ContentfulMissionsListProps {
  if (!entry || !entry.fields || !entry.fields.list) {
    return { list: [] }
  }

  const list = (entry.fields.list as ContentfulEntry[]).map((item: ContentfulEntry) => {
    const fields = item.fields as {
      title?: string
      description?: { description?: string } | string
      buttonLabel?: string
      buttonLink?: string
      buttonType?: 'primary' | 'secondary'
      videoLandscape?: ContentfulEntry | null
      videoPortrait?: ContentfulEntry | null
    }

    return {
      title: fields?.title ?? '',
      description: {
        description:
          (typeof fields?.description === 'object' && fields.description?.description) ||
          (typeof fields?.description === 'string' ? fields.description : '') ||
          ''
      },
      buttonLabel: fields?.buttonLabel ?? '',
      buttonLink: fields?.buttonLink ?? '',
      buttonType: fields?.buttonType || 'primary',
      videoLandscape: mapContentfulAsset(fields?.videoLandscape) || ({} as ContentfulMediaProps),
      videoPortrait: mapContentfulAsset(fields?.videoPortrait) || ({} as ContentfulMediaProps),
      id: item.sys?.id || ''
    }
  })

  return { list }
}

function mapWhatsHot(entry: ContentfulEntry): ContentfulWhatsHotListProps {
  if (!entry || !entry.fields || !entry.fields.list) {
    return { list: [] }
  }

  const list = (entry.fields.list as ContentfulEntry[]).map((item: ContentfulEntry) => {
    const fields = item.fields as {
      title?: string
      subtitle?: { subtitle?: string } | string
      buttonLink?: string
      buttonLabel?: string
      image?: ContentfulEntry | null
    }
    return {
      title: fields?.title ?? '',
      subtitle: {
        subtitle:
          (typeof fields?.subtitle === 'object' && fields.subtitle?.subtitle) ||
          (typeof fields?.subtitle === 'string' ? fields.subtitle : '') ||
          ''
      },
      buttonLink: fields?.buttonLink ?? '',
      buttonLabel: fields?.buttonLabel ?? '',
      image: mapContentfulAsset(fields?.image) || ({} as ContentfulMediaProps),
      id: item.sys?.id || ''
    }
  })

  return { list }
}

function mapTextMarquee(entry: ContentfulEntry): ContentfulTextMarqueeEntry | null {
  if (!entry || !entry.fields) {
    return null
  }

  const textField = entry.fields.text as { text?: string } | string | undefined
  return {
    text: {
      text: (typeof textField === 'object' && textField?.text) || (typeof textField === 'string' ? textField : '') || ''
    },
    id: entry.sys.id
  }
}

function mapSocialProof(entry: ContentfulEntry): ContentfulSocialProofListProps {
  if (!entry || !entry.fields || !entry.fields.list) {
    return { list: [] }
  }

  const list = (entry.fields.list as ContentfulEntry[]).map((item: ContentfulEntry) => {
    const fields = item.fields as {
      type?: 'image' | 'video' | 'quote'
      text?: { text?: string } | string
      userName?: string
      userAvatar?: ContentfulEntry | null
      badgeCount?: number
      quoteBackground?: string
      image?: ContentfulEntry | null
      video?: ContentfulEntry | null
    }
    const type = fields?.type || 'image'
    const base = {
      text: {
        text: (typeof fields?.text === 'object' && fields.text?.text) || (typeof fields?.text === 'string' ? fields.text : '') || ''
      },
      type
    }

    if (type === 'quote') {
      return {
        ...base,
        image: null as never,
        video: null as never,
        userName: fields?.userName ?? '',
        userAvatar: mapContentfulAsset(fields?.userAvatar) || ({} as ContentfulMediaProps),
        badgeCount: null as never,
        quoteBackground: fields?.quoteBackground ?? '',
        type: 'quote' as const
      }
    } else if (type === 'video') {
      return {
        ...base,
        image: null as never,
        video: mapContentfulAsset(fields?.video) || ({} as ContentfulMediaProps),
        userName: null as never,
        userAvatar: null as never,
        badgeCount: null as never,
        quoteBackground: null as never,
        type: 'video' as const
      }
    } else {
      return {
        ...base,
        image: mapContentfulAsset(fields?.image) || ({} as ContentfulMediaProps),
        video: null as never,
        userName: null as never,
        userAvatar: null as never,
        badgeCount: null as never,
        quoteBackground: null as never,
        type: 'image' as const
      }
    }
  }) as ContentfulSocialProofListProps['list']

  return { list }
}

export { mapBannerCta, mapContentfulAsset, mapFaq, mapHero, mapMissions, mapSocialProof, mapTextMarquee, mapWhatsHot }
