import { Suspense, lazy, memo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import type { Profile } from 'dcl-catalyst-client/dist/client/specs/lambdas-client'
import { useAsyncMemo, useTranslation } from '@dcl/hooks'
import { EthAddress } from '@dcl/schemas/dist/misc'
import { useDesktopMediaQuery } from 'decentraland-ui2'
import { InviteHero } from '../../components/Invite/InviteHero/InviteHero'
import { LandingFooter } from '../../components/LandingFooter'
import { getEnv } from '../../config/env'
import { INVITE_HERO_MEDIA, INVITE_SECOND_HERO_MEDIA } from '../../data/inviteContent'
import { usePageView } from '../../hooks/usePageView'
import { SectionViewedTrack } from '../../modules/segment'

const InviteFaqs = lazy(() => import('../../components/Invite/InviteFaqs/InviteFaqs').then(m => ({ default: m.InviteFaqs })))

const FETCH_TIMEOUT_MS = 5000

type ResolvedReferrer = {
  /** Referrer wallet, lowercased. Drives the `referrer` param on the auth URL. */
  address: string | null
  /** Catalyst profile, only used to render the inviter's name and avatar. */
  profile: Profile | null
}

const EMPTY_REFERRER: ResolvedReferrer = { address: null, profile: null }

async function resolveReferrer(referrer: string): Promise<ResolvedReferrer> {
  const peerUrl = getEnv('PEER_URL') || 'https://peer.decentraland.org'
  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS)
  let address: string | null = null

  if (EthAddress.validate(referrer)) {
    address = referrer
  } else {
    try {
      const response = await fetch(`${peerUrl}/lambdas/names/${encodeURIComponent(referrer)}/owner`, { signal })
      const data = await response.json()
      if (data?.owner) {
        address = data.owner
      }
    } catch {
      // Name resolution failed
    }
  }

  if (!address) return EMPTY_REFERRER

  // The address is what the referral needs, so keep it even when the profile
  // lookup fails. Deriving it back from `profile.avatars[0].ethAddress` dropped
  // the attribution for every referrer without a deployed profile (and on any
  // catalyst timeout), sending the visitor to auth with no `referrer` param.
  const resolved: ResolvedReferrer = { address: address.toLowerCase(), profile: null }

  try {
    const response = await fetch(`${peerUrl}/lambdas/profiles/${resolved.address}`, { signal })
    const data = await response.json()
    return { ...resolved, profile: data ?? null }
  } catch {
    return resolved
  }
}

function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    const metaDesc = document.querySelector('meta[name="description"]')
    const prevDesc = metaDesc?.getAttribute('content') || ''
    if (metaDesc) {
      metaDesc.setAttribute('content', description)
    }

    const ogTitle = document.querySelector('meta[property="og:title"]')
    const prevOgTitle = ogTitle?.getAttribute('content') || ''
    if (ogTitle) {
      ogTitle.setAttribute('content', title)
    }

    const ogDesc = document.querySelector('meta[property="og:description"]')
    const prevOgDesc = ogDesc?.getAttribute('content') || ''
    if (ogDesc) {
      ogDesc.setAttribute('content', description)
    }

    return () => {
      document.title = prevTitle
      if (metaDesc) metaDesc.setAttribute('content', prevDesc)
      if (ogTitle) ogTitle.setAttribute('content', prevOgTitle)
      if (ogDesc) ogDesc.setAttribute('content', prevOgDesc)
    }
  }, [title, description])
}

const InvitePage = memo(() => {
  const { referrer = '' } = useParams<{ referrer: string }>()
  const isDesktop = useDesktopMediaQuery()
  const { t } = useTranslation()

  const [resolvedReferrer, resolvedReferrerStatus] = useAsyncMemo(async () => {
    if (!referrer) return EMPTY_REFERRER
    return resolveReferrer(referrer)
  }, [referrer])

  useDocumentMeta(t('page_invite.social.title'), t('page_invite.social.description'))

  // Invite is a Layout-less route, so it never gets the automatic page() that
  // Layout fires for wrapped routes. Restores the invite pageview lost in the
  // Gatsby→SPA migration (the warehouse's invite funnel reads FCT_PAGEVIEWS for
  // /invite paths).
  usePageView()

  return (
    <>
      <InviteHero
        key="invite-first-hero"
        title={t('page_invite.hero.title')}
        subtitle={t('page_invite.hero.subtitle')}
        buttonLabel={t('page_invite.hero.button_label')}
        media={INVITE_HERO_MEDIA}
        referrer={resolvedReferrer?.profile ?? null}
        referrerAddress={resolvedReferrer?.address ?? null}
        eventPlace={SectionViewedTrack.INVITE_FIRST_HERO}
        isDesktop={isDesktop}
        isLoading={resolvedReferrerStatus.loading}
      />
      <InviteHero
        key="invite-second-hero"
        title={t('page_invite.second_hero.title')}
        subtitle={t('page_invite.second_hero.subtitle')}
        buttonLabel={t('page_invite.second_hero.button_label')}
        media={INVITE_SECOND_HERO_MEDIA}
        referrer={resolvedReferrer?.profile ?? null}
        referrerAddress={resolvedReferrer?.address ?? null}
        eventPlace={SectionViewedTrack.INVITE_SECOND_HERO}
        isDesktop={isDesktop}
        isSecondaryHero
        isLoading={resolvedReferrerStatus.loading}
      />
      <Suspense fallback={null}>
        <InviteFaqs />
      </Suspense>
      <LandingFooter />
    </>
  )
})

export { InvitePage }
