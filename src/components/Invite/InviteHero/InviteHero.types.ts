import type { Profile } from 'dcl-catalyst-client/dist/client/specs/lambdas-client'
import type { InviteHeroMedia } from '../../../data/inviteContent'

type InviteHeroProps = {
  title: string
  subtitle: string
  buttonLabel: string
  media: InviteHeroMedia
  eventPlace: string
  referrer: Profile | null
  isDesktop: boolean
  isSecondaryHero?: boolean
  isLoading?: boolean
}

export type { InviteHeroProps }
