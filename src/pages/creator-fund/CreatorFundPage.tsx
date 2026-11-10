import { Suspense, memo, useEffect } from 'react'
import { Env } from '@dcl/ui-env'
import { CreatorFundComingSoon } from '../../components/CreatorFund/ComingSoon'
import { Layout } from '../../components/Layout'
import { getCurrentEnv } from '../../config/env'
import { lazyWithRetry } from '../../utils/lazyWithRetry'
import { LandingFallback } from './CreatorFundPage.styled'

// Browser tab title, on both the coming-soon view and the full page.
const CREATOR_FUND_TITLE = 'Decentraland Creator Fund'

// Its own chunk, so decentraland.org visitors never download the full page.
const CreatorFundLanding = lazyWithRetry(() =>
  import('../../components/CreatorFund/CreatorFundLanding').then(m => ({ default: m.CreatorFundLanding }))
)

// NOTE: environment gate. decentraland.org keeps the coming-soon placeholder (with the
// site navbar) until the program is announced; every other environment (decentraland.zone,
// .today, Vercel previews, localhost) renders the full page, whose own Creator Fund navbar
// replaces the site one. On launch, drop the gate and CreatorFundComingSoon, and render
// CreatorFundLanding everywhere.
const CreatorFundPage = memo(() => {
  useEffect(() => {
    const previous = document.title
    document.title = CREATOR_FUND_TITLE
    return () => {
      document.title = previous
    }
  }, [])

  if (getCurrentEnv() === Env.PRODUCTION) {
    return (
      <Layout>
        <CreatorFundComingSoon />
      </Layout>
    )
  }

  return (
    <Layout withNavbar={false}>
      <Suspense fallback={<LandingFallback />}>
        <CreatorFundLanding />
      </Suspense>
    </Layout>
  )
})

CreatorFundPage.displayName = 'CreatorFundPage'

export { CREATOR_FUND_TITLE, CreatorFundPage }
