import { ContentfulHeroEntryFieldsProps } from '../../../features/landing/landing.types'

type HeroProps = ContentfulHeroEntryFieldsProps & {
  index?: number
  children?: React.ReactNode
}

type HeroComponentProps = {
  hero: HeroProps
  isDesktop: boolean
  hideNavbar: boolean
  isLoggedIn: boolean
  isLoading: boolean
}

export type { HeroProps, HeroComponentProps }
