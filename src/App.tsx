import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop'
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
const ReportPage = lazy(() => import('./pages/report').then(m => ({ default: m.ReportPage })))
const ReportSuccessPage = lazy(() => import('./pages/report/success').then(m => ({ default: m.ReportSuccessPage })))

// Reels — fullscreen viewer for in-game camera screenshots. Migrated from the standalone
// reels.decentraland.org Gatsby app. Lightweight (no Redux, no Web3) and intentionally
// rendered OUTSIDE the shared <Layout> so the original immersive UX is preserved.
const ReelsEmptyPage = lazy(() => import('./pages/reels').then(m => ({ default: m.ReelsEmptyPage })))
const ReelsImagePage = lazy(() => import('./pages/reels').then(m => ({ default: m.ReelsImagePage })))
const ReelsListPage = lazy(() => import('./pages/reels').then(m => ({ default: m.ReelsListPage })))

// Blog pages — loaded inside DappsShell (Redux Provider required)
const BlogPage = lazy(() => import('./pages/blog/BlogPage').then(m => ({ default: m.BlogPage })))
const PostPage = lazy(() => import('./pages/blog/PostPage').then(m => ({ default: m.PostPage })))
const CategoryPage = lazy(() => import('./pages/blog/CategoryPage').then(m => ({ default: m.CategoryPage })))
const AuthorPage = lazy(() => import('./pages/blog/AuthorPage').then(m => ({ default: m.AuthorPage })))
const BlogSearchPage = lazy(() => import('./pages/blog/SearchPage').then(m => ({ default: m.SearchPage })))
const PreviewPage = lazy(() => import('./pages/blog/PreviewPage').then(m => ({ default: m.PreviewPage })))
const BlogSignInRedirect = lazy(() => import('./pages/blog/SignInRedirect').then(m => ({ default: m.SignInRedirect })))

// Lazy-loaded for /whats-on and /blog routes only. Contains Redux Provider.
// No Web3 providers — auth uses localStorage identity via useAuthIdentity.
const DappsShell = lazy(() => import('./shells/DappsShell').then(m => ({ default: m.DappsShell })))

const WhatsOnHomePage = lazy(() => import('./pages/whats-on/HomePage').then(m => ({ default: m.HomePage })))
const CreateEventPage = lazy(() => import('./pages/whats-on/CreateEventPage').then(m => ({ default: m.CreateEventPage })))
const WhatsOnLayout = lazy(() => import('./pages/whats-on/WhatsOnLayout').then(m => ({ default: m.WhatsOnLayout })))
const PendingEventsPage = lazy(() => import('./pages/whats-on/PendingEventsPage').then(m => ({ default: m.PendingEventsPage })))
const UsersAdminPage = lazy(() => import('./pages/whats-on/UsersAdminPage').then(m => ({ default: m.UsersAdminPage })))
const LegacyHangoutRedirect = lazy(() => import('./pages/whats-on/LegacyHangoutRedirect').then(m => ({ default: m.LegacyHangoutRedirect })))
const LegacyWhatsOnRedirect = lazy(() => import('./pages/whats-on/LegacyWhatsOnRedirect').then(m => ({ default: m.LegacyWhatsOnRedirect })))
const LegacyWorldRedirect = lazy(() => import('./pages/whats-on/LegacyWorldRedirect').then(m => ({ default: m.LegacyWorldRedirect })))

// Social pages — community detail. Heavy route (Redux + RTK Query). Auth via
// localStorage identity (no Web3 providers); CTAs gated on useAuthIdentity.
const CommunityDetailPage = lazy(() => import('./pages/social/CommunityDetailPage').then(m => ({ default: m.CommunityDetailPage })))
const SocialNotFoundPage = lazy(() => import('./pages/social/SocialNotFoundPage').then(m => ({ default: m.SocialNotFoundPage })))

// Jump pages — deep-link handler for decentraland:// launcher. Heavy route (Redux).
const JumpPlacesPage = lazy(() => import('./pages/jump/PlacesPage').then(m => ({ default: m.PlacesPage })))
const JumpEventsPage = lazy(() => import('./pages/jump/EventsPage').then(m => ({ default: m.EventsPage })))
const JumpInvalidEventPage = lazy(() => import('./pages/jump/InvalidPage').then(m => ({ default: () => <m.InvalidPage kind="event" /> })))
const JumpInvalidPlacePage = lazy(() => import('./pages/jump/InvalidPage').then(m => ({ default: () => <m.InvalidPage kind="place" /> })))
const JumpLegacyEventRedirect = lazy(() => import('./pages/jump/LegacyEventRedirect').then(m => ({ default: m.LegacyEventRedirect })))

// Cast pages — LiveKit-based browser streaming (absorbed from decentraland/cast2).
// Heavy tier: lives inside DappsShell + a CastLayout that provides the
// LiveKit + Notification contexts and renders the toast stack.
const CastLayout = lazy(() => import('./pages/cast/CastLayout').then(m => ({ default: m.CastLayout })))
const StreamerPage = lazy(() => import('./pages/cast/StreamerPage').then(m => ({ default: m.StreamerPage })))
const WatcherPage = lazy(() => import('./pages/cast/WatcherPage').then(m => ({ default: m.WatcherPage })))
const CastNotFoundPage = lazy(() => import('./pages/cast/CastNotFoundPage').then(m => ({ default: m.CastNotFoundPage })))

// Storage pages — heavy DappsShell route. Migrated from the standalone storage-service-site.
const StorageRedirectPage = lazy(() => import('./pages/storage/StorageRedirectPage').then(m => ({ default: m.StorageRedirectPage })))
const StorageSelectPage = lazy(() => import('./pages/storage/SelectPage').then(m => ({ default: m.SelectPage })))
const StorageEnvPage = lazy(() => import('./pages/storage/EnvPage').then(m => ({ default: m.EnvPage })))
const StorageScenePage = lazy(() => import('./pages/storage/ScenePage').then(m => ({ default: m.ScenePage })))
const StoragePlayersPage = lazy(() => import('./pages/storage/PlayersPage').then(m => ({ default: m.PlayersPage })))
const StoragePlayerDetailPage = lazy(() => import('./pages/storage/PlayerDetailPage').then(m => ({ default: m.PlayerDetailPage })))
const StorageNotFoundPage = lazy(() => import('./pages/storage/StorageNotFoundPage').then(m => ({ default: m.StorageNotFoundPage })))

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/download_success" element={<DownloadSuccessPage />} />
          <Route path="/invite/:referrer" element={<InvitePage />} />
          {/* Reels routes are fullscreen and bypass Layout/Navbar/Footer.
              ORDER MATTERS: /reels/list/:address must precede /reels/:imageId
              so 'list' is not interpreted as an imageId. */}
          <Route path="/reels" element={<ReelsEmptyPage />} />
          <Route path="/reels/list/:address" element={<ReelsListPage />} />
          <Route path="/reels/:imageId" element={<ReelsImagePage />} />
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
            <Route path="/report" element={<ReportPage />} />
            <Route path="/report/success" element={<ReportSuccessPage />} />
            <Route path="/report/players" element={<Navigate to="/report" replace />} />
            <Route path="/sign-in" element={<SignInRedirect />} />
            {/* Retro-compat for the standalone events/places sites — redirect into /whats-on
                with the deep-link params (id / position / world) it already consumes.
                The wildcard fallbacks below catch any unknown legacy subpath (e.g. /events/listing)
                so external shares keep landing on /whats-on instead of falling through to the SPA
                catchall and bouncing to /. Each redirect fires a Segment event so we can sunset
                these routes when the traffic dries up. */}
            <Route path="/events/event" element={<LegacyWhatsOnRedirect origin="events" />} />
            <Route path="/events" element={<LegacyWhatsOnRedirect origin="events" />} />
            <Route path="/events/*" element={<LegacyWhatsOnRedirect origin="events" />} />
            <Route path="/places/world" element={<LegacyWorldRedirect />} />
            <Route path="/places/place" element={<LegacyWhatsOnRedirect origin="places" />} />
            <Route path="/places" element={<LegacyWhatsOnRedirect origin="places" />} />
            <Route path="/places/*" element={<LegacyWhatsOnRedirect origin="places" />} />
            {/* DappsShell provides Redux Provider via Outlet.
                NOTE: /blog/* is no longer gated behind Env !== PRODUCTION as it was
                with the federated RemoteLoader. During PR1 it serves a placeholder
                in every environment; PR3 lands the real blog routes. If blog must
                stay dev/stg-only at any point, reintroduce a getEnv() check here. */}
            <Route element={<DappsShell />}>
              <Route element={<WhatsOnLayout />}>
                <Route path="/whats-on" element={<WhatsOnHomePage />} />
                <Route path="/whats-on/new-hangout" element={<CreateEventPage />} />
                <Route path="/whats-on/edit-hangout/:eventId" element={<CreateEventPage />} />
                {/* Legacy aliases — preserve query string + location state. */}
                <Route path="/whats-on/new-event" element={<LegacyHangoutRedirect />} />
                <Route path="/whats-on/edit-event/:eventId" element={<LegacyHangoutRedirect />} />
                <Route path="/whats-on/admin/pending-events" element={<PendingEventsPage />} />
                <Route path="/whats-on/admin/users" element={<UsersAdminPage />} />
              </Route>
              <Route path="/jump" element={<JumpPlacesPage />} />
              <Route path="/jump/places" element={<JumpPlacesPage />} />
              <Route path="/jump/places/invalid" element={<JumpInvalidPlacePage />} />
              <Route path="/jump/events" element={<JumpEventsPage />} />
              <Route path="/jump/events/invalid" element={<JumpInvalidEventPage />} />
              {/* Legacy singular `/jump/event` URL — prod still uses it (e.g. /jump/event?position=0,5).
                  Preserves query params via a tiny component that reads useLocation(). */}
              <Route path="/jump/event" element={<JumpLegacyEventRedirect />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/preview" element={<PreviewPage />} />
              <Route path="/blog/search" element={<BlogSearchPage />} />
              <Route path="/blog/sign-in" element={<BlogSignInRedirect />} />
              <Route path="/blog/author/:authorSlug" element={<AuthorPage />} />
              <Route path="/blog/:categorySlug" element={<CategoryPage />} />
              <Route path="/blog/:categorySlug/:postSlug" element={<PostPage />} />
              <Route path="/cast" element={<CastLayout />}>
                {/* `/cast` (no trailing path) is not a deep link from gatekeeper, so
                    treat it as not-found rather than a landing. The catch-all below
                    only matches non-empty children, so we need an explicit index. */}
                <Route index element={<CastNotFoundPage />} />
                <Route path="s/:token" element={<StreamerPage />} />
                <Route path="s/streaming" element={<StreamerPage />} />
                <Route path="w/:worldName/parcel/:parcel" element={<WatcherPage />} />
                <Route path="w/:location" element={<WatcherPage />} />
                <Route path="*" element={<CastNotFoundPage />} />
              </Route>
              <Route path="/storage" element={<StorageRedirectPage />} />
              <Route path="/storage/select" element={<StorageSelectPage />} />
              <Route path="/storage/env" element={<StorageEnvPage />} />
              <Route path="/storage/scene" element={<StorageScenePage />} />
              <Route path="/storage/players" element={<StoragePlayersPage />} />
              <Route path="/storage/players/:address" element={<StoragePlayerDetailPage />} />
              <Route path="/storage/*" element={<StorageNotFoundPage />} />
              <Route path="/social/communities/:id" element={<CommunityDetailPage />} />
              <Route path="/social/*" element={<SocialNotFoundPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export { App }
