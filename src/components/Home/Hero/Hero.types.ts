interface ContentfulMediaProps {
  url: string
  mimeType: string
  width: number
  height: number
}

interface HeroData {
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

interface HeroProps {
  hero: HeroData
  isDesktop: boolean
}

export type { HeroProps, HeroData }
