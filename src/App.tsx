import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CenteredBox } from './App.styled.ts'
import { IndexPage } from './pages/index.tsx'

// Layout imports Navbar from decentraland-ui2 which pulls in ~1.3MB of MUI.
// Lazy-loading it keeps that JS out of the critical path so the static hero
// shell can paint as LCP without main-thread blocking.
const Layout = lazy(() => import('./components/Layout').then(m => ({ default: m.Layout })))

// Route-based code splitting: legal/utility pages are lazy-loaded so they don't
// bloat the main bundle for the landing page (saves ~560 KB of unused JS).
const BrandTerms = lazy(() => import('./pages/brand').then(m => ({ default: m.BrandTerms })))
const ContentPolicy = lazy(() => import('./pages/content').then(m => ({ default: m.ContentPolicy })))
const DownloadPage = lazy(() => import('./pages/download').then(m => ({ default: m.DownloadPage })))
const CodeOfEthics = lazy(() => import('./pages/ethics').then(m => ({ default: m.CodeOfEthics })))
const PrivacyPolicy = lazy(() => import('./pages/privacy').then(m => ({ default: m.PrivacyPolicy })))
const ReferralTerms = lazy(() => import('./pages/referral-terms').then(m => ({ default: m.ReferralTerms })))
const RewardsTerms = lazy(() => import('./pages/rewards-terms').then(m => ({ default: m.RewardsTerms })))
const SecurityPage = lazy(() => import('./pages/security').then(m => ({ default: m.SecurityPage })))
const SignInRedirect = lazy(() => import('./pages/SignInRedirect').then(m => ({ default: m.SignInRedirect })))
const TermsOfUse = lazy(() => import('./pages/terms').then(m => ({ default: m.TermsOfUse })))
const DownloadSuccessPage = lazy(() => import('./pages/DownloadSuccess').then(m => ({ default: m.DownloadSuccess })))
const CreatorHubDownloadPage = lazy(() => import('./pages/download/CreatorHubDownload').then(m => ({ default: m.CreatorHubDownload })))
const CreatorHubDownloadSuccessPage = lazy(() =>
  import('./pages/download/CreatorHubDownloadSuccess').then(m => ({ default: m.CreatorHubDownloadSuccess }))
)
const HelpPage = lazy(() => import('./pages/help').then(m => ({ default: m.HelpPage })))
const InvitePage = lazy(() => import('./pages/invite/InvitePage').then(m => ({ default: m.InvitePage })))
const CreatePage = lazy(() => import('./pages/create').then(m => ({ default: m.CreatePage })))
const DiscordPage = lazy(() => import('./pages/discord').then(m => ({ default: m.DiscordPage })))
const PressPage = lazy(() => import('./pages/press').then(m => ({ default: m.PressPage })))

// Lazy-loaded for /explore and /blog routes only. Contains Redux + PersistGate.
// No Web3 providers — auth uses localStorage identity via useAuthIdentity.
const DappsShell = lazy(() => import('./shells/DappsShell').then(m => ({ default: m.DappsShell })))

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/download_success" element={<DownloadSuccessPage />} />
          <Route path="/invite/:referrer" element={<InvitePage />} />
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
            <Route path="/help" element={<HelpPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/download/creator-hub" element={<CreatorHubDownloadPage />} />
            <Route path="/download/creator-hub-success" element={<CreatorHubDownloadSuccessPage />} />
            <Route path="/discord" element={<DiscordPage />} />
            <Route path="/press" element={<PressPage />} />
            <Route path="/sign-in" element={<SignInRedirect />} />
            {/* DappsShell provides Redux + PersistGate via Outlet.
                NOTE: /blog/* is no longer gated behind Env !== PRODUCTION as it was
                with the federated RemoteLoader. During PR1 it serves a placeholder
                in every environment; PR3 lands the real blog routes. If blog must
                stay dev/stg-only at any point, reintroduce a getEnv() check here. */}
            <Route element={<DappsShell />}>
              <Route path="/explore/*" element={<DappsShellPlaceholder name="explore" />} />
              <Route path="/blog/*" element={<DappsShellPlaceholder name="blog" />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

function DappsShellPlaceholder({ name }: { name: string }) {
  return <CenteredBox>{name} — coming soon (pending migration)</CenteredBox>
}

export { App }
