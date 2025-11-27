interface ContentfulMediaProps {
  url: string
  mimeType: string
  width: number
  height: number
}

interface ContentfulHeroEntryFieldsProps {
  title: string
  subtitle: {
    text: string
  }
  buttonPrimaryPreLabel?: string
  buttonPrimaryLabel?: string
  buttonPrimaryLink?: string
  buttonSecondaryPreLabel?: string
  buttonSecondaryLabel?: string
  buttonSecondaryLink?: string
  imageLandscape: ContentfulMediaProps
  videoLandscape: ContentfulMediaProps
  imagePortrait: ContentfulMediaProps
  videoPortrait: ContentfulMediaProps
  id: string
}

interface ContentfulBannerCTAEntryFieldsProps {
  title: string
  subtitle: string
  buttonLabel: string
  url: string
  imageLandscape: ContentfulMediaProps
  videoLandscape: ContentfulMediaProps
  imagePortrait: ContentfulMediaProps
  videoPortrait: ContentfulMediaProps
  textPosition: 'left' | 'center'
  titlePosition: 'first' | 'center'
  id: string
}

interface ContentfulMissionsEntriesProps {
  title: string
  description: {
    description: string
  }
  buttonLabel: string
  buttonLink: string
  buttonType: 'primary' | 'secondary'
  videoLandscape: ContentfulMediaProps
  videoPortrait: ContentfulMediaProps
  id: string
}

interface ContentfulMissionsListProps {
  list: ContentfulMissionsEntriesProps[]
}

interface ContentfulWhatsHotEntriesProps {
  title: string
  subtitle: {
    subtitle: string
  }
  buttonLink: string
  buttonLabel: string
  image: ContentfulMediaProps
  id: string
}

interface ContentfulWhatsHotListProps {
  list: ContentfulWhatsHotEntriesProps[]
}

interface ContentfulTextMarqueeEntry {
  text: {
    text: string
  }
  id: string
}

interface ContentfulSocialProofImageEntryFieldsProps {
  image: ContentfulMediaProps
  video: never
  text: {
    text: string
  }
  userName: never
  userAvatar: never
  badgeCount: never
  quoteBackground: never
  type: 'image'
}

interface ContentfulSocialProofVideoEntryFieldsProps {
  image: never
  video: ContentfulMediaProps
  text: {
    text: string
  }
  userName: never
  userAvatar: never
  badgeCount: never
  quoteBackground: never
  type: 'video'
}

interface ContentfulSocialProofQuoteEntryFieldsProps {
  image: never
  video: never
  text: {
    text: string
  }
  userName: string
  userAvatar: ContentfulMediaProps
  quoteBackground: string
  type: 'quote'
}

interface ContentfulSocialProofListProps {
  list:
    | ContentfulSocialProofImageEntryFieldsProps[]
    | ContentfulSocialProofVideoEntryFieldsProps[]
    | ContentfulSocialProofQuoteEntryFieldsProps[]
}

interface ContentfulFaqEntriesProps {
  list: {
    question: {
      text: string
    }
    answer: {
      raw: string
    }
  }[]
}

interface ContentfulLandingContentProps {
  hero: ContentfulHeroEntryFieldsProps
  missions: ContentfulMissionsListProps
  faq: ContentfulFaqEntriesProps
  createAvatarBanner: ContentfulBannerCTAEntryFieldsProps
  startExploringBanner: ContentfulBannerCTAEntryFieldsProps
  whatsHot: ContentfulWhatsHotListProps
  textMarquee: ContentfulTextMarqueeEntry
  socialProof: ContentfulSocialProofListProps
}

export type {
  ContentfulBannerCTAEntryFieldsProps,
  ContentfulFaqEntriesProps,
  ContentfulHeroEntryFieldsProps,
  ContentfulLandingContentProps,
  ContentfulMediaProps,
  ContentfulMissionsEntriesProps,
  ContentfulMissionsListProps,
  ContentfulSocialProofImageEntryFieldsProps,
  ContentfulSocialProofListProps,
  ContentfulSocialProofQuoteEntryFieldsProps,
  ContentfulSocialProofVideoEntryFieldsProps,
  ContentfulTextMarqueeEntry,
  ContentfulWhatsHotEntriesProps,
  ContentfulWhatsHotListProps
}
