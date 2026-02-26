import type { ContentfulEntry } from './contentful.types'
import type {
  ContentfulBannerCTAEntryFieldsProps,
  ContentfulCreatorsConnectListProps,
  ContentfulCreatorsCreateListProps,
  ContentfulCreatorsHeroEntryFieldsProps,
  ContentfulCreatorsLearnListProps,
  ContentfulCreatorsWhyListProps,
  ContentfulFaqEntriesProps,
  ContentfulHeroEntryFieldsProps,
  ContentfulMediaProps,
  ContentfulMissionsListProps,
  ContentfulSocialProofListProps,
  ContentfulTextMarqueeEntry,
  ContentfulWhatsHotListProps
} from './landing.types'

function mapContentfulAsset(asset: ContentfulEntry | null | undefined): ContentfulMediaProps | null {
  if (!asset || !asset.fields || !asset.fields.file) {
    return null
  }

  const file = asset.fields.file as {
    url?: string
    contentType?: string
    details?: { image?: { width?: number; height?: number } }
  }

  return {
    url: file.url || '',
    mimeType: file.contentType || '',
    width: file.details?.image?.width || 0,
    height: file.details?.image?.height || 0
  }
}

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

function mapFaq(entry: ContentfulEntry): ContentfulFaqEntriesProps {
  if (!entry || !entry.fields || !entry.fields.list) {
    return { list: [] }
  }

  const list = (entry.fields.list as ContentfulEntry[]).map((item: ContentfulEntry) => {
    const fields = item.fields as {
      question?: { text?: string } | string
      answer?: { raw?: string } | string
    }

    const questionText =
      (typeof fields?.question === 'object' && fields.question?.text) || (typeof fields?.question === 'string' ? fields.question : '') || ''

    const answerField = fields?.answer
    let answerRaw = ''
    if (typeof answerField === 'string') {
      answerRaw = answerField
    } else if (answerField && typeof answerField === 'object') {
      const af = answerField as { raw?: string; nodeType?: string }
      if (typeof af.raw === 'string') {
        answerRaw = af.raw
      } else if (af.nodeType) {
        answerRaw = JSON.stringify(answerField)
      }
    }

    return {
      question: { text: questionText },
      answer: { raw: answerRaw }
    }
  })

  return { list }
}

function mapRichTextToRaw(field: unknown): { raw: string } {
  if (!field) return { raw: '' }
  const f = field as { raw?: string; nodeType?: string }
  if (typeof f.raw === 'string') {
    return { raw: f.raw }
  }
  if (f.nodeType) {
    return { raw: JSON.stringify(field) }
  }
  return { raw: '' }
}

function mapCreatorsHero(entry: ContentfulEntry): ContentfulCreatorsHeroEntryFieldsProps | null {
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

function mapCreatorsWhy(entry: ContentfulEntry): ContentfulCreatorsWhyListProps {
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

function mapCreatorsCreate(entry: ContentfulEntry): ContentfulCreatorsCreateListProps {
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

function mapCreatorsConnect(entry: ContentfulEntry): ContentfulCreatorsConnectListProps {
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

function mapCreatorsLearn(entry: ContentfulEntry): ContentfulCreatorsLearnListProps {
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

export {
  mapBannerCta,
  mapContentfulAsset,
  mapCreatorsConnect,
  mapCreatorsCreate,
  mapCreatorsHero,
  mapCreatorsLearn,
  mapCreatorsWhy,
  mapFaq,
  mapHero,
  mapMissions,
  mapSocialProof,
  mapTextMarquee,
  mapWhatsHot
}
