import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RemoteLoader } from './components/RemoteLoader'
import { BrandTerms } from './pages/brand'
import { ContentPolicy } from './pages/content'
import { DownloadPage } from './pages/download'
import { CodeOfEthics } from './pages/ethics'
import { IndexPage } from './pages/index.tsx'
import { PrivacyPolicy } from './pages/privacy'
import { ReferralTerms } from './pages/referral-terms'
import { RewardsTerms } from './pages/rewards-terms'
import { SecurityPage } from './pages/security'
import { SignInRedirect } from './pages/SignInRedirect'
import { TermsOfUse } from './pages/terms'

const DownloadSuccessPage = lazy(() => import('./pages/DownloadSuccess').then(m => ({ default: m.DownloadSuccess })))

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/download" element={<DownloadPage />} />
        <Route
          path="/download_success"
          element={
            <Suspense fallback={null}>
              <DownloadSuccessPage />
            </Suspense>
          }
        />
        <Route element={<Layout />}>
          <Route path="/" element={<IndexPage />} />
          <Route path="/brand" element={<BrandTerms />} />
          <Route path="/content" element={<ContentPolicy />} />
          <Route path="/ethics" element={<CodeOfEthics />} />
          <Route path="/rewards-terms" element={<RewardsTerms />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/referral-terms" element={<ReferralTerms />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/sign-in" element={<SignInRedirect />} />
          <Route path="/whats-on/*" element={<RemoteLoader name="whats-on" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export { App }
