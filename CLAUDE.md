# Sites

Decentraland's main website. Single Vite SPA that absorbed several standalone dapps: the homepage and legal pages, the download flow, `/whats-on/*` (events), `/blog/*` (CMS posts), `/jump/*` (deep-link handler for the launcher), `/social/*` (communities), `/cast/*` (LiveKit browser streaming), `/storage/*` (storage-service-site), `/reels/*` (in-game camera screenshots), and `/report/*` (community report flow). Module Federation was removed — every absorbed dapp is a native lazy-loaded route group in this repo.

## Architecture: Dual Shell

Routes are split into two tiers to protect homepage Lighthouse performance. A third "Layout-less" group exists for fullscreen experiences that intentionally bypass navbar+footer.

### Lightweight routes (main bundle, no Redux, no Web3)

Inside `<Layout />` (navbar + footer):
`/`, `/brand`, `/content`, `/ethics`, `/rewards-terms`, `/security`, `/privacy`, `/referral-terms`, `/terms`, `/help`, `/create`, `/download/creator-hub`, `/download/creator-hub-success`, `/discord`, `/press`, `/report`, `/report/success`, `/sign-in`.

Outside `<Layout />` (no navbar, no footer — fullscreen UX):
`/download`, `/download_success`, `/invite/:referrer`, `/reels`, `/reels/list/:address`, `/reels/:imageId`. These are placed BEFORE the `<Route element={<Layout />}>` block in `src/App.tsx`. Reels were migrated from the standalone `reels.decentraland.org` Gatsby app and the immersive UX is preserved by keeping them out of the shared layout.

Provider tree (`src/main.tsx`):
`StrictMode` > `DclThemeProvider(darkTheme)` > `LocaleProvider` > `DeferredAnalyticsProvider` > `App > BrowserRouter`.

Data access on lightweight routes uses `useSyncExternalStore`-based clients (see `features/events/events.discovery.ts`, `features/profile/profile.client.ts`). No Redux store mounted for these routes.

### Heavy routes (`DappsShell`, lazy-loaded)

- **What's on**: `/whats-on`, `/whats-on/new-hangout`, `/whats-on/edit-hangout/:eventId`, `/whats-on/admin/pending-events`, `/whats-on/admin/users` (plus legacy `/whats-on/new-event` and `/whats-on/edit-event/:eventId` aliases that redirect into the hangout flow). `/events/*` and `/places/*` legacy paths from the standalone events/places sites redirect into `/whats-on` with deep-link params.
- **Blog**: `/blog`, `/blog/preview`, `/blog/search`, `/blog/sign-in`, `/blog/author/:authorSlug`, `/blog/:categorySlug`, `/blog/:categorySlug/:postSlug`.
- **Jump** (launcher deep-link handler): `/jump`, `/jump/places`, `/jump/places/invalid`, `/jump/events`, `/jump/events/invalid`, plus the `/jump/event` legacy alias used by production.
- **Social** (communities): `/social/communities/:id`, `/social/*` (catch-all not-found).
- **Cast** (LiveKit streaming, absorbed from `decentraland/cast2`): `/cast/s/:token`, `/cast/s/streaming`, `/cast/w/:worldName/parcel/:parcel`, `/cast/w/:location`, plus `/cast` index and `/cast/*` catch-all rendering `CastNotFoundPage`. Cast adds an extra `<CastLayout />` that provides LiveKit + Notification contexts and renders the toast stack.
- **Storage** (storage-service-site): `/storage`, `/storage/select`, `/storage/env`, `/storage/scene`, `/storage/players`, `/storage/players/:address`, plus `/storage/*` not-found.
- **Profile** (rebuild absorbing `profile.decentraland.org` + `account.decentraland.org`): `/profile`, `/profile/me`, `/profile/:address`, `/profile/:address/:tab` plus the `/profile` index. `/profile/me` redirects to the logged-in address via `useAuthIdentity`. The same `ProfileSurface` component renders the standalone page and the in-modal swap. See `docs/profile-migration.md` for the full spec and in-progress phase tracker.

These render as `<Outlet />` children of `src/shells/DappsShell.tsx`. The shell chunk is lazy-imported in `src/App.tsx` via `lazy(() => import('./shells/DappsShell'))` and boots the Redux store, the RTK Query middleware, and the heaviest deps (contentful rich-text renderer, dompurify, `livekit-client` + `@livekit/components-react` for cast) only when one of these routes is navigated to.

**No Web3 providers.** Authentication on heavy routes uses the same localStorage-based `useAuthIdentity` hook as the navbar — whats-on / social / storage sign mutations with `signedFetch(identity)`, blog reads CMS public endpoints, jump/cast can run without identity. No wagmi, magic-sdk, core-web3, or thirdweb — ~580-780KB saved vs. the federated predecessor.

**Boundary rule:** code that runs on lightweight routes (anything reachable from `App.tsx` without going through `<DappsShell />`) must never `import` from `src/shells/`. The lightweight tier covers everything under `src/pages/*` EXCEPT the heavy-route page directories: `src/pages/whats-on/*`, `src/pages/blog/*`, `src/pages/jump/*`, `src/pages/social/*`, `src/pages/cast/*`, `src/pages/storage/*`. The same applies to `src/components/Layout/*`, `src/components/LandingNavbar/*`, `src/components/LandingFooter/*`, and any hook the navbar consumes. The ONLY legitimate reference to `src/shells/` from outside the shell itself is the `lazy()` import in `src/App.tsx`.

## Directory map

| Path                             | Purpose                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                    | Router. Splits routes into Layout-less (reels, download), lightweight (inside `<Layout />`), and heavy (inside `<DappsShell />`).                                                                                                                                                                                                      |
| `src/App.styled.ts`              | Shared `CenteredBox` styled component (used by App-level fallback + DappsShell fallback).                                                                                                                                                                                                                                              |
| `src/main.tsx`                   | Entry point. Mounts the lightweight provider tree.                                                                                                                                                                                                                                                                                     |
| `src/shells/`                    | `DappsShell.tsx` + `store.ts` (+ listener middleware) — lazy-loaded Redux + RTK Query middleware. Bundle-isolated from the main chunk.                                                                                                                                                                                                 |
| `src/pages/`                     | Page components. `whats-on/`, `blog/`, `jump/`, `social/`, `cast/`, `storage/`, `reels/`, `report/` subdirs for the absorbed apps.                                                                                                                                                                                                     |
| `src/pages/index.tsx`            | Landing homepage (hero is prerendered by `scripts/prerender-hero.mjs`).                                                                                                                                                                                                                                                                |
| `src/components/`                | Shared components. Top-level for landing-specific UI. `blog/`, `whats-on/`, `jump/`, `social/`, `cast/`, `storage/`, `Reels/`, `Report/`, `Create/`, `Invite/`, `Support/` subdirs for the absorbed apps and themed sections.                                                                                                          |
| `src/components/Layout/`         | Outlet-based layout. Mounts `LandingNavbar`, renders child route, then `LandingFooter`. Wraps every route EXCEPT the Layout-less group (reels, download, invite).                                                                                                                                                                      |
| `src/components/LandingNavbar/`  | Navbar. Consumes `useWalletAddress` (localStorage) — does NOT require Redux.                                                                                                                                                                                                                                                           |
| `src/components/LandingFooter/`  | Footer. Newsletter + social + legal links.                                                                                                                                                                                                                                                                                             |
| `src/features/events/`           | Everything that hits the Events API. RTK Query endpoints for `/whats-on/*` reads + mutations (`events.client.ts`), admin approve/reject + permission management (`events.admin.client.ts`), and the homepage live-cards data client built on `useSyncExternalStore` (`events.discovery.ts`). Defines `eventsClient` and `adminClient`. |
| `src/features/cms/`              | Everything that hits the CMS (Contentful + cms-server). Blog post / category / author endpoints (`cms.client.ts`), full-text search (`cms.search.client.ts`), helpers, mappers, and the normalized post entity adapter (`cms.slice.ts`). All endpoints inject into `cmsClient`.                                                        |
| `src/features/places/`           | Everything that hits the Places API. RTK Query endpoints for `/jump/*` deep-link resolution (places, events, world coordinates) injected into `placesClient`.                                                                                                                                                                          |
| `src/features/communities/`      | Everything that hits the Social API. RTK Query endpoints + helpers for `/social/communities/*` injected into `socialClient`.                                                                                                                                                                                                           |
| `src/features/cast2/`            | Everything that hits the Cast API. LiveKit streaming endpoints, contexts, comms protocol, peer wrapper, and error→i18n mapping for `/cast/*`. Defines `cast2Client`.                                                                                                                                                                   |
| `src/features/storage/`          | Everything that hits the Storage API + the storage subgraph. Scene/players/assets queries (`storage.client.ts` → `storageClient`) and on-chain ownership lookups (`assets.client.ts` → `subgraphClient`).                                                                                                                              |
| `src/features/reels/`            | Reels camera-screenshot client + helpers. Uses `useSyncExternalStore`-style hooks; reels routes bypass `DappsShell` entirely.                                                                                                                                                                                                          |
| `src/features/profile/`          | Catalyst profile + marketplace catalog + badges + friendship clients. `profile.client.ts` is the lightweight `useSyncExternalStore` lookup used across the site (avatar/name/colour). `profile.wearables.client.ts`, `profile.badges.client.ts`, `profile.social.client.ts` are heavy clients used by the `/profile/*` route group.    |
| `src/components/profile/`        | Profile UI: `ProfileSurface`, `ProfileLayout`, `ProfileHeader`, `ProfileAvatar`, `AvatarRender` (WearablePreview wrapper), `ProfileTabs`, `ProfileModal/*` (modal + host + `useOpenProfileModal` + `ModalProfileNavigationProvider`), `EquippedItemCard`/`NFTGrid`. ProfileSurface accepts an `embedded` prop for in-modal mounts.     |
| `src/features/notifications/`    | `usePageNotifications` hook used by `Layout` (navbar notifications).                                                                                                                                                                                                                                                                   |
| `src/features/report/`           | Helpers + types for `/report` form. Lightweight (no RTK Query).                                                                                                                                                                                                                                                                        |
| `src/services/cmsClient.ts`      | RTK Query base — `cmsClient` (Contentful + cms-server search). Empty endpoints; injected from `features/cms/`. See "RTK Query split" below.                                                                                                                                                                                            |
| `src/services/cast2Client.ts`    | RTK Query base for cast: signed-fetch baseQuery, anonymous + token-in-URL flow.                                                                                                                                                                                                                                                        |
| `src/services/placesClient.ts`   | RTK Query base for places deep-link resolution (decentraland-places API).                                                                                                                                                                                                                                                              |
| `src/services/socialClient.ts`   | RTK Query base for social/communities (decentraland-social API).                                                                                                                                                                                                                                                                       |
| `src/services/storageClient.ts`  | RTK Query base for storage-service-site (scene + player metadata).                                                                                                                                                                                                                                                                     |
| `src/services/subgraphClient.ts` | RTK Query base for The Graph subgraph queries used by `/storage/*` ownership checks.                                                                                                                                                                                                                                                   |
| `src/hooks/`                     | `useAuthIdentity`, `useWalletAddress`, `useManaBalances`, `useBlogPageTracking`, paginated-query helpers, infinite-scroll sentinel, deep-link hooks, etc. All localStorage-based — no Redux dependency on the lightweight tier.                                                                                                        |
| `src/config/env/`                | Per-environment JSON (`dev.json`, `stg.json`, `prd.json`). Access via `getEnv('KEY')` from `src/config/env.ts`.                                                                                                                                                                                                                        |
| `src/intl/`                      | Six locale files — `en.json`, `es.json`, `fr.json`, `ja.json`, `ko.json`, `zh.json` — each with all translations merged (landing + every absorbed dapp namespace). When adding a key to `en.json`, add it to ALL five other locales in the same commit. `LocaleContext.tsx` wraps `@dcl/hooks`'s `TranslationProvider`.                |
| `src/modules/`                   | Side-effect wiring: Sentry (`sentry.ts`), Segment/Contentsquare (`DeferredAnalyticsProvider`, `deferredThirdParty.ts`), `segment.types.ts` (event enums).                                                                                                                                                                              |
| `src/shared/blog/`               | Domain types and utilities (dates, slugs, locations) for blog content.                                                                                                                                                                                                                                                                 |
| `src/utils/signedFetch.ts`       | Shared identity-signed fetch. Used by whats-on, social, and storage mutations.                                                                                                                                                                                                                                                         |
| `src/utils/avatarColor.ts`       | Deterministic avatar background color (FNV-1a hash → HSV) mirroring the unity-explorer `NameColorHelper`. Drives every avatar surface — see `avatar-background-color` skill.                                                                                                                                                           |
| `scripts/prebuild.cjs`           | Resolves CDN base URL and writes `.env` before build.                                                                                                                                                                                                                                                                                  |
| `scripts/prerender-hero.mjs`     | Injects static hero HTML + critical CSS into `dist/index.html` post-build (LCP optimization).                                                                                                                                                                                                                                          |
| `api/seo.ts`                     | Vercel serverless function. Injects Open Graph meta tags for `/blog/*` crawlers.                                                                                                                                                                                                                                                       |
| `vercel.json`                    | Rewrites `/blog/*` to `/api/seo?path=...`, everything else to `/index.html`.                                                                                                                                                                                                                                                           |

## RTK Query split (`services/` vs `features/`)

One folder per backend API. Inside each folder, endpoints either inject into a shared base from `src/services/<name>Client.ts` or define their own `createApi`. The whole folder ships in the same lazy chunk.

**`src/services/<name>Client.ts`** — infrastructure. Declares the empty base client (base URL, cache config, tag types, custom signed-fetch baseQuery when needed). No endpoints. Imported by `src/shells/store.ts` to register reducers and middleware. Existing bases: `cmsClient`, `placesClient`, `socialClient`, `cast2Client`, `storageClient`, `subgraphClient`. Two more bases live next to their endpoints rather than in `services/` (legacy shape, both still load via the shell): `eventsClient` (`features/events/events.client.ts`) and `adminClient` (`features/events/events.admin.client.ts`).

**`src/features/<api>/<api>.client.ts`** (and siblings like `<api>.admin.client.ts`, `<api>.search.client.ts`) — business logic. Calls `<base>.injectEndpoints({ endpoints: ... })`. For example, `features/cms/cms.client.ts` injects `getBlogPosts`, `getBlogPost`, `getBlogCategories`, … into `cmsClient`, and `features/cms/cms.search.client.ts` injects the search endpoints into the same `cmsClient`. Same one-folder-per-API pattern for `features/places/`, `features/communities/`, `features/storage/`, etc.

Why the split:

1. **Breaks a circular dep.** `store.ts` imports the base client. Endpoints in `features/blog/blog.client.ts` import `store` for one cache-read optimization (`getPostFromStore`). If the base client lived next to the endpoints, that would cycle. The split keeps the hub (`services/`) free of app-layer imports.
2. **Matches RTK Query's recommended pattern** ([code splitting](https://redux-toolkit.js.org/rtk-query/usage/code-splitting)). The "empty api + inject" idiom scales cleanly with each new dapp.
3. **Keeps the store lean.** `store.ts` doesn't need to import feature endpoint definitions just to register reducers/middleware.

**Naming nit:** `services/blogClient.ts` only hosts `cmsClient` (search now injects into the same client because cms-server `/blog/posts?q=` shares the origin and HTTP cache). The filename is mildly misleading — a future rename to `services/cmsClient.ts` is fine but not urgent.

## Auth flow

- `useWalletAddress()` reads `single-sign-on-*` keys from `localStorage`. Subscribes to MetaMask `accountsChanged` and cross-tab `storage` events. No Web3 provider needed. Sync store pattern (external-store hook) — safe on lightweight routes.
- `useAuthIdentity()` wraps `useWalletAddress`, returns `{ identity, hasValidIdentity, address }`. Identity comes from `localStorageGetIdentity()` (`@dcl/single-sign-on-client`).
- Sign-in: navbar button → redirects to the external `/auth` SSO dapp. On return, identity is in localStorage; hooks pick it up.
- Sign-out: navbar button → `useWalletAddress.disconnect()` clears `single-sign-on-*`, `wagmi*`, `wc@2*`, `dcl_magic_user_email`, `dcl_thirdweb_user_email` from localStorage.
- Explore mutations (create event, toggle attendee) call `signedFetch(url, identity)` from `src/utils/signedFetch.ts`.
- Blog public endpoints don't need identity.

## Performance

- **Hero prerender** (`scripts/prerender-hero.mjs`) — injects a static HTML shell + critical CSS into `dist/index.html` at build time so LCP paints before React mounts.
- **Layout is lazy** — `const Layout = lazy(...)` in `App.tsx`. Keeps `decentraland-ui2`'s Navbar (~1.3MB of MUI) out of the critical path until after hero paint.
- **DappsShell is lazy** — Redux, RTK Query, Contentful renderer, dompurify, livekit-client (`@livekit/components-react`) and the per-dapp endpoint code only load when a user navigates to `/whats-on/*`, `/blog/*`, `/jump/*`, `/social/*`, `/cast/*`, or `/storage/*`.
- **Deferred analytics** — Segment (`DeferredAnalyticsProvider`) and Contentsquare (`scheduleDeferredThirdParty`) activate via `requestIdleCallback` (4s fallback timeout).
- **Manual chunks** — `vite.config.ts` splits `vendor-sentry`, `vendor-schemas` (ajv), `vendor-crypto` (`@dcl/crypto`, `eth-connect`), `vendor-intl`, `vendor-ua`, `vendor-router` for cache stability across releases.

## Blog SEO

`api/seo.ts` is a Vercel serverless function. `vercel.json` rewrites `/blog/:path*` to `/api/seo?path=...`. On request:

1. Function parses the path (post, category, author, search, or unknown).
2. Fetches relevant metadata from `cms-api.decentraland.org/spaces/ea2ybdmmn1kv/environments/master`.
3. Loads the static `dist/index.html` shell, rewrites `og:*` / `twitter:*` / canonical meta tags with the fetched values, and returns.
4. Strict HTML escaping + path sanitization + canonical origin allowlist (`decentraland.org`, `decentraland.zone`, `decentraland.today`).
5. Cache-Control: 1 hour with 14 hour stale-while-revalidate.

## Environment config

All env vars live in `src/config/env/{dev,stg,prd}.json`. Access via `getEnv('KEY')` from `src/config/env.ts`. The `@dcl/ui-env` package auto-selects the right file based on the hostname. Override at runtime with `?env=dev|stg|prd` query param.

Unified CMS origin: all three env files point at `cms-api.decentraland.org` (matches `api/seo.ts` fallback and the vite dev proxy target in `vite.config.ts`). Single origin = shared HTTP cache + ETag revalidation, obsoletes the old redux-persist cache that was removed.

## Common commands

```bash
npm run dev          # Vite dev server (+ /api/cms + /auth proxies)
npm run build        # prebuild + tsc -b + vite build + hero prerender
npm run preview      # Serve dist/ — required to validate prod-only failures (rule 14)
npm test             # Jest, co-located *.spec.ts(x) suites
npm run format       # Prettier
npm run lint:fix     # ESLint
npm run lint:pkg     # package.json lint (silent on success — easy to skip; do not skip)
```

## Adding a lightweight route

1. Create page in `src/pages/my-page/`.
2. Add `lazy(() => import(...))` in `src/App.tsx`.
3. Place the `<Route>` inside `<Route element={<Layout />}>` block, OUTSIDE `<Route element={<DappsShell />}>`. (Only put it BEFORE the Layout block if the page is fullscreen and intentionally bypasses navbar+footer — see reels / download / invite.)
4. Use `useSyncExternalStore`-based clients for data, or co-locate a tiny client under `src/features/` using the same pattern as `features/events/events.discovery.ts`, `features/profile/`, or `features/reels/`.
5. Do NOT import anything from `src/shells/*`, `src/services/*`, or any heavy-tier feature directory: `src/features/cms/*`, `src/features/events/*` (except for `events.discovery.ts`, which is the lightweight homepage data client), `src/features/places/*`, `src/features/communities/*`, `src/features/cast2/*`, `src/features/storage/*`.

## Adding a heavy route

1. Create page in `src/pages/<area>/`. Mirror the existing absorbed-dapp layout: `whats-on/`, `blog/`, `jump/`, `social/`, `cast/`, `storage/`.
2. Add `lazy(() => import(...))` in `src/App.tsx`.
3. Place the `<Route>` INSIDE `<Route element={<DappsShell />}>`. If your area needs an extra Outlet wrapper (LiveKit + Notification contexts for cast, layout chrome for whats-on), add a per-area Layout component and nest the routes under it (see `WhatsOnLayout`, `CastLayout`).
4. If you need Redux state: prefer injecting endpoints into an existing base client (`cmsClient`, `placesClient`, `socialClient`, `cast2Client`, `storageClient`, `subgraphClient`, `eventsClient`, `adminClient`). Only add a new base client under `src/services/<name>Client.ts` (and register the reducer + middleware in `src/shells/store.ts`) when the new domain genuinely doesn't fit any existing one.
5. Never import your feature from lightweight route code.
6. If the page sets `<title>` via Helmet + async data (Contentful, RTK Query, etc.) — call `useBlogPageTracking` from `src/hooks/useBlogPageTracking.ts` and add the route to `Layout`'s page-tracking skip list (`Layout.helpers.ts:isPageTrackingExempt`). See rule 23.
7. **Add the route to the GitHub issue templates.** `.github/ISSUE_TEMPLATE/bug_report.yml` has a `Page / Area` dropdown that explicitly says `Keep options in sync with the routes defined in src/App.tsx`. `.github/ISSUE_TEMPLATE/feature_request.yml` has a sibling `Area` dropdown. Adding a route without updating these means bug reporters can't categorize their issue against the new page.

## Coding conventions

### File placement

- **Hooks**: `src/hooks/use<Name>.ts` + sibling `use<Name>.spec.ts`. Never under `src/features/<domain>/`, even when the hook wraps a feature's RTK Query. Feature barrels (`src/features/<domain>/index.ts`) must not re-export hooks.
- **Styled components**: `<Component>.styled.ts` co-located with `<Component>.tsx`. Inline `sx={...}` only for one-off micro-tweaks; conditional styling with props belongs in `.styled.ts`.
- **Types / interfaces**: `<thing>.types.ts`. Never inline in `.client.ts`, `.helpers.ts`, or logic files.
- **RTK Query**: base client → `src/services/<name>Client.ts` (infra only). Endpoints → `src/features/<domain>/<domain>.client.ts`. See "RTK Query split".
- **Pages**: `src/pages/<route>/`. Heavy routes under `src/pages/{whats-on,blog,jump,social,cast,storage}/`. Layout-less fullscreen routes use the same `src/pages/<area>/` shape but are placed before the `<Layout />` Route block in `src/App.tsx` (`reels`, `download`, `invite`).
- **Signal you're placing a file wrong**: `src/features/<domain>/use<X>.ts`, inline styled bigger than a single `sx`, type inside `.client.ts`. Stop and move it.

### Dependencies

- `npm install`/`npm uninstall` always — never manually edit `package.json` deps.
- `@dcl/*` / `decentraland-*`: caret ranges (`^`). All others: exact (`--save-exact`).
- `npm ci` to install existing deps.

### Styled components

- Import from `decentraland-ui2`: `styled`, `Box`, `Typography`, `keyframes`.
- Object syntax only: `styled(Box)(({ theme }) => ({ ... }))`.
- Theme tokens: `theme.palette.*`, `theme.spacing()`, `theme.breakpoints.*`.
- Separate `*.styled.ts` files. No hardcoded colors — use `dclColors` or theme palette.
- Interactive states on all controls: hover, focus-visible, active, disabled.
- **No `className` props.** Every styled element gets its own dedicated styled component — never style children via descendant `className` selectors like `'& .my-thing'`. If a parent needs to vary by state, expose the variant as a prop on the child styled component (with `shouldForwardProp` to keep it off the DOM). Raw `<div className="...">` inside a `*.styled.ts` selector is the same anti-pattern: lift it into its own `styled('div')(...)`.

### Testing

- Jest + TypeScript. `*.spec.ts(x)` alongside source.
- `describe("when ...")` / `it("should ...")` pattern.
- `beforeEach` for setup, `afterEach` with `jest.resetAllMocks()`.
- React Testing Library: `getByRole` > `getByLabelText` > `getByText`.

### Git

- Branches: `<type>/<description>` (feat, fix, chore, docs, refactor).
- Commits: `<type>: <summary>` — no Co-Authored-By.
- Pre-commit: `npm run format` → `npm run lint:fix` → `npm run build` → `npm test`.

## Pre-PR review

Before running `gh pr create`, self-review the diff against this repo's review bot standards. The bot blocks PRs on P0/P1 findings; catching them here saves a round-trip.

### 1. Run the code-reviewer agent on the diff

Dispatch `pr-review-toolkit:code-reviewer` (or equivalent) on `git diff <base>...HEAD`. Treat any P0/P1 finding as a blocker — fix before pushing.

### 2. Architectural boundary check (P1 failures)

- `src/shells/*` MUST NOT be imported from lightweight route code.
- The only legitimate reference to `src/shells/` from outside is the `lazy(() => import('./shells/DappsShell'))` call in `src/App.tsx`.

### 3. YAGNI check

- Do NOT export helpers with zero consumers in the current PR.
- Do NOT add placeholder reducers. An empty store is `configureStore({ reducer: {} })`.
- Do NOT add props, options, or APIs that no caller uses in the current PR.

### 4. DRY check

- Before creating a new styled component, grep for identical/near-identical ones.
- Before copying a file from a source repo, check whether sites already has an equivalent. Examples: `features/notifications/` already exists — do NOT copy a duplicate.
- Shared utilities that appear in multiple `features/` must be extracted to a canonical location.

### 5. Behavior changes

- Any time you REMOVE a conditional, env gate, feature flag, or route guard: add an inline `// NOTE:` comment documenting the intentional change and when (or whether) the gate should return.

### 6. Test coverage

- New providers/shells/layouts in `src/shells/` or `src/components/Layout/` MUST have at least a smoke test.
- New reducers/RTK Query clients MUST have a test asserting the store builds with the expected `reducerPath` keys.

### 7. Barrel exports

- Re-export ALL public RTK Query hooks from the feature's `index.ts`. A missing hook forces deep imports that break the barrel contract.

### 8. ESLint scope

- NEVER add blanket ignores (e.g. `src/**/*.spec.ts(x)` to top-level `ignores`). Use a scoped `overrides` entry that disables ONLY the specific rules that differ.

### 9. JSON merges + i18n parity

- When merging two JSON files (e.g. `intl/en.json`), verify no duplicate top-level keys:
  ```bash
  node -e 'const j=require("./src/intl/en.json");const k=Object.keys(j);if(new Set(k).size!==k.length)throw new Error("dupe keys")'
  ```
- Adding a translation key to `en.json` MUST add it to all five sibling locales (`es`, `fr`, `ja`, `ko`, `zh`) in the same commit. Missing locales fall back to the raw key, which the Jarvis review bot will flag as P2. Verify with:
  ```bash
  for f in en es fr ja ko zh; do node -e "const j=require('./src/intl/${f}.json'); const v=j.path?.to?.your_key; if(!v) throw new Error('${f}: missing'); console.log('${f}:', v)"; done
  ```

### 10. Error handling

- Do NOT propagate raw server error bodies to UI. Log the raw error and surface a generic message.

### 11. List rendering

- Card/row components rendered inside lists MUST be wrapped in `memo()` for consistency with sibling components.

### 12. Network requests in hot paths

- If a helper makes per-item HTTP requests inside a `.map()` (N+1), check whether the underlying API supports batch queries. Prefer batch endpoints for UI hot paths.

### 13. Navbar clearance (fixed-position navbar)

- `LandingNavbar` is `position: fixed, top: 0`. Heights: 64px mobile, 92px desktop (`theme.breakpoints.up('md')`).
- Every new lazy-loaded route must have minimum top clearance: 64px mobile, 96px desktop. Add padding to the layout/wrapper container:
  ```ts
  const PageContainer = styled(Box)(({ theme }) => ({
    paddingTop: 64,
    [theme.breakpoints.up('md')]: { paddingTop: 96 }
  }))
  ```
- Verify visually with Chrome DevTools MCP after adding or editing a route.

### 14. Prod build + dynamic routes

- Vite dev is more permissive than the prod build (transforms CJS inline). Before pushing a PR that adds lazy routes with dynamic params or new CJS-heavy deps (twitter/helmet/etc), run `npm run build && npm run preview` and navigate dynamic route variants. A passing `dev` does NOT guarantee a working prod bundle — e.g. `react-twitter-embed@4.0.4`'s "modern" build contains runtime `require('scriptjs')` that survives Rollup and explodes at runtime.

### 15. CMS origin + vite proxy rewrites

- All CMS_BASE_URL across `config/env/*.json`, `api/seo.ts`, and the `vite.config.ts` dev proxy must point to the same origin (`cms-api.decentraland.org`). Shared HTTP cache and ETag revalidation depend on this.
- The dev proxy `/api/cms` rewrite must substitute the full upstream path (`/spaces/ea2ybdmmn1kv/environments/master`), not just strip the local prefix.

### 16. No module-top-level throws in shell-reachable code

- NEVER throw at module top-level in files imported by `src/shells/store.ts` or any file reachable from the lazy `DappsShell` chunk boundary. One `if (!X) throw` at import-time crashes the ENTIRE lazy chunk load — not just the feature that needs `X`.
- For env-var validation, use a lazy getter that throws only on invocation:
  ```ts
  const getCmsBaseUrl = (): string => {
    const url = getEnv('CMS_BASE_URL')
    if (!url) throw new Error('CMS_BASE_URL is required')
    return url
  }
  // inside endpoint: `url: \`\${getCmsBaseUrl()}/entries?...\``
  ```

### 17. RTK Query — no direct store imports in endpoint files

- RTK Query endpoint files (`features/<domain>/<domain>.client.ts`) must NOT `import { store } from '.../shells/store'` for dispatching inside `transformResponse` or `queryFn`. That creates a circular dep with `store.ts` and breaks tree-shaking guarantees.
- Use RTK Query's `onQueryStarted` lifecycle instead:
  ```ts
  getBlogPosts: builder.query({
    query: args => `posts?${args}`,
    async onQueryStarted(arg, { dispatch, queryFulfilled }) {
      try {
        const { data } = await queryFulfilled
        dispatch(postsUpserted(data.items))
      } catch {
        /* hook surfaces error */
      }
    }
  })
  ```
- A single legitimate read of `store.getState()` for cache-check optimizations is tolerated (see `features/blog/blog.client.ts:getPostFromStore`) as long as the file does NOT dispatch from within RTK Query callbacks.

### 18. RTK Query — no internal cache state access

- NEVER reach into `state.cmsClient.queries` or similar internals via `as any` casts. The shape is undocumented and changes between `@reduxjs/toolkit` minor versions.
- Read cached data through one of:
  - Normalized entity-adapter selectors (preferred — `selectBlogPostById(state, id)`)
  - `cmsClient.endpoints.getBlogPost.select(args)(state)`
  - Generated hooks with `selectFromResult` inside components
- If the data isn't reachable through any of the above, add an `onQueryStarted` that upserts into an entity adapter — then select from there.

### 19-25. Extended rules — see `docs/pre-pr-rules-detail.md`

The following rules ship with code patterns that live in `docs/pre-pr-rules-detail.md` to keep this file under 40k chars. Open that doc when touching any of the areas below.

- **19. XSS sanitization for CMS/search HTML.** Every React innerHTML injection sourced from Contentful, cms-server search, or any external/user-supplied content must go through DOMPurify with a scoped per-source allowlist (`sanitizeX.ts`). Never a generic global sanitizer.
- **20. URL validation — parse + allowlist, never `includes()`.** `new URL()` + hostname `Set` + regex on the extracted ID before interpolating into iframe `src`. `.includes()`/`.endsWith()` is trivially bypassable.
- **21. `package-lock.json` after rebase conflicts.** Never `npm install --package-lock-only` (drops linux platform binaries → CI `npm ci` fails). Always `rm -rf node_modules package-lock.json && npm install`.
- **22. Immutable data in RTK Query cache.** Never mutate objects returned by `queryFn`/`transformResponse`/`updateQueryData`. Build enrichment in a `Map`, then `.map(card => ({ ...card, ...extra }))`.
- **23. Page tracking + Helmet titles.** `usePageTracking(pathname)` races Helmet's async title write — Segment grabs the previous title. Helmet-titled routes (currently `/blog/*`) MUST use `useBlogPageTracking({ name, properties })` and be added to `Layout`'s skip list.
- **24. Props destructuring threshold.** ≤3 props → destructure in the parameter list. ≥4 → take `props` as one arg and destructure in the body. Same for hook/helper option objects. Defaults move with their key into the body.
- **25. No inline `sx` with hardcoded values.** `sx` is allowed only for a single runtime-dynamic value the styled component can't accept as a prop. Hardcoded dimensions/colors/spacing belong in a co-located `*.styled.ts` using theme tokens.

## Profile route group + ui2 local fork

Full spec, status, learnings, and workflows in **`docs/profile-migration.md`**. Read first if you touch anything under `/profile/*`, `src/components/profile/*`, `src/features/profile/*`, or the ui2 submodule.

TL;DR for everywhere else:

- Opening a profile from any heavy route: `useOpenProfileModal()(address)`. Auto-delegates to a parent modal when called inside a `ModalProfileNavigationProvider`; otherwise sets `?profile=<addr>` and `ProfileModalHost` opens a standalone dialog.
- `ProfileSurface` accepts `embedded?: boolean` — strip the outer chrome when mounted inside another dialog. `ProfileModal` passes it so the dialog Paper's brand gradient doesn't get repainted by `ProfileLayout`.
- Always resolve `address → name` via `useCreatorProfile(address)` (same hook used by whats-on).
- Friendship / mutual friends / friends list / block live in `features/profile/profile.social.rpc.ts` (WebSocket via `@dcl/social-rpc-client`). HTTP only covers communities (`/v1/members/:address/communities`, signed, own-profile only) and referrals (`/v1/referral-progress`, signed, identity-scoped — no `:address` parameter).
- `decentraland-ui2` is patched locally for CatalogCard props (`infoBadges`, `disableInfoExpansion`, `bottomAction`, `creatorSlot`, `hoverShadow`, `hideRarityOnHover`). Update flow: `cd ui2 && npm run build && npm pack`, then `cd sites && npm install --no-save ../ui2/decentraland-ui2-<ver>.tgz`. **Never `npm link`** ui2 — breaks the transitive hoist of `radash`/`date-fns`. The `emotion-ui2-styled-transform` Vite plugin (in `vite.config.ts`) is required as long as ui2 ships Emotion component selectors; prefer `data-role` attribute selectors in any new ui2 styles.
- After `npm install --no-save <tgz>` the **dev server must restart** for Vite's `optimizeDeps` to re-prebundle. `rm -rf node_modules/.vite` alone is not enough while the server is running. If a CatalogCard prop change doesn't show up in the browser after reinstall, the prebundled `node_modules/.vite/deps/decentraland-ui2.js` is stale.
- ui2 PR for new CatalogCard props lives upstream — once merged, drop the override CSS in `pages/profile/tabs/OverviewTab.styled.ts:EquippedGrid` that compensates for the local tgz lag.

## Security checklist

Before merging any PR that touches user-visible rendering, forms, or external content:

- React innerHTML injection + CMS/search content → **DOMPurify with strict allowlist** (see rule 19)
- Iframe embeds from user/CMS URLs → **`new URL()` + hostname `Set` + regex ID validation** (rule 20)
- Server error bodies surfaced to UI → **log raw, show generic message** (rule 10)
- CSS interpolation of URLs (`background-image: url("\${x}")`) → **validate + percent-encode quotes** via a `safeCssUrl()` helper
- SEO worker (`api/seo.ts`) touches any new template path → ensure HTML escaping still applied to every interpolated value, origin allowlist is enforced
- No secrets in `src/config/env/*.json` — these ship to the client. Secrets go in Vercel env vars + `process.env.*` on the server side of `api/seo.ts`
