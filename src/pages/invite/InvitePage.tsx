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
import { useInviteDirectDownload } from '../../features/invite/invite.flags'
import { getInviterName } from '../../features/invite/invite.helpers'
import { usePageView } from '../../hooks/usePageView'
import { SectionViewedTrack } from '../../modules/segment'
import { storeReferrer } from '../../utils/referrer'
import { timeoutSignal } from '../../utils/timeoutSignal'

const InviteFaqs = lazy(() => import('../../components/Invite/InviteFaqs/InviteFaqs').then(m => ({ default: m.InviteFaqs })))

const FETCH_TIMEOUT_MS = 5000

/**
 * Resolves the referrer wallet, lowercased — the only value the referral needs.
 *
 * Deliberately independent from the profile lookup: when the invite param is
 * already an address this returns without touching the network, so the CTA can
 * carry `referrer` from the very first render. Bundling both lookups meant the
 * address stayed unpublished until the (much slower, purely cosmetic) profile
 * request settled, and the link rendered — and could be clicked — without it.
 */
async function resolveReferrerAddress(referrer: string): Promise<string | null> {
  if (EthAddress.validate(referrer)) return referrer.toLowerCase()

  const peerUrl = getEnv('PEER_URL') || 'https://peer.decentraland.org'

  try {
    const response = await fetch(`${peerUrl}/lambdas/names/${encodeURIComponent(referrer)}/owner`, {
      signal: timeoutSignal(FETCH_TIMEOUT_MS)
    })
    const data = await response.json()
    return data?.owner ? String(data.owner).toLowerCase() : null
  } catch {
    // Name resolution failed — no attribution is possible for this invite.
    return null
  }
}

/** Catalyst profile, only used to render the inviter's name and avatar. */
async function fetchReferrerProfile(address: string): Promise<Profile | null> {
  const peerUrl = getEnv('PEER_URL') || 'https://peer.decentraland.org'

  try {
    const response = await fetch(`${peerUrl}/lambdas/profiles/${address}`, {
      signal: timeoutSignal(FETCH_TIMEOUT_MS)
    })
    const data = await response.json()
    return data ?? null
  } catch {
    // Cosmetic only: a missing profile must never cost the attribution.
    return null
  }
}

/**
 * Keeps the tab title and the meta description in sync with the invite copy.
 *
 * NOTE (2026-08-18): this deliberately no longer writes `og:title` / `og:description`.
 * Open Graph for `/invite/:referrer` belongs to the edge worker (sites-deployer's
 * `OpenGraphInviteRoute`), which resolves the inviter and rewrites the share card
 * before the HTML reaches a crawler — crawlers don't run JS, so the client-side
 * write reached nobody except to leave the hydrated DOM contradicting the card
 * the unfurler had already read. Don't reintroduce it: the fix for a wrong share
 * preview lives in the worker, not here.
 */
function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    const metaDesc = document.querySelector('meta[name="description"]')
    const prevDesc = metaDesc?.getAttribute('content') || ''
    if (metaDesc) {
      metaDesc.setAttribute('content', description)
    }

    return () => {
      document.title = prevTitle
      if (metaDesc) metaDesc.setAttribute('content', prevDesc)
    }
  }, [title, description])
}

const InvitePage = memo(() => {
  const { referrer = '' } = useParams<{ referrer: string }>()
  const isDesktop = useDesktopMediaQuery()
  const { t } = useTranslation()

  const [referrerAddress, referrerAddressStatus] = useAsyncMemo(async () => {
    if (!referrer) return null
    return resolveReferrerAddress(referrer)
  }, [referrer])

  // Runs after the address is known. Only feeds the inviter's name and avatar,
  // so the CTA never waits on it.
  const [referrerProfile, referrerProfileStatus] = useAsyncMemo(async () => {
    if (!referrerAddress) return null
    return fetchReferrerProfile(referrerAddress)
  }, [referrerAddress])

  // Gates the CTA: while true the referrer is not known yet, so navigating would
  // reach auth without the `referrer` param.
  const isReferrerResolving = referrerAddressStatus.loading
  // Gates the inviter's name/avatar, which need the profile too.
  const isProfileLoading = isReferrerResolving || referrerProfileStatus.loading

  // Persist the resolved address so the referrer survives the invite → download
  // navigation even if the query param is lost. Keyed on the accepted address so a
  // stale in-flight resolution can't overwrite a newer one. Gated by the same
  // flag as the CTA: with the flag off nothing is stored (and any previous value
  // is cleared), so the referrer can't leak into the download flow via storage.
  const inviteDirectDownload = useInviteDirectDownload()
  useEffect(() => {
    storeReferrer(inviteDirectDownload ? referrerAddress : null)
  }, [referrerAddress, inviteDirectDownload])

  // Mirrors the share card the worker writes at the edge once the inviter is known,
  // and falls back to the generic invite copy while (or if) the profile never resolves.
  const inviterName = isProfileLoading ? null : getInviterName(referrerProfile)
  useDocumentMeta(
    inviterName ? t('page_invite.social.title_with_name', { name: inviterName }) : t('page_invite.social.title'),
    t('page_invite.social.description')
  )

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
        referrer={referrerProfile ?? null}
        referrerAddress={referrerAddress ?? null}
        eventPlace={SectionViewedTrack.INVITE_FIRST_HERO}
        isDesktop={isDesktop}
        isLoading={isProfileLoading}
        isReferrerResolving={isReferrerResolving}
      />
      <InviteHero
        key="invite-second-hero"
        title={t('page_invite.second_hero.title')}
        subtitle={t('page_invite.second_hero.subtitle')}
        buttonLabel={t('page_invite.second_hero.button_label')}
        media={INVITE_SECOND_HERO_MEDIA}
        referrer={referrerProfile ?? null}
        referrerAddress={referrerAddress ?? null}
        eventPlace={SectionViewedTrack.INVITE_SECOND_HERO}
        isDesktop={isDesktop}
        isSecondaryHero
        isLoading={isProfileLoading}
        isReferrerResolving={isReferrerResolving}
      />
      <Suspense fallback={null}>
        <InviteFaqs />
      </Suspense>
      <LandingFooter />
    </>
  )
})

export { InvitePage }
