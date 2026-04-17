# Landing Site

Decentraland's main website. Single Vite SPA hosting the homepage, legal pages, download flow, `/explore/*` (events), and `/blog/*` (CMS posts). Module Federation was removed — explore and blog are now native lazy-loaded route groups inside this repo.

## Architecture: Dual Shell

Routes are split into two tiers to protect homepage Lighthouse performance:

### Lightweight routes (main bundle, no Redux, no Web3)

`/`, `/download`, `/download/creator-hub`, `/download/creator-hub-success`, `/invite/:referrer`, `/brand`, `/content`, `/ethics`, `/rewards-terms`, `/security`, `/privacy`, `/referral-terms`, `/terms`, `/help`, `/create`, `/discord`, `/press`, `/sign-in`.

Provider tree (`src/main.tsx`):
`StrictMode` > `DclThemeProvider(darkTheme)` > `LocaleProvider` > `DeferredAnalyticsProvider` > `App > BrowserRouter`.

Data access on lightweight routes uses `useSyncExternalStore`-based clients (see `features/events/events.client.ts`, `features/profile/profile.client.ts`). No Redux store mounted for these routes.

### Heavy routes (`DappsShell`, lazy-loaded)

`/explore`, `/explore/new-event`, `/blog`, `/blog/preview`, `/blog/search`, `/blog/sign-in`, `/blog/author/:authorSlug`, `/blog/:categorySlug`, `/blog/:categorySlug/:postSlug`.

These render as `<Outlet />` children of `src/shells/DappsShell.tsx`. The shell chunk is lazy-imported in `src/App.tsx` via `lazy(() => import('./shells/DappsShell'))` and boots the Redux store, the RTK Query RTK middleware, and blog-specific deps (contentful rich-text renderer, algoliasearch, dompurify) only when one of these routes is navigated to.

**No Web3 providers.** Authentication on heavy routes uses the same localStorage-based `useAuthIdentity` hook as the navbar — explore signs mutations with `signedFetch(identity)`, blog reads CMS public endpoints and only needs identity for (Future) notifications/preview. No wagmi, magic-sdk, core-web3, or thirdweb — ~580-780KB saved vs. the federated predecessor.

**Boundary rule:** code that runs on lightweight routes (anything reachable from `App.tsx` without going through `<DappsShell />`) must never `import` from `src/shells/`. That includes `src/components/Layout/*`, `src/components/LandingNavbar/*`, `src/components/LandingFooter/*`, all pages under `src/pages/*` except `src/pages/explore/*` and `src/pages/blog/*`, and any hook the navbar consumes. The ONLY legitimate reference to `src/shells/` from outside the shell itself is the `lazy()` import in `src/App.tsx`.

## Directory map

| Path                            | Purpose                                                                                                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                   | Router. Splits routes into lightweight (inside `<Layout />`) and heavy (inside `<DappsShell />`).                                                                                               |
| `src/App.styled.ts`             | Shared `CenteredBox` styled component (used by App-level fallback + DappsShell fallback).                                                                                                       |
| `src/main.tsx`                  | Entry point. Mounts the lightweight provider tree.                                                                                                                                              |
| `src/shells/`                   | `DappsShell.tsx` + `store.ts` — lazy-loaded Redux + RTK Query middleware. Bundle-isolated from the main chunk.                                                                                  |
| `src/pages/`                    | Page components. `explore/` and `blog/` subdirs for the absorbed apps.                                                                                                                          |
| `src/pages/index.tsx`           | Landing homepage (hero is prerendered by `scripts/prerender-hero.mjs`).                                                                                                                         |
| `src/components/`               | Shared components. Top-level for landing-specific UI. `blog/` and `explore/` subdirs for the absorbed apps.                                                                                     |
| `src/components/Layout/`        | Outlet-based layout. Mounts `LandingNavbar`, renders child route, then `LandingFooter`. Wraps ALL routes (both tiers).                                                                          |
| `src/components/LandingNavbar/` | Navbar. Consumes `useWalletAddress` (localStorage) — does NOT require Redux.                                                                                                                    |
| `src/components/LandingFooter/` | Footer. Newsletter + social + legal links.                                                                                                                                                      |
| `src/features/events/`          | Lightweight explore-data client (useSyncExternalStore). Used by the homepage "what's on" section.                                                                                               |
| `src/features/explore-events/`  | RTK Query client + endpoints for `/explore/*`. Only loaded inside `DappsShell`.                                                                                                                 |
| `src/features/blog/`            | RTK Query endpoints + entity adapter for blog posts. `blog.client.ts` injects endpoints into `cmsClient`.                                                                                       |
| `src/features/search/`          | Algolia-backed search endpoints for `/blog/search`. `search.client.ts` injects into `algoliaClient`.                                                                                            |
| `src/features/profile/`         | Lightweight Catalyst profile client (useSyncExternalStore).                                                                                                                                     |
| `src/features/notifications/`   | `usePageNotifications` hook used by `Layout` (navbar notifications).                                                                                                                            |
| `src/services/blogClient.ts`    | RTK Query base clients (`cmsClient`, `algoliaClient`) — infrastructure only, empty endpoints. Endpoints are injected from `features/blog/` and `features/search/`. See "RTK Query split" below. |
| `src/hooks/`                    | `useAuthIdentity`, `useWalletAddress`, `useManaBalances`, etc. All localStorage-based — no Redux dependency.                                                                                    |
| `src/config/env/`               | Per-environment JSON (`dev.json`, `stg.json`, `prd.json`). Access via `getEnv('KEY')` from `src/config/env.ts`.                                                                                 |
| `src/intl/`                     | Single `en.json` with all translations merged (landing + explore + blog namespaces). `LocaleContext.tsx` wraps `@dcl/hooks`'s `TranslationProvider`.                                            |
| `src/modules/`                  | Side-effect wiring: Sentry (`sentry.ts`), Segment/Contentsquare (`DeferredAnalyticsProvider`, `deferredThirdParty.ts`).                                                                         |
| `src/shared/blog/`              | Domain types and utilities (dates, slugs, locations) for blog content.                                                                                                                          |
| `src/utils/signedFetch.ts`      | Shared identity-signed fetch. Used by explore mutations.                                                                                                                                        |
| `scripts/prebuild.cjs`          | Resolves CDN base URL and writes `.env` before build.                                                                                                                                           |
| `scripts/prerender-hero.mjs`    | Injects static hero HTML + critical CSS into `dist/index.html` post-build (LCP optimization).                                                                                                   |
| `api/seo.ts`                    | Vercel serverless function. Injects Open Graph meta tags for `/blog/*` crawlers.                                                                                                                |
| `vercel.json`                   | Rewrites `/blog/*` to `/api/seo?path=...`, everything else to `/index.html`.                                                                                                                    |

## RTK Query split (`services/` vs `features/`)

The blog domain has two client files — this is intentional, not a duplicate.

**`src/services/blogClient.ts`** — infrastructure. Declares the empty base clients `cmsClient` (Contentful base URL, cache config, tag types) and `algoliaClient` (fakeBaseQuery for Algolia SDK). No endpoints. Imported by `src/shells/store.ts` to register reducers and middleware.

**`src/features/blog/blog.client.ts`** — business logic. Calls `cmsClient.injectEndpoints({ endpoints: ... })` to add the blog endpoints (`getBlogPosts`, `getBlogPost`, `getBlogPostBySlug`, `getBlogCategories`, `getBlogAuthors`, …). Exports the generated hooks.

**`src/features/search/search.client.ts`** — same pattern: `algoliaClient.injectEndpoints({ endpoints: ... })`.

Why the split:

1. **Breaks a circular dep.** `store.ts` imports the base client. Endpoints in `features/blog/blog.client.ts` import `store` for one cache-read optimization (`getPostFromStore`). If the base client lived next to the endpoints, that would cycle. The split keeps the hub (`services/`) free of app-layer imports.
2. **Matches RTK Query's recommended pattern** ([`code splitting`](https://redux-toolkit.js.org/rtk-query/usage/code-splitting)). The "empty api + inject" idiom scales cleanly when additional domains are added.
3. **Keeps the store lean.** `store.ts` doesn't need to import feature endpoint definitions just to register reducers/middleware.

**Naming nit:** `services/blogClient.ts` hosts BOTH `cmsClient` and `algoliaClient` — the filename is misleading. A future refactor could split it into `services/cmsClient.ts` and `services/algoliaClient.ts`. Not urgent, but consider when touching the file.

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
- **DappsShell is lazy** — Redux, RTK Query, Contentful renderer, Algolia SDK, dompurify only load when a user navigates to `/explore/*` or `/blog/*`.
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
npm run build        # tsc + vite build + hero prerender
npm test             # Jest (28 suites, 346 tests)
npm run format       # Prettier
npm run lint:fix     # ESLint
npm run lint:pkg     # package.json lint
```

## Adding a lightweight route

1. Create page in `src/pages/my-page/`.
2. Add `lazy(() => import(...))` in `src/App.tsx`.
3. Place the `<Route>` inside `<Route element={<Layout />}>` block, OUTSIDE `<Route element={<DappsShell />}>`.
4. Use `useSyncExternalStore`-based clients for data, or co-locate a tiny client under `src/features/` using the same pattern as `features/events/` or `features/profile/`.
5. Do NOT import anything from `src/shells/*`, `src/features/blog/*`, `src/features/search/*`, `src/features/explore-events/*`, `src/services/*`.

## Adding a heavy route

1. Create page in `src/pages/my-feature/`.
2. Add `lazy(() => import(...))` in `src/App.tsx`.
3. Place the `<Route>` INSIDE `<Route element={<DappsShell />}>`.
4. If you need Redux state, either inject endpoints into an existing RTK Query client or add a new base client in `src/services/` and a new reducer in `src/shells/store.ts`.
5. Never import your feature from lightweight route code.

## Coding conventions

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
- Before copying a file from a source repo, check whether landing-site already has an equivalent. Examples: `features/notifications/` already exists — do NOT copy a duplicate.
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

### 9. JSON merges

- When merging two JSON files (e.g. `intl/en.json`), verify no duplicate top-level keys:
  ```bash
  node -e 'const j=require("./src/intl/en.json");const k=Object.keys(j);if(new Set(k).size!==k.length)throw new Error("dupe keys")'
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
