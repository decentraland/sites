import { Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RouteErrorBoundary } from './components/ErrorBoundary'
import { ScrollToTop } from './components/ScrollToTop'
import { lazyWithRetry } from './utils/lazyWithRetry'

// IndexPage is the homepage hero + below-fold sections. Keeping it lazy means
// /whats-on, /blog/*, and every legal page never download the homepage bundle.
// On `/` the prerendered hero shell paints as LCP before this chunk arrives,
// so the lazy split is invisible to users hitting the homepage cold.
const IndexPage = lazyWithRetry(() => import('./pages/index.tsx').then(m => ({ default: m.IndexPage })))

// Layout imports Navbar from decentraland-ui2 which pulls in ~1.3MB of MUI.
// Lazy-loading it keeps that JS out of the critical path so the static hero
// shell can paint as LCP without main-thread blocking.
const Layout = lazyWithRetry(() => import('./components/Layout').then(m => ({ default: m.Layout })))

// Route-based code splitting: legal/utility pages are lazy-loaded so they don't
// bloat the main bundle for the landing page (saves ~560 KB of unused JS).
const BrandTerms = lazyWithRetry(() => import('./pages/brand').then(m => ({ default: m.BrandTerms })))
const ContentPolicy = lazyWithRetry(() => import('./pages/content').then(m => ({ default: m.ContentPolicy })))
const CreditsTerms = lazyWithRetry(() => import('./pages/credits-terms').then(m => ({ default: m.CreditsTerms })))
const DownloadPage = lazyWithRetry(() => import('./pages/download').then(m => ({ default: m.DownloadPage })))
const CodeOfEthics = lazyWithRetry(() => import('./pages/ethics').then(m => ({ default: m.CodeOfEthics })))
const PrivacyPolicy = lazyWithRetry(() => import('./pages/privacy').then(m => ({ default: m.PrivacyPolicy })))
const ReferralTerms = lazyWithRetry(() => import('./pages/referral-terms').then(m => ({ default: m.ReferralTerms })))
const RewardsTerms = lazyWithRetry(() => import('./pages/rewards-terms').then(m => ({ default: m.RewardsTerms })))
const SecurityPage = lazyWithRetry(() => import('./pages/security').then(m => ({ default: m.SecurityPage })))
const SignInRedirect = lazyWithRetry(() => import('./pages/SignInRedirect').then(m => ({ default: m.SignInRedirect })))
const TermsOfUse = lazyWithRetry(() => import('./pages/terms').then(m => ({ default: m.TermsOfUse })))
const DownloadSuccessPage = lazyWithRetry(() => import('./pages/DownloadSuccess').then(m => ({ default: m.DownloadSuccess })))
const CreatorHubDownloadPage = lazyWithRetry(() =>
  import('./pages/download/CreatorHubDownload').then(m => ({ default: m.CreatorHubDownload }))
)
const CreatorHubDownloadSuccessPage = lazyWithRetry(() =>
  import('./pages/download/CreatorHubDownloadSuccess').then(m => ({ default: m.CreatorHubDownloadSuccess }))
)
const HelpPage = lazyWithRetry(() => import('./pages/help').then(m => ({ default: m.HelpPage })))
const PlayPage = lazyWithRetry(() => import('./pages/play').then(m => ({ default: m.PlayPage })))
const InvitePage = lazyWithRetry(() => import('./pages/invite/InvitePage').then(m => ({ default: m.InvitePage })))
const CreatePage = lazyWithRetry(() => import('./pages/create').then(m => ({ default: m.CreatePage })))
const DiscordPage = lazyWithRetry(() => import('./pages/discord').then(m => ({ default: m.DiscordPage })))
const PressPage = lazyWithRetry(() => import('./pages/press').then(m => ({ default: m.PressPage })))
const ReportPage = lazyWithRetry(() => import('./pages/report').then(m => ({ default: m.ReportPage })))
const ReportSuccessPage = lazyWithRetry(() => import('./pages/report/success').then(m => ({ default: m.ReportSuccessPage })))

// Email confirmation — fullscreen challenge page reached from Decentraland notification
// emails. Absorbed from the standalone decentraland/account dapp (which served it at
// /account/confirm-email-challenge/:token via its `/account` basename). Lightweight and
// Layout-less (no Redux, no Web3, no auth gate) so the original immersive UX is preserved
// and links in already-sent emails keep working instead of hitting the /account/* not-found.
const ConfirmEmailPage = lazyWithRetry(() => import('./pages/confirm-email').then(m => ({ default: m.ConfirmEmailPage })))

// 404 — fullscreen catch-all for unknown paths. Lightweight and Layout-less
// (no Redux, no Web3, no navbar/footer) so the immersive Figma design renders
// edge to edge. Area-scoped catch-alls (/cast/*, /storage/*, /social/*,
// /account/*) keep their own not-found pages.
const NotFoundPage = lazyWithRetry(() => import('./pages/not-found/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

// Reels — fullscreen viewer for in-game camera screenshots. Migrated from the standalone
// reels.decentraland.org Gatsby app. Lightweight (no Redux, no Web3) and intentionally
// rendered OUTSIDE the shared <Layout> so the original immersive UX is preserved.
const ReelsEmptyPage = lazyWithRetry(() => import('./pages/reels').then(m => ({ default: m.ReelsEmptyPage })))
const ReelsImagePage = lazyWithRetry(() => import('./pages/reels').then(m => ({ default: m.ReelsImagePage })))
const ReelsListPage = lazyWithRetry(() => import('./pages/reels').then(m => ({ default: m.ReelsListPage })))

// Blog pages — loaded inside DappsShell (Redux Provider required)
const BlogPage = lazyWithRetry(() => import('./pages/blog/BlogPage').then(m => ({ default: m.BlogPage })))
const PostPage = lazyWithRetry(() => import('./pages/blog/PostPage').then(m => ({ default: m.PostPage })))
const CategoryPage = lazyWithRetry(() => import('./pages/blog/CategoryPage').then(m => ({ default: m.CategoryPage })))
const AuthorPage = lazyWithRetry(() => import('./pages/blog/AuthorPage').then(m => ({ default: m.AuthorPage })))
const BlogSearchPage = lazyWithRetry(() => import('./pages/blog/SearchPage').then(m => ({ default: m.SearchPage })))
const PreviewPage = lazyWithRetry(() => import('./pages/blog/PreviewPage').then(m => ({ default: m.PreviewPage })))
const BlogSignInRedirect = lazyWithRetry(() => import('./pages/blog/SignInRedirect').then(m => ({ default: m.SignInRedirect })))

// Lazy-loaded for /whats-on and /blog routes only. Contains Redux Provider.
// No Web3 providers — auth uses localStorage identity via useAuthIdentity.
const DappsShell = lazyWithRetry(() => import('./shells/DappsShell').then(m => ({ default: m.DappsShell })))

const WhatsOnHomePage = lazyWithRetry(() => import('./pages/whats-on/HomePage').then(m => ({ default: m.HomePage })))
const CreateEventPage = lazyWithRetry(() => import('./pages/whats-on/CreateEventPage').then(m => ({ default: m.CreateEventPage })))
const WhatsOnLayout = lazyWithRetry(() => import('./pages/whats-on/WhatsOnLayout').then(m => ({ default: m.WhatsOnLayout })))
const PendingEventsPage = lazyWithRetry(() => import('./pages/whats-on/PendingEventsPage').then(m => ({ default: m.PendingEventsPage })))
const UsersAdminPage = lazyWithRetry(() => import('./pages/whats-on/UsersAdminPage').then(m => ({ default: m.UsersAdminPage })))
const LegacyHangoutRedirect = lazyWithRetry(() =>
  import('./pages/whats-on/LegacyHangoutRedirect').then(m => ({ default: m.LegacyHangoutRedirect }))
)
const LegacyWhatsOnRedirect = lazyWithRetry(() =>
  import('./pages/whats-on/LegacyWhatsOnRedirect').then(m => ({ default: m.LegacyWhatsOnRedirect }))
)
const LegacyWorldRedirect = lazyWithRetry(() =>
  import('./pages/whats-on/LegacyWorldRedirect').then(m => ({ default: m.LegacyWorldRedirect }))
)
const RenamedSectionRedirect = lazyWithRetry(() =>
  import('./pages/RenamedSectionRedirect').then(m => ({ default: m.RenamedSectionRedirect }))
)

// Social pages — pre-existing communities detail + section catch-all.
const CommunityDetailPage = lazyWithRetry(() =>
  import('./pages/social/CommunityDetailPage').then(m => ({ default: m.CommunityDetailPage }))
)
const SocialNotFoundPage = lazyWithRetry(() => import('./pages/social/SocialNotFoundPage').then(m => ({ default: m.SocialNotFoundPage })))

// Discover pages — heavy route (Redux + RTK Query). Auth via localStorage identity
// (no Web3 providers); CTAs gated on useAuthIdentity. /discover/* mirrors the
// decentraland.social experience: a unified DISCOVER landing (LIVE NOW + Featured
// + Explore grid with search and category filters), the COMMUNITIES list tab, and
// SCENE detail (place / world deep link with the bevy preview).
const DiscoverLayout = lazyWithRetry(() => import('./components/discover/DiscoverLayout').then(m => ({ default: m.DiscoverLayout })))
const DiscoverHomePage = lazyWithRetry(() => import('./pages/discover/DiscoverHomePage').then(m => ({ default: m.DiscoverHomePage })))
const DiscoverCommunitiesPage = lazyWithRetry(() =>
  import('./pages/discover/DiscoverCommunitiesPage').then(m => ({ default: m.DiscoverCommunitiesPage }))
)
const DiscoverScenePage = lazyWithRetry(() => import('./pages/discover/DiscoverScenePage').then(m => ({ default: m.DiscoverScenePage })))

// Jump pages — deep-link handler for decentraland:// launcher. Heavy route (Redux).
const JumpPlacesPage = lazyWithRetry(() => import('./pages/jump/PlacesPage').then(m => ({ default: m.PlacesPage })))
const JumpEventsPage = lazyWithRetry(() => import('./pages/jump/EventsPage').then(m => ({ default: m.EventsPage })))
const JumpInvalidEventPage = lazyWithRetry(() =>
  import('./pages/jump/InvalidPage').then(m => ({ default: () => <m.InvalidPage kind="event" /> }))
)
const JumpInvalidPlacePage = lazyWithRetry(() =>
  import('./pages/jump/InvalidPage').then(m => ({ default: () => <m.InvalidPage kind="place" /> }))
)
const JumpLegacyEventRedirect = lazyWithRetry(() =>
  import('./pages/jump/LegacyEventRedirect').then(m => ({ default: m.LegacyEventRedirect }))
)

// Cast pages — LiveKit-based browser streaming (absorbed from decentraland/cast2).
// Heavy tier: lives inside DappsShell + a CastLayout that provides the
// LiveKit + Notification contexts and renders the toast stack.
const CastLayout = lazyWithRetry(() => import('./pages/cast/CastLayout').then(m => ({ default: m.CastLayout })))
const StreamerPage = lazyWithRetry(() => import('./pages/cast/StreamerPage').then(m => ({ default: m.StreamerPage })))
const WatcherPage = lazyWithRetry(() => import('./pages/cast/WatcherPage').then(m => ({ default: m.WatcherPage })))
const CastNotFoundPage = lazyWithRetry(() => import('./pages/cast/CastNotFoundPage').then(m => ({ default: m.CastNotFoundPage })))

// Profile pages — absorbed from the standalone profile + account dapps. Heavy route
// (Redux + RTK Query). Auth via localStorage identity (no Web3 providers); CTAs gated
// on useAuthIdentity. Signed mutations use signedFetch.
const ProfilePage = lazyWithRetry(() => import('./pages/profile').then(m => ({ default: m.ProfilePage })))
const ProfileMeRedirect = lazyWithRetry(() => import('./pages/profile').then(m => ({ default: m.ProfileMeRedirect })))
const ProfileAccountsRedirect = lazyWithRetry(() => import('./pages/profile').then(m => ({ default: m.ProfileAccountsRedirect })))

// Storage pages — heavy DappsShell route. Migrated from the standalone storage-service-site.
const StorageRedirectPage = lazyWithRetry(() =>
  import('./pages/storage/StorageRedirectPage').then(m => ({ default: m.StorageRedirectPage }))
)
const StorageSelectPage = lazyWithRetry(() => import('./pages/storage/SelectPage').then(m => ({ default: m.SelectPage })))
const StorageEnvPage = lazyWithRetry(() => import('./pages/storage/EnvPage').then(m => ({ default: m.EnvPage })))
const StorageScenePage = lazyWithRetry(() => import('./pages/storage/ScenePage').then(m => ({ default: m.ScenePage })))
const StoragePlayersPage = lazyWithRetry(() => import('./pages/storage/PlayersPage').then(m => ({ default: m.PlayersPage })))
const StoragePlayerDetailPage = lazyWithRetry(() => import('./pages/storage/PlayerDetailPage').then(m => ({ default: m.PlayerDetailPage })))
const StorageNotFoundPage = lazyWithRetry(() =>
  import('./pages/storage/StorageNotFoundPage').then(m => ({ default: m.StorageNotFoundPage }))
)

// Account Settings — absorbed from the standalone decentraland/account dapp. Heavy route
// (Redux + RTK Query for credits/notifications). Auth via localStorage identity (no Web3
// providers). Public path stays /account/* — the cutover from the standalone dapp is handled
// in definitions once this implementation is functional.
// Per-file lazy imports (not the ./pages/account barrel): a barrel collapses all 7 routes into one
// chunk, so visiting /account/notifications would eagerly pull WalletsPage's web3 tree (wagmi/viem) and
// DeleteAccountPage's auth tree (thirdweb/magic-sdk). Per-file keeps each route's heavy deps on its own.
const AccountLayout = lazyWithRetry(() => import('./pages/account/AccountLayout').then(m => ({ default: m.AccountLayout })))
const AccountIndexRedirect = lazyWithRetry(() => import('./pages/account/AccountLayout').then(m => ({ default: m.AccountIndexRedirect })))
const AccountWalletsPage = lazyWithRetry(() => import('./pages/account/WalletsPage').then(m => ({ default: m.WalletsPage })))
const AccountNotificationsPage = lazyWithRetry(() =>
  import('./pages/account/NotificationsPage').then(m => ({ default: m.NotificationsPage }))
)
const AccountCreditsPage = lazyWithRetry(() => import('./pages/account/CreditsPage').then(m => ({ default: m.CreditsPage })))
// Aliased as AccountSecurityPage: `SecurityPage` is already bound above for the lightweight /security
// legal page. This is the account-scoped Security tab (Magic private-key reveal).
const AccountSecurityPage = lazyWithRetry(() => import('./pages/account/SecurityPage').then(m => ({ default: m.SecurityPage })))
const AccountDeletePage = lazyWithRetry(() => import('./pages/account/DeleteAccountPage').then(m => ({ default: m.DeleteAccountPage })))
const AccountNotFoundPage = lazyWithRetry(() =>
  import('./pages/account/AccountNotFoundPage').then(m => ({ default: m.AccountNotFoundPage }))
)

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* Inside BrowserRouter so the boundary can clear itself on navigation, and
          outside Suspense so a rejected lazy import is caught rather than left to
          unmount the tree into a blank page. */}
      <RouteErrorBoundary>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/download_success" element={<DownloadSuccessPage />} />
            <Route path="/invite/:referrer" element={<InvitePage />} />
            {/* Email confirmation from notification emails. Fullscreen, bypasses Layout.
              The current unified path is /account/confirm-email-challenge/:token; the two
              legacy paths (/account/confirm-email/:token and
              /account/credits-email-confirmed/:token) are kept alive because emails sent by
              the standalone account dapp are still in inboxes. Source is read from the
              `source` query param, falling back to the path. These sit BEFORE the DappsShell
              /account/* catch-all so react-router matches them first. */}
            <Route path="/account/confirm-email-challenge/:token" element={<ConfirmEmailPage />} />
            <Route path="/account/confirm-email/:token" element={<ConfirmEmailPage />} />
            <Route path="/account/credits-email-confirmed/:token" element={<ConfirmEmailPage />} />
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
              <Route path="/credits-terms" element={<CreditsTerms />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/referral-terms" element={<ReferralTerms />} />
              <Route path="/terms" element={<TermsOfUse />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/play" element={<PlayPage />} />
              <Route path="/create" element={<CreatePage />} />
              <Route path="/download/creator-hub" element={<CreatorHubDownloadPage />} />
              <Route path="/download/creator-hub-success" element={<CreatorHubDownloadSuccessPage />} />
              <Route path="/discord" element={<DiscordPage />} />
              <Route path="/press" element={<PressPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/report/success" element={<ReportSuccessPage />} />
              <Route path="/report/players" element={<Navigate to="/report" replace />} />
              <Route path="/sign-in" element={<SignInRedirect />} />
              {/* What's On is now Events at /events, and Discover is now Places at /places. The old
                prefixes redirect with their subpath and query intact, so shared links, bookmarks and
                indexed pages keep resolving. Each redirect fires a Segment event so these routes can
                be sunset once the traffic dries up. */}
              <Route path="/whats-on/*" element={<RenamedSectionRedirect from="/whats-on" to="/events" origin="events" />} />
              <Route path="/whats-on" element={<RenamedSectionRedirect from="/whats-on" to="/events" origin="events" />} />
              <Route path="/discover/*" element={<RenamedSectionRedirect from="/discover" to="/places" origin="places" />} />
              <Route path="/discover" element={<RenamedSectionRedirect from="/discover" to="/places" origin="places" />} />
              {/* Deep links from the standalone events/places sites, which carried their target in the
                query string (id / position / name) rather than the path. Their destination is
                unchanged; only the section path moved under them.
                NOTE: the /events/* and /places/* wildcards that used to backstop unknown legacy
                subpaths are gone. Those prefixes now own real routes and a wildcard here would
                swallow them, so unknown subpaths fall through to each section's own not-found. */}
              <Route path="/events/event" element={<LegacyWhatsOnRedirect origin="events" />} />
              <Route path="/places/world" element={<LegacyWorldRedirect />} />
              <Route path="/places/place" element={<LegacyWhatsOnRedirect origin="places" />} />
              {/* DappsShell provides Redux Provider via Outlet.
                NOTE: /blog/* is no longer gated behind Env !== PRODUCTION as it was
                with the federated RemoteLoader. During PR1 it serves a placeholder
                in every environment; PR3 lands the real blog routes. If blog must
                stay dev/stg-only at any point, reintroduce a getEnv() check here. */}
              <Route element={<DappsShell />}>
                <Route element={<WhatsOnLayout />}>
                  <Route path="/events" element={<WhatsOnHomePage />} />
                  <Route path="/events/new-event" element={<CreateEventPage />} />
                  <Route path="/events/edit-event/:eventId" element={<CreateEventPage />} />
                  {/* Legacy aliases — preserve query string + location state. */}
                  <Route path="/events/new-hangout" element={<LegacyHangoutRedirect />} />
                  <Route path="/events/edit-hangout/:eventId" element={<LegacyHangoutRedirect />} />
                  <Route path="/events/admin/pending-events" element={<PendingEventsPage />} />
                  <Route path="/events/admin/users" element={<UsersAdminPage />} />
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
                {/* Discover — the new explore section (Live Now + Featured + Explore grid,
                  scene preview). Communities LIST is a Discover tab; community DETAIL is
                  the pre-existing /social page below, which list cards link into. */}
                <Route element={<DiscoverLayout />}>
                  <Route path="/places" element={<DiscoverHomePage />} />
                  <Route path="/places/communities" element={<DiscoverCommunitiesPage />} />
                  <Route path="/places/place/:position" element={<DiscoverScenePage kind="place" />} />
                  <Route path="/places/world/:name" element={<DiscoverScenePage kind="world" />} />
                </Route>
                {/* Same generic not-found page serves both section catch-alls. */}
                <Route path="/places/*" element={<SocialNotFoundPage />} />
                <Route path="/social/communities/:id" element={<CommunityDetailPage />} />
                <Route path="/social/*" element={<SocialNotFoundPage />} />
                {/* Profile routes — absorbed from decentraland/profile + decentraland/account dapps.
                  ORDER MATTERS in react-router v7: literal `me` and `accounts` segments come before
                  the `:address` param so they hit their redirects, not the page. */}
                <Route path="/profile" element={<ProfileMeRedirect />} />
                <Route path="/profile/me" element={<ProfileMeRedirect />} />
                <Route path="/profile/me/:tab" element={<ProfileMeRedirect />} />
                {/* Legacy `decentraland/profile` dapp served /profile/accounts/:address — keep shareable
                  links alive by redirecting to the canonical /profile/:address. */}
                <Route path="/profile/accounts/:address" element={<ProfileAccountsRedirect />} />
                <Route path="/profile/accounts/:address/:tab" element={<ProfileAccountsRedirect />} />
                <Route path="/profile/:address" element={<ProfilePage />} />
                <Route path="/profile/:address/:tab" element={<ProfilePage />} />
                {/* Account Settings — absorbed from decentraland/account. Public path /account/*
                  is unchanged; the cutover from the standalone dapp happens in definitions once
                  this is functional. AccountLayout owns the sidebar + auth gate, sections render
                  via <Outlet />. The index redirect lands signed-in users on Wallets. */}
                <Route path="/account" element={<AccountLayout />}>
                  <Route index element={<AccountIndexRedirect />} />
                  <Route path="wallets" element={<AccountWalletsPage />} />
                  <Route path="notifications" element={<AccountNotificationsPage />} />
                  <Route path="credits" element={<AccountCreditsPage />} />
                  <Route path="security" element={<AccountSecurityPage />} />
                  <Route path="delete" element={<AccountDeletePage />} />
                  <Route path="*" element={<AccountNotFoundPage />} />
                </Route>
              </Route>
            </Route>
            {/* NOTE: unknown paths used to silently redirect to `/`. Intentional
              change (2026-07): they now render the fullscreen 404 page (Figma:
              404 Page not found). It sits OUTSIDE <Layout /> (no navbar/footer,
              immersive UX) and `*` ranks below every explicit route, so real
              pages, legacy redirects (/events/*, /places/*) and area-scoped
              catch-alls (/cast/*, /storage/*, /social/*, /account/*) still win. */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </BrowserRouter>
  )
}

export { App }
