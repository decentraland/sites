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

interface ContentfulCreatorsHeroEntryFieldsProps {
  titleFirstLine: string
  changingWord: string[]
  titleLastLine: string
  subtitle: string
  imageLandscape: ContentfulMediaProps
  videoLandscape: ContentfulMediaProps
  imagePortrait: ContentfulMediaProps
  videoPortrait: ContentfulMediaProps
  id: string
}

interface ContentfulCreatorsWhyEntryProps {
  title: string
  description: string
  image: ContentfulMediaProps
  id: string
}

interface ContentfulCreatorsWhyListProps {
  list: ContentfulCreatorsWhyEntryProps[]
}

interface ContentfulCreatorsCreateEntryProps {
  title: string
  description: string
  image: ContentfulMediaProps
  imageBackground: ContentfulMediaProps
  tab1Title: string
  tab1DescriptionTitle: string
  tab1DescriptionSubTitle: string
  tab1Skills: string[]
  tab1Links: { raw: string }
  tab2Title: string
  tab2DescriptionTitle: string
  tab2DescriptionSubTitle: string
  tab2Skills: string[]
  tab2Links: { raw: string }
  id: string
}

interface ContentfulCreatorsCreateListProps {
  list: ContentfulCreatorsCreateEntryProps[]
}

interface ContentfulCreatorsConnectEntryProps {
  name: string
  description: string
  image: ContentfulMediaProps
  url: string
  id: string
}

interface ContentfulCreatorsConnectListProps {
  list: ContentfulCreatorsConnectEntryProps[]
}

interface ContentfulCreatorsLearnEntryProps {
  title: string
  name: string
  userImage: ContentfulMediaProps
  image: ContentfulMediaProps
  url: string
  date: string
  id: string
}

interface ContentfulCreatorsLearnListProps {
  list: ContentfulCreatorsLearnEntryProps[]
}

export type {
  ContentfulBannerCTAEntryFieldsProps,
  ContentfulCreatorsConnectEntryProps,
  ContentfulCreatorsConnectListProps,
  ContentfulCreatorsCreateEntryProps,
  ContentfulCreatorsCreateListProps,
  ContentfulCreatorsHeroEntryFieldsProps,
  ContentfulCreatorsLearnEntryProps,
  ContentfulCreatorsLearnListProps,
  ContentfulCreatorsWhyEntryProps,
  ContentfulCreatorsWhyListProps,
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
