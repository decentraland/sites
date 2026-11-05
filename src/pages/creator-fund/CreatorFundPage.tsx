import { Suspense, memo } from 'react'
import { Env } from '@dcl/ui-env'
import { CreatorFundComingSoon } from '../../components/CreatorFund/ComingSoon'
import { getCurrentEnv } from '../../config/env'
import { lazyWithRetry } from '../../utils/lazyWithRetry'
import { LandingFallback } from './CreatorFundPage.styled'

// Its own chunk, so decentraland.org visitors never download the full page.
const CreatorFundLanding = lazyWithRetry(() =>
  import('../../components/CreatorFund/CreatorFundLanding').then(m => ({ default: m.CreatorFundLanding }))
)

// NOTE: environment gate. decentraland.org keeps the coming-soon placeholder until the
// program is announced; every other environment (decentraland.zone, .today, Vercel
// previews, localhost) renders the full page so it can be reviewed. On launch, drop the
// gate and CreatorFundComingSoon, and render CreatorFundLanding everywhere.
const CreatorFundPage = memo(() => {
  if (getCurrentEnv() === Env.PRODUCTION) {
    return <CreatorFundComingSoon />
  }

  return (
    <Suspense fallback={<LandingFallback />}>
      <CreatorFundLanding />
    </Suspense>
  )
})

CreatorFundPage.displayName = 'CreatorFundPage'

export { CreatorFundPage }
