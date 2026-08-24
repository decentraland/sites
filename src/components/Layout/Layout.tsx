import { Suspense, lazy, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAnalytics } from '@dcl/hooks'
const LandingFooter = lazy(() => import('../LandingFooter').then(m => ({ default: m.LandingFooter })))
import { LandingNavbarConnected } from '../LandingNavbar'
import { isPageTrackingExempt } from './Layout.helpers'
import type { LayoutProps } from './Layout.types'
import { CreatorsField, FooterFallback } from './Layout.styled'

// eslint-disable-next-line react/prop-types
const Layout: React.FC<LayoutProps> = ({ children, withNavbar = true, withFooter = true }) => {
  const location = useLocation()
  const { isInitialized: isAnalyticsInitialized, page } = useAnalytics()
  useEffect(() => {
    if (!isAnalyticsInitialized) return
    if (isPageTrackingExempt(location.pathname)) return
    page(location.pathname)
  }, [isAnalyticsInitialized, location.pathname, page])

  const isCreatorsPage = location.pathname.replace(/\/+$/, '') === '/create'

  return (
    <div>
      {withNavbar && (
        <>
          <LandingNavbarConnected isLandingPage={location.pathname === '/'} isCreatorsPage={isCreatorsPage} />
          {isCreatorsPage && <CreatorsField aria-hidden data-testid="creators-field" />}
        </>
      )}
      {/* Layout owns the single <main> landmark for every wrapped route. Layout-less
          routes (/download, /reels, /invite) must provide their own landmark and
          must never be nested under <Layout /> to avoid invalid nested <main>. */}
      <main>{children ?? <Outlet />}</main>
      {withFooter && (
        <Suspense fallback={<FooterFallback />}>
          <LandingFooter />
        </Suspense>
      )}
    </div>
  )
}

export { Layout }
