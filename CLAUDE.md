# Sites

Decentraland's main website. Single Vite SPA — every absorbed dapp is a native lazy-loaded route group (Module Federation removed). See **Architecture: Dual Shell** below for the full route map.

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

- **Events** (was What's On at `/whats-on`): `/events`, `/events/new-hangout`, `/events/edit-hangout/:eventId`, `/events/admin/pending-events`, `/events/admin/users` (plus legacy `/events/new-event` and `/events/edit-event/:eventId` aliases that redirect into the hangout flow). The old `/whats-on*` prefix redirects here with its subpath and query intact via `RenamedSectionRedirect`, and the standalone-site deep links `/events/event?id=`, `/places/place?position=` and `/places/world?name=` still resolve.
- **Blog**: `/blog`, `/blog/preview`, `/blog/search`, `/blog/sign-in`, `/blog/author/:authorSlug`, `/blog/:categorySlug`, `/blog/:categorySlug/:postSlug`.
- **Jump** (launcher deep-link handler): `/jump`, `/jump/places`, `/jump/places/invalid`, `/jump/events`, `/jump/events/invalid`, plus the `/jump/event` legacy alias used by production.
- **Social** (communities): `/social/communities/:id`, `/social/*` (catch-all not-found).
- **Places** (was Discover at `/discover`, which redirects here; absorbs the standalone decentraland.social experience): `/places` (Live Now rail + Featured POIs + full-bleed Explore band with Explore all / Favourites / My places tabs, search + category filter — a right filter drawer on mobile), `/places/communities` (list tab; cards link into the pre-existing `/social/communities/:id` detail), `/places/place/:position` (Genesis City parcel detail), `/places/world/:name` (world detail, same shape), `/places/*` (catch-all, reuses `SocialNotFoundPage`). New pages render inside `<DiscoverLayout />`; data comes from `src/features/discover/` (endpoints injected into `placesClient` / `socialClient`). Junk listings (roads, empty parcels with only the `map.png` placeholder, `interactive-text` deploys) are hidden by `isHiddenPlace`; card covers fall back to a solid tile via `placeCoverImage`.
  - **Scene detail** (`DiscoverScenePage`): live presence gates two states. Empty scene (desktop) → `SceneJumpInModal` over the grid; mobile always renders the modal as a full page (bevy-web can't run on touch devices) with LIVE + presence badges when live. Live scene (desktop) → 2-column grid: viewer card (bevy iframe via `SceneLiveWatcher`) + In-World Chat (`ChatPanel`, unconditionally read-only), always visible — it renders the empty-chat shell when the room is quiet. The bevy embed URL comes from `getEnv('BEVY_WEB_URL')` (`.zone` dev/stg — `.org`'s `frame-ancestors` CSP rejects non-.org parents — `.org` prd) with `systemScene=tortilla.dcl.eth` (patched scene-viewer: fly camera at the scene spawn point, no sidebar) and `guest=1&hud=0` flags (auto guest-login, no bevy HUD). COOP/COEP for the iframe are set per-route in `vercel.json` for `/places` and `/places/:path*`.
- **Cast** (LiveKit streaming, absorbed from `decentraland/cast2`): `/cast/s/:token`, `/cast/s/streaming`, `/cast/w/:worldName/parcel/:parcel`, `/cast/w/:location`, plus `/cast` index and `/cast/*` catch-all rendering `CastNotFoundPage`. Cast adds an extra `<CastLayout />` that provides LiveKit + Notification contexts and renders the toast stack.
- **Storage** (storage-service-site): `/storage`, `/storage/select`, `/storage/env`, `/storage/scene`, `/storage/players`, `/storage/players/:address`, plus `/storage/*` not-found.
- **Account** (account-settings, absorbed from the standalone `account` dapp): `/account` (redirects to `/account/wallets`), `/account/wallets`, `/account/notifications`, `/account/credits`, `/account/delete`, plus `/account/*` not-found. Shares an `AccountLayout` sidebar. The Wallets "Send" action and the Delete flow need a Web3 signer, so they mount the lazy **`BlockchainShell`** (see below) — the rest of the account pages are signer-free.

These render as `<Outlet />` children of `src/shells/DappsShell.tsx`. The shell chunk is lazy-imported in `src/App.tsx` via `lazy(() => import('./shells/DappsShell'))` and boots the Redux store, the RTK Query middleware, and the heaviest deps (contentful rich-text renderer, dompurify, `livekit-client` + `@livekit/components-react` for cast) only when one of these routes is navigated to.

**No Web3 providers on the main/lightweight tiers, nor in the base `DappsShell` chunk.** Authentication on most heavy routes uses the same localStorage-based `useAuthIdentity` hook as the navbar — whats-on / social / storage sign mutations with `signedFetch(identity)`, blog reads CMS public endpoints, jump/cast can run without identity. The one exception is the account Wallets "Send" and Delete actions, gated behind the lazy `BlockchainShell` (below). The homepage and every lightweight route stay Web3-free (~580-780KB saved vs. the federated predecessor).

### Third tier: `BlockchainShell` (on-demand Web3, `src/shells/BlockchainShell.tsx`)

A lazy, opt-in shell for the few account actions that need a connected signer (Wallets Send; Delete). It wraps children in `@dcl/core-web3`'s `WalletStateProvider` + `Web3LazyProvider`, which dynamically import the heavy Web3 stack (`wagmi` / `viem` / `magic-sdk` / `@magic-ext/oauth2`) only when an action mounts the shell, then calls `injectWeb3Reducers()` to append core-web3's `wallet` / `network` / `transactions` slices to the already-running `DappsShell` store (`createLazyStoreEnhancer` in `store.ts`). Children are withheld behind a readiness gate until the providers are mounted, so wagmi hooks never run without a `WagmiProvider`. The base `DappsShell` store only statically imports the lightweight `@dcl/core-web3/lazy` facade (the enhancer + provider shells) — the wagmi/viem bundle is code-split and never loads on a non-account heavy route.

**Boundary rule:** code that runs on lightweight routes (anything reachable from `App.tsx` without going through `<DappsShell />`) must never `import` from `src/shells/`. The lightweight tier covers everything under `src/pages/*` EXCEPT the heavy-route page directories: `src/pages/whats-on/*`, `src/pages/blog/*`, `src/pages/jump/*`, `src/pages/social/*`, `src/pages/discover/*`, `src/pages/cast/*`, `src/pages/storage/*`, `src/pages/account/*`. Heavy-tier code (those page dirs + their feature/component trees, e.g. `src/components/account/*`) may import `src/shells/` — `BlockchainShell` and the RTK hooks live there. The same lightweight restriction applies to `src/components/Layout/*`, `src/components/LandingNavbar/*`, `src/components/LandingFooter/*`, and any hook the navbar consumes. The ONLY legitimate reference to `src/shells/` from outside the shell and outside a heavy-route tree is the `lazy()` import in `src/App.tsx`.

## Directory map (top-level)

| Path                            | Purpose                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/App.tsx`                   | Router. Splits routes into Layout-less / lightweight / heavy.                                    |
| `src/App.styled.ts`             | Shared `CenteredBox` styled component (App-level + DappsShell fallback).                         |
| `src/main.tsx`                  | Entry point. Mounts the lightweight provider tree.                                               |
| `src/shells/`                   | `DappsShell.tsx` + `store.ts` (+ listeners) + `BlockchainShell.tsx`/`web3Config.ts` (lazy Web3). |
| `src/pages/`                    | Page components. Subdirs per dapp (see per-dapp docs below).                                     |
| `src/pages/index.tsx`           | Landing homepage (hero prerendered by `scripts/prerender-hero.mjs`).                             |
| `src/components/`               | Shared components. Top-level for landing; subdirs per dapp (see per-dapp docs).                  |
| `src/components/Layout/`        | Outlet-based layout. Mounts navbar, child route, footer.                                         |
| `src/components/LandingNavbar/` | Navbar. Consumes `useWalletAddress` (localStorage, no Redux).                                    |
| `src/components/LandingFooter/` | Footer. Newsletter + social + legal links.                                                       |
| `src/features/profile/`         | Lightweight Catalyst profile client (`useSyncExternalStore`). Used cross-domain.                 |
| `src/features/notifications/`   | `usePageNotifications` hook used by `Layout` (navbar notifications).                             |
| `src/hooks/`                    | Shared hooks. `useAuthIdentity`, `useWalletAddress`, `useBlogPageTracking`, etc.                 |
| `src/config/env/`               | Per-environment JSON (`dev.json`, `stg.json`, `prd.json`). Access via `getEnv('KEY')`.           |
| `src/intl/`                     | Six locale files (`en`, `es`, `fr`, `ja`, `ko`, `zh`). Skill `add-i18n-key`.                     |
| `src/modules/`                  | Side-effect wiring: Sentry, Segment, Contentsquare.                                              |
| `src/utils/signedFetch.ts`      | Shared identity-signed fetch (used by whats-on, social, storage mutations).                      |
| `src/utils/avatarColor.ts`      | Deterministic avatar background color. Skill `avatar-background-color`.                          |
| `scripts/prebuild.cjs`          | Resolves CDN base URL and writes `.env` before build.                                            |
| `scripts/prerender-hero.mjs`    | Injects static hero HTML + critical CSS post-build (LCP).                                        |
| `api/seo.ts`                    | Vercel serverless function for `/blog/*` OG meta. Skill `seo-worker`.                            |
| `vercel.json`                   | Rewrites `/blog/*` to `/api/seo?path=...`, everything else to `/index.html`.                     |

### Per-dapp directory details

Each absorbed dapp's feature client, base client, components, and pages live under per-dapp docs. Load the one matching your task:

- `docs/domains/whats-on.md` — `src/features/events/`, components/whats-on, pages/whats-on. Events API + admin + lightweight discovery.
- `docs/domains/blog.md` — `src/features/cms/`, `src/services/cmsClient.ts`, `src/shared/blog/`. Contentful + cms-server search.
- `docs/domains/jump.md` — `src/features/places/`, `src/services/placesClient.ts`. Launcher deep-link resolution.
- `docs/domains/social.md` — `src/features/communities/`, `src/services/socialClient.ts`. Communities API.
- `docs/domains/cast.md` — `src/features/cast2/`, `src/services/cast2Client.ts`. LiveKit streaming.
- `docs/domains/storage.md` — `src/features/storage/`, `src/services/storageClient.ts`, `src/services/subgraphClient.ts`. Storage + subgraph ownership.
- `docs/domains/reels.md` — `src/features/reels/`. Camera-screenshot client; Layout-less.
- `docs/domains/report.md` — `src/features/report/`. Lightweight report form (no RTK Query).
- `docs/domains/profile.md` — `src/features/profile/`, components/profile, pages/profile. Profile route group + modal surfaces + social RPC.
- `docs/domains/discover.md` — `src/features/discover/`, components/discover, pages/discover. Destinations feed + live presence + bevy scene preview.

### Skill + hook governance

For the human-readable index of all skills, hooks, per-dapp docs, and the Pre-PR rule → skill mapping → `docs/skills-registry.md`. Update it whenever you add or remove a skill, hook, or Pre-PR rule so the documentation stays consistent.

## RTK Query split (`services/` vs `features/`)

Base clients (infra) in `src/services/<name>Client.ts`. Endpoints (business logic) injected from `src/features/<domain>/<domain>.client.ts` via `<base>.injectEndpoints({ ... })`. Full rationale, step-by-step for adding endpoints / base clients, and Pre-PR rules 17-18 → skill `rtk-query-split`.

## Auth flow

No Web3 providers (no wagmi, magic-sdk, core-web3, thirdweb). Wallet + identity via localStorage (`useWalletAddress`, `useAuthIdentity`). Mutations call `signedFetch(url, identity)` from `src/utils/signedFetch.ts`. Full sign-in/out flow, hook details, OTP/Magic edge cases → skill `auth-flow`.

## Performance

Hero prerender + lazy `<Layout />` + lazy `<DappsShell />` + deferred analytics. Manual chunks in `vite.config.ts` with a render-blocking CSS gotcha for packages like `@livekit/components-styles`. Full setup, manualChunks rules, verification command → skill `perf-tier`.

## Blog SEO

`api/seo.ts` is a Vercel serverless function that rewrites OG/Twitter meta at the edge for `/blog/*` (crawlers don't run JS so Helmet titles are invisible to them). HTML escaping + origin allowlist + path sanitization. Full flow, CMS_BASE_URL coherence, security checklist for new template paths → skill `seo-worker`.

## Environment config

All env vars live in `src/config/env/{dev,stg,prd}.json`. Access via `getEnv('KEY')` from `src/config/env.ts`. The `@dcl/ui-env` package auto-selects the right file based on the hostname. Override at runtime with the `?env=dev|stg|prod` query param (note: `prod`, not `prd` — an invalid value silently falls back to dev).

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

## Adding a route

Tier picker (lightweight / heavy / Layout-less), full step-by-step, navbar clearance, and the repo sync checklist (README + SEO worker `PAGES` + GitHub issue templates) → skill `add-route`.

## Coding conventions

### File placement

- **Hooks**: `src/hooks/use<Name>.ts` + sibling `use<Name>.spec.ts`. Never under `src/features/<domain>/`, even when the hook wraps a feature's RTK Query. Feature barrels (`src/features/<domain>/index.ts`) must not re-export hooks.
- **Styled components**: `<Component>.styled.ts` co-located with `<Component>.tsx`. Inline `sx={...}` only for one-off micro-tweaks; conditional styling with props belongs in `.styled.ts`.
- **Types / interfaces**: `<thing>.types.ts`. Never inline in `.client.ts`, `.helpers.ts`, or logic files.
- **RTK Query**: base client → `src/services/<name>Client.ts` (infra only). Endpoints → `src/features/<domain>/<domain>.client.ts`. See "RTK Query split".
- **Pages**: `src/pages/<route>/`. Heavy routes under `src/pages/{whats-on,blog,jump,social,discover,cast,storage,account}/`. Layout-less fullscreen routes use the same `src/pages/<area>/` shape but are placed before the `<Layout />` Route block in `src/App.tsx` (`reels`, `download`, `invite`).
- **Signal you're placing a file wrong**: `src/features/<domain>/use<X>.ts`, inline styled bigger than a single `sx`, type inside `.client.ts`. Stop and move it.

### Naming

- **Name reusable code for what it does, not for the first feature that used it.** If a hook / util / component is used (or is meant to be used) beyond one domain, its name must be domain-neutral and describe its behavior. A domain prefix (`blog`, `cast`, `storage`, …) is only allowed when the code is genuinely specific to that domain.
- **Signal you're naming it wrong**: a generic helper carries a feature prefix while callers from other domains import it. Example: a per-page Segment `page()` hook was named `useBlogPageTracking` but blog, storage, cast, social and the 404 page all use it — the correct name is the behavior (`usePageViewTracking`). Rename it rather than propagating the misnomer to new callers.

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
- `npm run build` runs `tsc -b`, which **typechecks `*.spec.ts(x)` too** — ts-jest is more lenient, so a green `npm test` can still fail the build. Run `tsc -b` before treating specs as done (strictly-typed mock helpers like `React.createElement` are the usual culprit).
- Inline `jest.mock` factories must not use `require()` (banned by `@typescript-eslint/no-require-imports`). Use the repo pattern: `import React from 'react'` at the top, then reference `React.createElement` inside the factory (see `LiveNowCard.spec.tsx`).

## Pre-PR review

Before running `gh pr create`, self-review the diff against this repo's review bot standards. The bot blocks PRs on P0/P1 findings; catching them here saves a round-trip.

### 1. Run the code-reviewer agent on the diff

Dispatch `pr-review-toolkit:code-reviewer` (or equivalent) on `git diff <base>...HEAD`. Treat any P0/P1 finding as a blocker — fix before pushing.

### 2. Architectural boundary check (P1 failures)

Enforce the boundary rule from Architecture > Dual Shell. Grep diff:

```bash
git diff master...HEAD --name-only | xargs grep -l "from ['\"].*shells/" 2>/dev/null
```

Hits outside `src/App.tsx` and `src/shells/` itself = violation.

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
- **Coverage floor: 95% on statements, lines, and functions.** Branches stay informational (current floor ~85%). There is no automatic enforcement (the old Stop hook was removed on 2026-05-20 — see `docs/skills-registry.md`); run the `/coverage-guard` skill before any PR that touches `src/**` or `api/**` and use the `coverage-keeper` agent to write missing specs. Reuse `src/__test-utils__/styledMock.ts` for `*.styled.ts` files instead of bypassing the styled engine.

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

All `CMS_BASE_URL` references (env files, `api/seo.ts`, `vite.config.ts` proxy) must point to `cms-api.decentraland.org`. Dev proxy must substitute the full upstream path. Skill `seo-worker`.

### 16. No module-top-level throws in shell-reachable code

NEVER throw at module top-level in files imported by `src/shells/store.ts` — one bad import crashes the entire lazy `DappsShell` chunk load. Use a lazy getter. Skill `shell-safe-imports`.

### 17. RTK Query — no direct store imports in endpoint files

Don't `import { store }` in endpoint files for dispatching. Use `onQueryStarted` lifecycle instead. Skill `rtk-query-split`.

### 18. RTK Query — no internal cache state access

No `state.cmsClient.queries` casts via `as any`. Use entity-adapter selectors, `endpoints.foo.select(args)(state)`, or `selectFromResult`. Skill `rtk-query-split`.

### 19-25. Extended rules — see `docs/pre-pr-rules-detail.md`

One line each. Open the doc for code patterns and full rationale.

- **19.** XSS sanitization for CMS/search HTML — DOMPurify with scoped per-source allowlist.
- **20.** URL validation — `new URL()` + hostname `Set` + regex ID, never `includes()`.
- **21.** `package-lock.json` after rebase — `rm -rf node_modules package-lock.json && npm install`, never `--package-lock-only`.
- **22.** Immutable RTK Query cache — don't mutate `queryFn` / `transformResponse` / `updateQueryData` returns.
- **23.** Page tracking + Helmet — `useBlogPageTracking({ name, properties })` + `Layout.helpers.ts:isPageTrackingExempt`.
- **24.** Props destructuring threshold — ≤3 in params, ≥4 in body.
- **25.** No inline `sx` with hardcoded values — co-located `*.styled.ts` with theme tokens.

## Security checklist

Before merging any PR that touches user-visible rendering, forms, or external content:

- React innerHTML injection + CMS/search content → **DOMPurify with strict allowlist** (see rule 19)
- Iframe embeds from user/CMS URLs → **`new URL()` + hostname `Set` + regex ID validation** (rule 20)
- Server error bodies surfaced to UI → **log raw, show generic message** (rule 10)
- CSS interpolation of URLs (`background-image: url("\${x}")`) → **validate + percent-encode quotes** via a `safeCssUrl()` helper
- SEO worker (`api/seo.ts`) touches any new template path → ensure HTML escaping still applied to every interpolated value, origin allowlist is enforced
- No secrets in `src/config/env/*.json` — these ship to the client. Secrets go in Vercel env vars + `process.env.*` on the server side of `api/seo.ts`
