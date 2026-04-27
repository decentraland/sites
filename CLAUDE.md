# Landing Site

Decentraland's main website. Single Vite SPA hosting the homepage, legal pages, download flow, `/whats-on/*` (events), and `/blog/*` (CMS posts). Module Federation was removed — what's on and blog are now native lazy-loaded route groups inside this repo.

## Architecture: Dual Shell

Routes are split into two tiers to protect homepage Lighthouse performance:

### Lightweight routes (main bundle, no Redux, no Web3)

`/`, `/download`, `/download/creator-hub`, `/download/creator-hub-success`, `/invite/:referrer`, `/brand`, `/content`, `/ethics`, `/rewards-terms`, `/security`, `/privacy`, `/referral-terms`, `/terms`, `/help`, `/create`, `/discord`, `/press`, `/sign-in`.

Provider tree (`src/main.tsx`):
`StrictMode` > `DclThemeProvider(darkTheme)` > `LocaleProvider` > `DeferredAnalyticsProvider` > `App > BrowserRouter`.

Data access on lightweight routes uses `useSyncExternalStore`-based clients (see `features/events/events.client.ts`, `features/profile/profile.client.ts`). No Redux store mounted for these routes.

### Heavy routes (`DappsShell`, lazy-loaded)

`/whats-on`, `/whats-on/new-event`, `/blog`, `/blog/preview`, `/blog/search`, `/blog/sign-in`, `/blog/author/:authorSlug`, `/blog/:categorySlug`, `/blog/:categorySlug/:postSlug`.

These render as `<Outlet />` children of `src/shells/DappsShell.tsx`. The shell chunk is lazy-imported in `src/App.tsx` via `lazy(() => import('./shells/DappsShell'))` and boots the Redux store, the RTK Query RTK middleware, and blog-specific deps (contentful rich-text renderer, algoliasearch, dompurify) only when one of these routes is navigated to.

**No Web3 providers.** Authentication on heavy routes uses the same localStorage-based `useAuthIdentity` hook as the navbar — whats-on signs mutations with `signedFetch(identity)`, blog reads CMS public endpoints and only needs identity for (Future) notifications/preview. No wagmi, magic-sdk, core-web3, or thirdweb — ~580-780KB saved vs. the federated predecessor.

**Boundary rule:** code that runs on lightweight routes (anything reachable from `App.tsx` without going through `<DappsShell />`) must never `import` from `src/shells/`. That includes `src/components/Layout/*`, `src/components/LandingNavbar/*`, `src/components/LandingFooter/*`, all pages under `src/pages/*` except `src/pages/whats-on/*` and `src/pages/blog/*`, and any hook the navbar consumes. The ONLY legitimate reference to `src/shells/` from outside the shell itself is the `lazy()` import in `src/App.tsx`.

## Directory map

| Path                            | Purpose                                                                                                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                   | Router. Splits routes into lightweight (inside `<Layout />`) and heavy (inside `<DappsShell />`).                                                                                               |
| `src/App.styled.ts`             | Shared `CenteredBox` styled component (used by App-level fallback + DappsShell fallback).                                                                                                       |
| `src/main.tsx`                  | Entry point. Mounts the lightweight provider tree.                                                                                                                                              |
| `src/shells/`                   | `DappsShell.tsx` + `store.ts` — lazy-loaded Redux + RTK Query middleware. Bundle-isolated from the main chunk.                                                                                  |
| `src/pages/`                    | Page components. `whats-on/` and `blog/` subdirs for the absorbed apps.                                                                                                                         |
| `src/pages/index.tsx`           | Landing homepage (hero is prerendered by `scripts/prerender-hero.mjs`).                                                                                                                         |
| `src/components/`               | Shared components. Top-level for landing-specific UI. `blog/` and `whats-on/` subdirs for the absorbed apps.                                                                                    |
| `src/components/Layout/`        | Outlet-based layout. Mounts `LandingNavbar`, renders child route, then `LandingFooter`. Wraps ALL routes (both tiers).                                                                          |
| `src/components/LandingNavbar/` | Navbar. Consumes `useWalletAddress` (localStorage) — does NOT require Redux.                                                                                                                    |
| `src/components/LandingFooter/` | Footer. Newsletter + social + legal links.                                                                                                                                                      |
| `src/features/events/`          | Lightweight what's-on data client (useSyncExternalStore). Used by the homepage "what's on" section.                                                                                             |
| `src/features/whats-on-events/` | RTK Query client + endpoints for `/whats-on/*`. Only loaded inside `DappsShell`.                                                                                                                |
| `src/features/blog/`            | RTK Query endpoints + entity adapter for blog posts. `blog.client.ts` injects endpoints into `cmsClient`.                                                                                       |
| `src/features/search/`          | Algolia-backed search endpoints for `/blog/search`. `search.client.ts` injects into `algoliaClient`.                                                                                            |
| `src/features/profile/`         | Lightweight Catalyst profile client (useSyncExternalStore).                                                                                                                                     |
| `src/features/notifications/`   | `usePageNotifications` hook used by `Layout` (navbar notifications).                                                                                                                            |
| `src/services/blogClient.ts`    | RTK Query base clients (`cmsClient`, `algoliaClient`) — infrastructure only, empty endpoints. Endpoints are injected from `features/blog/` and `features/search/`. See "RTK Query split" below. |
| `src/hooks/`                    | `useAuthIdentity`, `useWalletAddress`, `useManaBalances`, etc. All localStorage-based — no Redux dependency.                                                                                    |
| `src/config/env/`               | Per-environment JSON (`dev.json`, `stg.json`, `prd.json`). Access via `getEnv('KEY')` from `src/config/env.ts`.                                                                                 |
| `src/intl/`                     | Six locale files — `en.json`, `es.json`, `fr.json`, `ja.json`, `ko.json`, `zh.json` — each with all translations merged (landing + whats-on + blog namespaces). When adding a key to `en.json`, add it to ALL five other locales in the same commit. `LocaleContext.tsx` wraps `@dcl/hooks`'s `TranslationProvider`. |
| `src/modules/`                  | Side-effect wiring: Sentry (`sentry.ts`), Segment/Contentsquare (`DeferredAnalyticsProvider`, `deferredThirdParty.ts`).                                                                         |
| `src/shared/blog/`              | Domain types and utilities (dates, slugs, locations) for blog content.                                                                                                                          |
| `src/utils/signedFetch.ts`      | Shared identity-signed fetch. Used by whats-on mutations.                                                                                                                                       |
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
- **DappsShell is lazy** — Redux, RTK Query, Contentful renderer, Algolia SDK, dompurify only load when a user navigates to `/whats-on/*` or `/blog/*`.
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
5. Do NOT import anything from `src/shells/*`, `src/features/blog/*`, `src/features/search/*`, `src/features/whats-on-events/*`, `src/services/*`.

## Adding a heavy route

1. Create page in `src/pages/my-feature/`.
2. Add `lazy(() => import(...))` in `src/App.tsx`.
3. Place the `<Route>` INSIDE `<Route element={<DappsShell />}>`.
4. If you need Redux state, either inject endpoints into an existing RTK Query client or add a new base client in `src/services/` and a new reducer in `src/shells/store.ts`.
5. Never import your feature from lightweight route code.

## Coding conventions

### File placement

- **Hooks**: `src/hooks/use<Name>.ts` + sibling `use<Name>.spec.ts`. Never under `src/features/<domain>/`, even when the hook wraps a feature's RTK Query. Feature barrels (`src/features/<domain>/index.ts`) must not re-export hooks.
- **Styled components**: `<Component>.styled.ts` co-located with `<Component>.tsx`. Inline `sx={...}` only for one-off micro-tweaks; conditional styling with props belongs in `.styled.ts`.
- **Types / interfaces**: `<thing>.types.ts`. Never inline in `.client.ts`, `.helpers.ts`, or logic files.
- **RTK Query**: base client → `src/services/<name>Client.ts` (infra only). Endpoints → `src/features/<domain>/<domain>.client.ts`. See "RTK Query split".
- **Pages**: `src/pages/<route>/`. Heavy routes under `src/pages/{whats-on,blog}/`.
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

### 19. XSS — sanitize CMS/search HTML before React innerHTML injection

- Every React innerHTML injection (`dangerouslySetInnerHTML`) whose content originates from Contentful, Algolia, or any external source MUST run through DOMPurify with a strict tag allowlist.
- One `sanitizeX.ts` helper per source with a scoped allowlist — do NOT build a generic global sanitizer that tries to cover every case:
  ```ts
  // src/components/blog/Search/sanitizeHighlight.ts
  const sanitizeHighlight = (value: string): string => DOMPurify.sanitize(value, { ALLOWED_TAGS: ['em', 'mark'], ALLOWED_ATTR: [] })
  ```
- Algolia's `_highlightResult` wraps matches in `<em>`, but the match TEXT came from the CMS — if an author injected a script tag into a title, unsanitized render would execute it.

### 20. URL validation — parse + allowlist, never `includes()`

- For embed renderers and any hostname check, NEVER use `uri.includes('youtube.com')` or `endsWith('instagram.com')`. Both are trivially bypassable (`https://evil.com/youtube.com/...`, `https://evil-instagram.com/...`).
- Parse with `new URL()` and compare `hostname` against a `Set` allowlist. Validate any extracted ID with a regex before interpolating into iframe `src`:

  ```ts
  const YOUTUBE_HOSTS = new Set(['www.youtube.com', 'youtube.com', 'youtu.be'])
  const YOUTUBE_ID_REGEX = /^[\w-]{1,20}$/

  const parseUrl = (uri: string): URL | null => {
    try {
      return new URL(uri)
    } catch {
      return null
    }
  }

  const getYouTubeVideoId = (uri: string): string | null => {
    const url = parseUrl(uri)
    if (!url || !YOUTUBE_HOSTS.has(url.hostname)) return null
    const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') ?? ''
    return YOUTUBE_ID_REGEX.test(id) ? id : null
  }
  ```

### 21. `package-lock.json` after rebase conflicts

- NEVER use `npm install --package-lock-only` to regenerate the lock after a rebase conflict. That flag only resolves optional dependencies for the current host (macOS arm64 in most dev environments), dropping `@rollup/rollup-linux-*`, `@esbuild/linux-*`, `@unrs/resolver-binding-linux-*`, and `@napi-rs/*` bindings. CI running `npm ci` on `linux-x64` will then fail with "Missing: <pkg> from lock file".
- Correct sequence after a lock conflict:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  git add package-lock.json
  ```
- The new lock will be larger (+3-5k lines typical) because it now lists all platform binaries.

### 22. Immutable data in RTK Query cache

- Never mutate objects that have entered RTK Query's cache (returned by `queryFn`, `transformResponse`, or fetched via `updateQueryData`). RTK Query expects immutable references — mutations cause silent corruption with structural sharing.
- Build enrichment results as a separate `Map`, then produce NEW objects via spread:

  ```ts
  // BAD — mutates in place
  cards.forEach(card => {
    card.creatorAddress = deployerMap.get(card.coordinates)
  })

  // GOOD — new object per card
  const enriched = cards.map(card => {
    const deployedBy = deployerMap.get(card.coordinates)
    return deployedBy && !card.creatorAddress ? { ...card, creatorAddress: deployedBy } : card
  })
  ```

## Security checklist

Before merging any PR that touches user-visible rendering, forms, or external content:

- React innerHTML injection + CMS/search content → **DOMPurify with strict allowlist** (see rule 19)
- Iframe embeds from user/CMS URLs → **`new URL()` + hostname `Set` + regex ID validation** (rule 20)
- Server error bodies surfaced to UI → **log raw, show generic message** (rule 10)
- CSS interpolation of URLs (`background-image: url("\${x}")`) → **validate + percent-encode quotes** via a `safeCssUrl()` helper
- SEO worker (`api/seo.ts`) touches any new template path → ensure HTML escaping still applied to every interpolated value, origin allowlist is enforced
- No secrets in `src/config/env/*.json` — these ship to the client. Secrets go in Vercel env vars + `process.env.*` on the server side of `api/seo.ts`

## Key conventions — quick reference

Aggregated from the rules above, sorted by "what could hurt you most":

| Area               | Rule                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **File placement** | Hooks → `src/hooks/`; types → `*.types.ts`; styled → `*.styled.ts`; feature barrels must not re-export hooks                           |
| **Architecture**   | `src/shells/*` is lazy — never import from it in lightweight route code (rule 2)                                                       |
| **Architecture**   | Empty Redux store is `configureStore({ reducer: {} })`, no placeholder (rule 3)                                                        |
| **RTK Query**      | `services/` = base clients (infra), `features/` = `injectEndpoints` (business). Keep the split                                         |
| **RTK Query**      | Use `onQueryStarted` for dispatching, not `store.dispatch` in `transformResponse` (rule 17)                                            |
| **RTK Query**      | No `state.xxxClient.queries as any` — use entity selectors or `endpoint.select()` (rule 18)                                            |
| **Auth**           | localStorage-only via `useAuthIdentity` — no Web3 providers, no wagmi, no thirdweb                                                     |
| **Bundle**         | No `module.throw` at import time in shell-reachable files (rule 16)                                                                    |
| **Bundle**         | Run `npm run build && npm run preview` for PRs adding dynamic routes or CJS-ish deps (rule 14)                                         |
| **Bundle**         | `decentraland-ui2` imports only; no hardcoded colors; object-syntax styled components                                                  |
| **Security**       | `dangerouslySetInnerHTML` → DOMPurify with scoped allowlist (rule 19)                                                                  |
| **Security**       | URL parsing with `new URL()` + hostname allowlist, never `.includes()` (rule 20)                                                       |
| **Security**       | Never leak raw server error bodies to UI (rule 10)                                                                                     |
| **Performance**    | Hero is prerendered; Layout is lazy; DappsShell is lazy; analytics deferred                                                            |
| **Performance**    | Add `memo()` to list-rendered card components (rule 11)                                                                                |
| **Performance**    | Batch HTTP calls when API supports it — no N+1 in hot paths (rule 12)                                                                  |
| **Deps**           | `npm install`/`npm uninstall`; `@dcl/*` caret, others exact; fresh `rm -rf node_modules && npm install` after lock conflicts (rule 21) |
| **Routing**        | Fixed navbar = 64px mobile / 92px desktop. Every new route needs `paddingTop: 64` / `md: 96` (rule 13)                                 |
| **Config**         | Unified CMS origin across env files + api/seo.ts + vite proxy (rule 15)                                                                |
