import type { Profile } from 'dcl-catalyst-client/dist/client/specs/lambdas-client'
import type { InviteHeroMedia } from '../../../data/inviteContent'

type InviteHeroProps = {
  title: string
  subtitle: string
  buttonLabel: string
  media: InviteHeroMedia
  eventPlace: string
  referrer: Profile | null
  referrerAddress: string | null
  isDesktop: boolean
  isSecondaryHero?: boolean
  /** The inviter's name/avatar are still loading (needs the catalyst profile). */
  isLoading?: boolean
  /** The referrer address is still unknown, so the CTA has no `referrer` to carry yet. */
  isReferrerResolving?: boolean
}

export type { InviteHeroProps }
