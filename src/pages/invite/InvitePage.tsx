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
import { SectionViewedTrack } from '../../modules/segment'

const InviteFaqs = lazy(() => import('../../components/Invite/InviteFaqs/InviteFaqs').then(m => ({ default: m.InviteFaqs })))

const FETCH_TIMEOUT_MS = 5000

async function resolveReferrerProfile(referrer: string): Promise<Profile | null> {
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

  if (!address) return null

  try {
    const response = await fetch(`${peerUrl}/lambdas/profiles/${address.toLowerCase()}`, { signal })
    const data = await response.json()
    return data ?? null
  } catch {
    return null
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

  const [referrerProfile, referrerProfileStatus] = useAsyncMemo(async () => {
    if (!referrer) return null
    return resolveReferrerProfile(referrer)
  }, [referrer])

  useDocumentMeta(t('page_invite.social.title'), t('page_invite.social.description'))

  return (
    <>
      <InviteHero
        key="invite-first-hero"
        title={t('page_invite.hero.title')}
        subtitle={t('page_invite.hero.subtitle')}
        buttonLabel={t('page_invite.hero.button_label')}
        media={INVITE_HERO_MEDIA}
        referrer={referrerProfile ?? null}
        eventPlace={SectionViewedTrack.INVITE_FIRST_HERO}
        isDesktop={isDesktop}
        isLoading={referrerProfileStatus.loading}
      />
      <InviteHero
        key="invite-second-hero"
        title={t('page_invite.second_hero.title')}
        subtitle={t('page_invite.second_hero.subtitle')}
        buttonLabel={t('page_invite.second_hero.button_label')}
        media={INVITE_SECOND_HERO_MEDIA}
        referrer={referrerProfile ?? null}
        eventPlace={SectionViewedTrack.INVITE_SECOND_HERO}
        isDesktop={isDesktop}
        isSecondaryHero
        isLoading={referrerProfileStatus.loading}
      />
      <Suspense fallback={null}>
        <InviteFaqs />
      </Suspense>
      <LandingFooter />
    </>
  )
})

export { InvitePage }
