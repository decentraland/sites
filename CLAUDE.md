# Landing Site

Decentraland's main website. Single Vite SPA that hosts the homepage, legal pages, and embedded dapps (explore, blog).

## Architecture: Dual Shell

Routes are split into two tiers to protect homepage Lighthouse performance:

### Lightweight Routes (no extra providers)

`/`, `/download`, `/brand`, `/terms`, `/privacy`, `/create`, `/help`, `/press`, `/discord`, and all legal pages.

Provider tree: `DclThemeProvider` > `LocaleProvider` > `DeferredAnalyticsProvider` > `BrowserRouter`.
No Redux, no Web3. Data fetched via `useSyncExternalStore` hooks.

### Heavy Routes (DappsShell)

`/explore/*`, `/blog/*`.

Wrapped in `src/shells/DappsShell.tsx` (lazy-loaded). Adds: Redux Provider + PersistGate.
No Web3 providers — auth uses localStorage identity via `useAuthIdentity`. Explore and blog use `signedFetch` with that identity for authenticated API calls.

**Rule: Never import anything from `src/shells/` in lightweight route code.** Doing so pulls Redux and blog dependencies into the main bundle.

## Key Directories

| Path                     | Purpose                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/shells/`            | DappsShell + Redux store. Lazy-loaded.                                                                                                           |
| `src/pages/`             | Pages. `explore/` and `blog/` subdirs.                                                                                                           |
| `src/components/`        | Components. `explore/` and `blog/` subdirs.                                                                                                      |
| `src/components/Layout/` | Global navbar + footer (Outlet pattern).                                                                                                         |
| `src/features/`          | Data clients. `events/` and `profile/` are lightweight (useSyncExternalStore). `blog/`, `search/` use RTK Query (only loaded inside DappsShell). |
| `src/hooks/`             | `useAuthIdentity` and `useWalletAddress` — canonical auth hooks for all routes.                                                                  |
| `src/config/env/`        | Per-environment config (`dev.json`, `stg.json`, `prd.json`).                                                                                     |
| `src/intl/`              | Translations. Single `en.json`.                                                                                                                  |
| `src/modules/`           | Side-effect modules — Sentry, Segment analytics (deferred), Contentsquare.                                                                       |
| `scripts/`               | Build scripts — `prebuild.cjs` (CDN URL), `prerender-hero.mjs` (LCP optimization).                                                               |
| `api/`                   | Vercel serverless. `seo.ts` injects blog meta tags.                                                                                              |

## Auth Flow

- `useWalletAddress()` reads `single-sign-on-*` from localStorage. No Web3 provider needed.
- `useAuthIdentity()` wraps it. Returns `{ identity, hasValidIdentity, address }`.
- Sign-in: redirects to `/auth` (SSO dapp). Identity written to localStorage.
- Sign-out: clears `single-sign-on-*`, `wagmi*`, `wc@2*` from localStorage.
- Explore and blog use `signedFetch` with the identity for authenticated API calls — no on-chain operations.

## Performance

- Hero pre-rendered as static HTML+CSS (`scripts/prerender-hero.mjs`).
- Analytics deferred via `requestIdleCallback` (4s timeout).
- Layout lazy-loaded (keeps MUI out of critical path).
- DappsShell lazy-loaded (Redux + blog cache only loaded on /explore or /blog).

## Common Commands

```bash
npm run dev          # Vite dev server
npm run build        # tsc + vite build + hero prerender
npm test             # Jest
npm run format       # Prettier
npm run lint:fix     # ESLint
npm run lint:pkg     # package.json lint
```

## Adding a New Lightweight Route

1. Create page in `src/pages/my-page/`
2. Add lazy import in `src/App.tsx`
3. Add `<Route>` inside the `<Route element={<Layout />}>` block, OUTSIDE `<DappsShell />`

## Adding a New Heavy Route (needs Redux)

1. Create page in `src/pages/my-feature/`
2. Add lazy import in `src/App.tsx`
3. Add `<Route>` INSIDE `<DappsShell />`
4. If you need new Redux state, add reducer to `src/shells/store.ts`
5. Never import your feature from lightweight route code

## Environment Config

All env vars live in `src/config/env/{dev,stg,prd}.json`. Access via `getEnv('KEY')` from `src/config/env.ts`. The `@dcl/ui-env` package auto-selects the right file based on the hostname.

## Coding Conventions

### Dependencies

- `npm install`/`npm uninstall` always — never manually edit package.json deps
- `@dcl/*` / `decentraland-*`: caret ranges (`^`). All others: exact (`--save-exact`)
- `npm ci` to install existing deps

### Styled Components

- Import from `decentraland-ui2`: `styled`, `Box`, `Typography`, `keyframes`
- Object syntax only: `styled(Box)(({ theme }) => ({ ... }))`
- Theme tokens: `theme.palette.*`, `theme.spacing()`, `theme.breakpoints.*`
- Separate `*.styled.ts` files. No hardcoded colors — use `dclColors` or theme palette
- Interactive states on all controls: hover, focus-visible, active, disabled

### Testing

- Jest + TypeScript, `*.spec.ts(x)` alongside source
- `describe("when ...")` / `it("should ...")` pattern
- `beforeEach` for setup, `afterEach` with `jest.resetAllMocks()`
- React Testing Library: getByRole > getByLabelText > getByText

### Git

- Branches: `<type>/<description>` (feat, fix, chore, docs, refactor)
- Commits: `<type>: <summary>` — no Co-Authored-By
- Pre-commit: `npm run format` -> `npm run lint:fix` -> `npm run build` -> `npm test`
