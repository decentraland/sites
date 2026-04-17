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

## Pre-PR Review (MUST)

Before running `gh pr create`, self-review the diff against this repo's review bot standards. The bot blocks PRs on P1 findings; catching them here saves a round-trip.

### 1. Run the code-reviewer agent on the diff

Dispatch the `pr-review-toolkit:code-reviewer` agent (or equivalent local review skill) on `git diff <base>...HEAD`. Treat any P1 finding as a blocker — fix before pushing.

### 2. Architectural boundary check (P1 failures)

- `src/shells/*` MUST NOT be imported from code that runs on lightweight routes. That includes `src/App.tsx` (serves all routes), `src/main.tsx`, `src/components/Layout/*`, `src/components/LandingNavbar/*`, `src/components/LandingFooter/*`, any lightweight page under `src/pages/` (excluding `src/pages/explore/`, `src/pages/blog/`), and anything `src/hooks/` exports that the navbar/footer uses.
- The ONLY legitimate reference to `src/shells/` from outside is the `lazy(() => import('./shells/DappsShell'))` call in `src/App.tsx`.
- Placeholder/fallback UI for DappsShell routes lives in `src/App.tsx` itself (or a colocated file in the main bundle), not in `src/shells/`.

### 3. YAGNI check (P2 noise)

- Do NOT export helpers with zero consumers in the current PR. `useAppDispatch`, `useAppSelector`, `RootState`, `AppDispatch` stay unexported until a file in the same PR imports them.
- Do NOT add placeholder reducers. An empty store is `configureStore({ reducer: {} })` — no `combineReducers`, no `placeholder: () => null`.
- Do NOT add props, options, or APIs that no caller uses in the current PR.

### 4. DRY check (P2 noise)

- Before creating a new styled component, grep for identical/near-identical ones in the diff and in the rest of `src/`.
- Before copying a file from a source repo, check whether landing-site already has an equivalent. Examples: `src/features/notifications/` already exists — do NOT copy `features/notifications/` from explore-site or blog-site.
- Shared utilities (e.g. `coordsKey`, `HotScene`, `ActiveEntity`, `DeploymentResponse`) that appear in both `src/features/events/` and `src/features/explore-events/` must be extracted — pick one canonical location and import from it.

### 5. Behavior-change check

- Any time you REMOVE a conditional, env gate, feature flag, or route guard: add an inline `// NOTE:` or `// TODO:` comment documenting the intentional change and why it's safe (or when the gate should return).
- Example — removing `getEnv() !== Env.PRODUCTION` around the `/blog/*` route: leave a comment explaining whether blog is now intentionally enabled in prod or whether the gate returns in a follow-up PR.

### 6. Test coverage for new architectural components

- Any new provider/shell/layout component in `src/shells/` or `src/components/Layout/` MUST have at least a smoke test confirming it renders without throwing.
- New reducers/RTK Query clients in the shells store MUST have at minimum a test asserting the store builds with the expected `reducerPath` keys.

### 7. Barrel exports

- Re-export ALL public RTK Query hooks (`useXQuery`, `useXMutation`) from the feature's `index.ts`. A missing hook forces consumers to deep-import from `*.client.ts`, which breaks the barrel contract.

### 8. ESLint scope

- NEVER add blanket ignores (`src/**/*.spec.ts(x)` to top-level `ignores`). If specs need relaxed rules, use a scoped `overrides` entry that disables ONLY the specific rules that differ (`@typescript-eslint/no-non-null-assertion`, `naming-convention`, etc).

### 9. JSON merges

- When merging two JSON files (e.g. `intl/en.json`), verify there are no duplicate top-level keys. Run:

  ```bash
  node -e 'const j=require("./src/intl/en.json");const s=JSON.stringify(j);const k=Object.keys(j);if(new Set(k).size!==k.length)throw new Error("dupe keys")'
  ```

### 10. Error handling (P2 security)

- Do NOT propagate raw server error bodies to UI. Log the raw error for debugging and surface a generic message to the user. Raw bodies may contain stack traces, internal paths, or user data.

### 11. List rendering

- Card/row components rendered inside lists (`.map(...)` in scrollable containers) MUST be wrapped in `memo()` for consistency with the rest of the codebase. Check sibling components for the established pattern.

### 12. Network requests in hot paths

- If a helper makes per-item HTTP requests inside a `.map()` (N+1 pattern), check whether the underlying API supports batch queries (e.g. `POST /entities/active` with pointer arrays). Always prefer batch endpoints over sequential fetches when available.
