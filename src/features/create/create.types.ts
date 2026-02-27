interface ContentfulMediaProps {
  url: string
  mimeType: string
  width: number
  height: number
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
  ContentfulMediaProps
}
