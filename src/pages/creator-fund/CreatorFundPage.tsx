import { Suspense, memo, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { lazyWithRetry } from '../../utils/lazyWithRetry'
import { LandingFallback } from './CreatorFundPage.styled'

// Browser tab title.
const CREATOR_FUND_TITLE = 'Decentraland Creator Fund'

// Its own chunk, so the rest of the site doesn't download the page.
const CreatorFundLanding = lazyWithRetry(() =>
  import('../../components/CreatorFund/CreatorFundLanding').then(m => ({ default: m.CreatorFundLanding }))
)

// The Creator Fund program page, in every environment. Its own Creator Fund navbar replaces the
// site one; the site footer comes from <Layout />.
const CreatorFundPage = memo(() => {
  useEffect(() => {
    const previous = document.title
    document.title = CREATOR_FUND_TITLE
    return () => {
      document.title = previous
    }
  }, [])

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
