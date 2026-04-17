# Merge explore-site & blog-site into landing-site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Module Federation from landing-site and absorb explore-site and blog-site as native lazy-loaded route groups, preserving homepage Lighthouse 100 performance.

**Architecture:** Dual-shell — lightweight routes (homepage, legal, download) keep today's zero-Redux provider tree; heavy routes (`/explore/*`, `/blog/*`) render inside a lazy-loaded `DappsShell` that provides Redux and persistence. **No Web3 providers in DappsShell** — both apps only need identity (from localStorage) and signed fetch for authenticated API calls. The Layout (navbar + footer) stays **outside** DappsShell so it loads instantly for all routes.

**Tech Stack:** React 18, Vite 5, React Router 7, RTK Query, decentraland-ui2, Contentful, Algolia, redux-persist

**Key decision — No Web3 in DappsShell:** Analysis confirmed that neither explore-site nor blog-site performs on-chain operations. Explore uses `signedFetch` (identity from localStorage) for event CRUD. Blog is a pure CMS reader. All Web3 usage (useWallet, Web3CoreProvider, wagmi, thirdweb) was only for PageLayout navbar — which landing-site's Layout already handles with its lightweight `useWalletAddress` hook. Removing Web3 saves ~580-780KB gzipped from the DappsShell chunk.

---

## Coding Conventions (apply to all code written in this plan)

### Dependencies (ADR-6)

- **Always** use `npm install`/`npm uninstall` — never manually edit package.json deps
- `@dcl/*` / `decentraland-*` packages: caret ranges (`npm install @dcl/pkg@^1.0.0`)
- All other packages: exact versions (`npm install pkg@1.0.0 --save-exact`)
- Use `npm ci` to install existing deps, `npm install <pkg>` only when adding new ones

### Styled Components (DCL standard)

- Import `styled`, `Box`, `Typography`, `keyframes` from `decentraland-ui2`
- Object syntax only (no template literals): `styled(Box)(({ theme }) => ({ ... }))`
- Use theme tokens: `theme.palette.*`, `theme.spacing()`, `theme.breakpoints.*`
- Separate `*.styled.ts` files, const declarations, alphabetical exports
- No hardcoded colors — use `dclColors` or `theme.palette`
- Interactive states (hover, focus-visible, active, disabled) on all controls

### Testing (DCL standard)

- Jest + TypeScript, files: `*.spec.ts(x)` alongside source
- `describe("when ...")` with "when"/"and" for contexts, `it("should ...")` for behavior
- `beforeEach` for setup, `afterEach` with `jest.resetAllMocks()`
- One assertion per `it` (ideally)
- React Testing Library: getByRole > getByLabelText > getByText

### Git (ADR-6)

- Branches: `<type>/<description>` (feat, fix, chore, docs, refactor)
- Commits: `<type>: <summary>` — no Co-Authored-By
- Pre-commit: format -> lint:fix -> build -> test

---

## PR Strategy (Stacked PRs)

```
PR1: feat/remove-federation-prepare-shells  (base: master)
 |-- PR2: feat/merge-explore-site           (base: PR1)
 '-- PR3: feat/merge-blog-site              (base: PR1)
```

PR2 and PR3 are independent siblings — can be developed in parallel, both based on PR1.

---

# PR1: Remove Federation + Prepare DappsShell + CLAUDE.md

**Branch:** `feat/remove-federation-prepare-shells` from `master`

This PR removes all federation infrastructure and sets up the empty DappsShell architecture that PR2/PR3 will populate.

---

### Task 1: Remove federation plugin and config from vite.config.ts

**Files:**

- Modify: `vite.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Remove federation import and plugin from vite.config.ts**

Replace the entire `vite.config.ts` with the federation-free version:

```typescript
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig(({ command, mode }) => {
  const envVariables = loadEnv(mode, process.cwd())
  return {
    define: {
      /* eslint-disable @typescript-eslint/naming-convention */
      'process.env': {
        VITE_BASE_URL: envVariables.VITE_BASE_URL
      }
      /* eslint-enable @typescript-eslint/naming-convention */
    },
    plugins: [
      react(),
      nodePolyfills({
        include: ['buffer']
      })
    ],
    build: {
      target: 'esnext',
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          /* eslint-disable @typescript-eslint/naming-convention */
          manualChunks: {
            'vendor-sentry': [
              '@sentry/browser',
              '@sentry/core',
              '@sentry-internal/replay',
              '@sentry-internal/browser-utils',
              '@sentry-internal/feedback'
            ],
            'vendor-schemas': ['ajv'],
            'vendor-crypto': ['@dcl/crypto', 'eth-connect'],
            'vendor-intl': ['@formatjs/icu-messageformat-parser', '@formatjs/intl', 'date-fns'],
            'vendor-ua': ['ua-parser-js'],
            'vendor-router': ['react-router']
          }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      }
    },
    ...(command === 'build' ? { base: envVariables.VITE_BASE_URL || '/' } : undefined),
    server: {
      /* eslint-disable @typescript-eslint/naming-convention */
      proxy: {
        '/auth': {
          target: 'https://decentraland.zone',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
      /* eslint-enable @typescript-eslint/naming-convention */
    }
  }
})
```

Key changes:

- Removed `import federation from '@originjs/vite-plugin-federation'`
- Removed `federation({...})` plugin block (name, remotes, shared)
- Removed `resolve.dedupe` (was only needed for federation shared scope deduplication)

- [ ] **Step 2: Remove `@originjs/vite-plugin-federation` from package.json**

```bash
npm uninstall @originjs/vite-plugin-federation
```

- [ ] **Step 3: Remove `validate:federation` script from package.json**

In `package.json` scripts, remove:

```json
"validate:federation": "node scripts/validate-federation.cjs"
```

- [ ] **Step 4: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds without federation plugin. No `remoteEntry.js` in dist/.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts package.json package-lock.json
git commit -m "feat: remove module federation plugin from vite config"
```

---

### Task 2: Delete federation-related files

**Files:**

- Delete: `src/components/RemoteLoader.tsx`
- Delete: `src/components/RemoteLoader.styled.ts`
- Delete: `src/remotes.d.ts`
- Delete: `scripts/validate-federation.cjs`
- Delete: `.github/workflows/validate-federation.yml`

- [ ] **Step 1: Delete all federation files**

```bash
rm src/components/RemoteLoader.tsx
rm src/components/RemoteLoader.styled.ts
rm src/remotes.d.ts
rm scripts/validate-federation.cjs
rm .github/workflows/validate-federation.yml
```

- [ ] **Step 2: Clean Window type declaration**

The `window.__REMOTE_URLS__` type and `virtual:__federation__` module declaration lived in `src/remotes.d.ts` which we deleted. The `Window.ethereum` type is still needed. Update `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface Window {
  ethereum?: {
    request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    on?: (event: string, handler: (...args: unknown[]) => void) => void
    removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc -b
```

Expected: No errors related to missing `virtual:__federation__` module or `RemoteLoader`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete federation files (RemoteLoader, validate script, workflow)"
```

---

### Task 3: Update App.tsx — replace RemoteLoader with DappsShell placeholder

**Files:**

- Modify: `src/App.tsx`

- [ ] **Step 1: Replace federated routes with lazy DappsShell placeholder**

```tsx
import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { IndexPage } from './pages/index.tsx'

const Layout = lazy(() => import('./components/Layout').then(m => ({ default: m.Layout })))

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

// Lazy-loaded shell for /explore and /blog routes.
// Contains Redux store + PersistGate. No Web3 — auth is handled via
// localStorage identity (useAuthIdentity) and signedFetch for API calls.
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
            {/* DappsShell provides Redux + PersistGate via Outlet */}
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
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {name} — coming soon (pending migration)
    </div>
  )
}

export { App }
```

Key changes:

- Removed `RemoteLoader` import
- Removed `getEnv`/`Env` imports (no longer needed for conditional blog route)
- Removed `useAuthIdentity` call from App level (was only for RemoteLoader props)
- Added lazy `DappsShell` import
- DappsShell wraps `/explore/*` and `/blog/*` as a layout route (Outlet pattern)

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc -b
```

Expected: Error — `./shells/DappsShell` does not exist yet. That's the next task.

- [ ] **Step 3: Commit (will commit together with Task 4)**

---

### Task 4: Create DappsShell skeleton

**Files:**

- Create: `src/shells/DappsShell.tsx`
- Create: `src/shells/store.ts`

- [ ] **Step 1: Create the Redux store skeleton**

```typescript
// src/shells/store.ts
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import type { TypedUseSelectorHook } from 'react-redux'
import { useDispatch, useSelector } from 'react-redux'

// Placeholder root reducer — PR2/PR3 will add explore and blog reducers.
const rootReducer = combineReducers({
  _placeholder: (state: null = null) => state
})

const store = configureStore({
  reducer: rootReducer,
  devTools: import.meta.env.DEV
})

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

const useAppDispatch = () => useDispatch<AppDispatch>()
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export { store, useAppDispatch, useAppSelector }
export type { RootState, AppDispatch }
```

- [ ] **Step 2: Create the DappsShell component**

```tsx
// src/shells/DappsShell.tsx
import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Provider } from 'react-redux'
import { CircularProgress } from 'decentraland-ui2'
import { store } from './store'

function DappsShellFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress color="inherit" />
    </div>
  )
}

function DappsShell() {
  return (
    <Provider store={store}>
      <Suspense fallback={<DappsShellFallback />}>
        <Outlet />
      </Suspense>
    </Provider>
  )
}

export { DappsShell }
```

No Web3 providers — auth is handled by landing-site's `useAuthIdentity` (localStorage-based). PR3 will add `PersistGate` for blog's cached posts.

- [ ] **Step 3: Add react-redux as a production dependency**

`@reduxjs/toolkit` is already in package.json but `react-redux` is missing:

```bash
npm install react-redux@9.2.0 --save-exact
```

- [ ] **Step 4: Verify TypeScript compiles and build succeeds**

```bash
npx tsc -b && npm run build
```

Expected: Builds successfully. DappsShell chunk is separate from main bundle.

- [ ] **Step 5: Verify DappsShell is in a separate chunk**

```bash
ls -la dist/assets/ | grep -i dapps
```

Expected: A chunk file containing DappsShell code, NOT merged into the main index chunk.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/shells/ package.json package-lock.json
git commit -m "feat: replace RemoteLoader with lazy DappsShell architecture"
```

---

### Task 5: Run pre-commit checks

- [ ] **Step 1: Format, lint, build, test**

```bash
npm run format && npm run lint:fix && npm run build && npm test
```

- [ ] **Step 2: Commit any formatting/lint fixes**

```bash
git add -A
git commit -m "chore: format and lint fixes"
```

(Only if there are changes — skip if clean.)

---

### Task 6: Create CLAUDE.md

**Files:**

- Create: `CLAUDE.md` (in landing-site root)

- [ ] **Step 1: Write CLAUDE.md**

See "CLAUDE.md Content" appendix at the end of this plan for full file content.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md with project architecture guide"
```

---

# PR2: Merge explore-site

**Branch:** `feat/merge-explore-site` from `feat/remove-federation-prepare-shells`

Explore-site needs no new npm dependencies. It only uses:

- `signedFetch` (needs `AuthIdentity` from `@dcl/crypto`, already a transitive dep)
- RTK Query for events API (already have `@reduxjs/toolkit`)
- Landing-site's `useAuthIdentity` for identity

---

### Task 7: Copy explore-site source code into landing-site

**Files:**

- Create: `src/pages/explore/` (all explore pages)
- Create: `src/components/explore/` (all explore components)
- Create: `src/features/explore-events/` (explore's events client)

- [ ] **Step 1: Copy explore components**

```bash
mkdir -p src/components/explore
cp -r ../explore-site/src/components/AllExperiences src/components/explore/AllExperiences
cp -r ../explore-site/src/components/CreateEvent src/components/explore/CreateEvent
cp -r ../explore-site/src/components/EventDetailModal src/components/explore/EventDetailModal
cp -r ../explore-site/src/components/HostBanner src/components/explore/HostBanner
cp -r ../explore-site/src/components/LiveNow src/components/explore/LiveNow
cp -r ../explore-site/src/components/Upcoming src/components/explore/Upcoming
cp -r ../explore-site/src/components/common src/components/explore/common
```

Do NOT copy `PageLayout/` or `StandaloneIdentityProvider.tsx` — landing's Layout handles navbar/footer.

- [ ] **Step 2: Copy explore pages**

```bash
mkdir -p src/pages/explore
cp ../explore-site/src/pages/HomePage.tsx src/pages/explore/HomePage.tsx
cp ../explore-site/src/pages/CreateEventPage.tsx src/pages/explore/CreateEventPage.tsx
```

- [ ] **Step 3: Copy explore features**

```bash
cp -r ../explore-site/src/features/events src/features/explore-events
cp -r ../explore-site/src/features/notifications src/features/explore-notifications
```

Do NOT copy `features/profile/` (landing has its own) or `features/web3/` (not needed).

- [ ] **Step 4: Copy explore hooks**

```bash
cp ../explore-site/src/hooks/useCardActions.ts src/hooks/useCardActions.ts
cp ../explore-site/src/hooks/useCreateEventForm.ts src/hooks/useCreateEventForm.ts
cp ../explore-site/src/hooks/useRemindMe.ts src/hooks/useRemindMe.ts
cp ../explore-site/src/hooks/useVisibleColumnCount.ts src/hooks/useVisibleColumnCount.ts
```

Do NOT copy `useAuthIdentity.ts` or `IdentityContext.ts` — landing's version is the canonical one.

- [ ] **Step 5: Copy explore utils**

```bash
cp ../explore-site/src/utils/signedFetch.ts src/utils/signedFetch.ts
cp ../explore-site/src/utils/date.ts src/utils/exploreDate.ts
cp ../explore-site/src/utils/time.ts src/utils/exploreTime.ts
cp ../explore-site/src/utils/url.ts src/utils/exploreUrl.ts
```

Do NOT copy `authRedirect.ts` — it imports `clearWagmiState` from `@dcl/core-web3`. If explore needs auth redirect, use landing-site's existing sign-in redirect pattern (redirect to `/auth`).

- [ ] **Step 6: Copy explore data and images**

```bash
cp -r ../explore-site/src/data src/data/explore
cp -r ../explore-site/src/images src/images/explore
```

- [ ] **Step 7: Commit raw copy**

```bash
git add src/components/explore/ src/pages/explore/ src/features/explore-events/ src/features/explore-notifications/ src/hooks/useCardActions.ts src/hooks/useCreateEventForm.ts src/hooks/useRemindMe.ts src/hooks/useVisibleColumnCount.ts src/utils/signedFetch.ts src/utils/exploreDate.ts src/utils/exploreTime.ts src/utils/exploreUrl.ts src/data/explore/ src/images/explore/
git commit -m "chore: copy explore-site source files into landing-site"
```

---

### Task 8: Fix imports and remove Web3 dependencies in explore code

**Files:**

- Modify: All files copied in Task 7

- [ ] **Step 1: Fix component imports**

For every file in `src/components/explore/`, `src/pages/explore/`, `src/features/explore-events/`:

| Old import path                         | New import path                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `../../components/AllExperiences/...`   | `../../components/explore/AllExperiences/...`                                                   |
| `../../components/LiveNow/...`          | `../../components/explore/LiveNow/...`                                                          |
| `../../features/events/...`             | `../../features/explore-events/...`                                                             |
| `../../hooks/useAuthIdentity`           | `../../hooks/useAuthIdentity` (landing's version — same path)                                   |
| `../../hooks/IdentityContext`           | **DELETE import** — replace `useContext(IdentityContext)` with `useAuthIdentity()` from landing |
| `../../features/profile/profile.client` | `../../features/profile/profile.client` (landing's version)                                     |
| `../../config/env`                      | `../../config/env` (same path, same API)                                                        |
| `../../utils/date`                      | `../../utils/exploreDate`                                                                       |
| `../../utils/time`                      | `../../utils/exploreTime`                                                                       |
| `../../utils/url`                       | `../../utils/exploreUrl`                                                                        |
| `../../data/...`                        | `../../data/explore/...`                                                                        |
| `../../images/...`                      | `../../images/explore/...`                                                                      |

- [ ] **Step 2: Remove PageLayout wrapper from explore HomePage**

In `src/pages/explore/HomePage.tsx`:

```tsx
// BEFORE (explore-site):
if (!standalone) {
  return content
}
return <PageLayout>{content}</PageLayout>

// AFTER (landing-site — Layout provides navbar/footer):
return content
```

Remove the `standalone` prop, the `PageLayout` import, and the conditional.

- [ ] **Step 3: Replace all Web3 hook usage with landing's auth hooks**

Search all copied files for these patterns and replace:

```typescript
// REMOVE any of these imports:
import { useWallet } from '@dcl/core-web3'
import { useWalletState } from '@dcl/core-web3/lazy'
import { clearWagmiState } from '@dcl/core-web3'

// REPLACE useWallet()/useWalletState() usage with:
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
const { identity, hasValidIdentity, address } = useAuthIdentity()

// Where code checks `isConnected`, replace with:
hasValidIdentity
```

- [ ] **Step 4: Remove notifications Web3 gating**

In explore's notification hook, replace:

```typescript
// BEFORE:
isNotificationsEnabled: isConnected && ...

// AFTER:
isNotificationsEnabled: hasValidIdentity && ...
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc -b 2>&1 | head -50
```

Fix any remaining import errors iteratively.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix: update explore-site imports, remove Web3 deps, use landing auth"
```

---

### Task 9: Wire explore data clients into DappsShell store

**Files:**

- Modify: `src/shells/store.ts`

**Important:** Check if explore's `events.client.ts` uses RTK Query (`createApi`) or `useSyncExternalStore`.

- [ ] **Step 1: Check explore-events pattern**

Read `src/features/explore-events/events.client.ts`.

If RTK Query (`createApi`):

```typescript
// Add to store.ts:
import { eventsClient } from '../features/explore-events/events.client'

const rootReducer = combineReducers({
  [eventsClient.reducerPath]: eventsClient.reducer
})

// Add middleware:
middleware: getDefaultMiddleware => getDefaultMiddleware().concat(eventsClient.middleware)
```

If `useSyncExternalStore` (vanilla):

- No Redux wiring needed — the hook works standalone without a store
- Just verify imports are correct

- [ ] **Step 2: Verify build**

```bash
npx tsc -b && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/shells/store.ts
git commit -m "feat: wire explore data clients into DappsShell store"
```

---

### Task 10: Add explore routes, translations, and config

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/intl/en.json`
- Modify: `src/config/env/dev.json`, `stg.json`, `prd.json`

- [ ] **Step 1: Replace explore placeholder with actual routes**

```tsx
// In App.tsx, add lazy imports:
const ExploreHomePage = lazy(() => import('./pages/explore/HomePage').then(m => ({ default: m.HomePage })))
const CreateEventPage = lazy(() => import('./pages/explore/CreateEventPage').then(m => ({ default: m.CreateEventPage })))

// Replace the placeholder:
<Route element={<DappsShell />}>
  <Route path="/explore" element={<ExploreHomePage />} />
  <Route path="/explore/new-event" element={<CreateEventPage />} />
  <Route path="/blog/*" element={<DappsShellPlaceholder name="blog" />} />
</Route>
```

- [ ] **Step 2: Check for translation key collisions and merge**

```bash
node -e "
  const landing = require('./src/intl/en.json');
  const explore = require('../explore-site/src/intl/en.json');
  const collisions = Object.keys(explore).filter(k => k in landing);
  console.log('Collisions:', collisions.length ? collisions : 'none');
"
```

If collisions: prefix explore keys with `explore.` namespace.
If none: merge directly into `src/intl/en.json`.

- [ ] **Step 3: Add explore config variables to env files**

Check `../explore-site/src/config/env/dev.json` for variables not in landing-site. Add missing ones (e.g. `PLACES_API_URL`) to all three env files.

- [ ] **Step 4: Full verification**

```bash
npm run format && npm run lint:fix && npm run build && npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add explore routes, translations, and config"
```

---

### Task 11: Pre-commit checks for PR2

- [ ] **Step 1: Full verification**

```bash
npm run format && npm run lint:fix && npm run lint:pkg && npm run build && npm test
```

- [ ] **Step 2: Review diff**

```bash
git diff feat/remove-federation-prepare-shells...HEAD --stat
```

- [ ] **Step 3: Commit fixes if any**

```bash
git add -A
git commit -m "chore: format and lint fixes for explore migration"
```

---

# PR3: Merge blog-site

**Branch:** `feat/merge-blog-site` from `feat/remove-federation-prepare-shells`

---

### Task 12: Install blog-site dependencies

**Files:**

- Modify: `package.json`

Blog needs these dependencies that landing-site doesn't have. **No Web3 packages** — no thirdweb, no wagmi, no magic-sdk, no @dcl/core-web3.

- [ ] **Step 1: Install Contentful + Algolia + blog utilities**

```bash
npm install contentful@11.8.7 --save-exact
npm install @contentful/rich-text-react-renderer@16.1.6 --save-exact
npm install @contentful/rich-text-types@17.2.5 --save-exact
npm install algoliasearch@5.41.0 --save-exact
npm install react-helmet@6.1.0 --save-exact
npm install @types/react-helmet@6.1.11 --save-exact
npm install react-responsive@10.0.1 --save-exact
npm install react-twitter-embed@4.0.4 --save-exact
npm install redux-persist@6.0.0 --save-exact
npm install reselect@5.1.1 --save-exact
npm install date-fns@4.1.0 --save-exact
```

Note: `decentraland-crypto-fetch` is only used as a type import (`AuthIdentity`). Check if `@dcl/crypto` (already a transitive dep) provides the same type. If so, skip installing it. If not:

```bash
npm install decentraland-crypto-fetch@^2.0.1
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add blog-site dependencies (contentful, algolia, redux-persist)"
```

---

### Task 13: Copy blog-site source code

**Files:**

- Create: `src/pages/blog/`, `src/components/blog/`, `src/features/blog/`, `src/features/search/`

- [ ] **Step 1: Copy blog components**

```bash
mkdir -p src/components/blog
cp -r ../blog-site/src/components/Blog/* src/components/blog/
cp -r ../blog-site/src/components/SEO src/components/blog/SEO
```

Do NOT copy `PageLayout/` — we'll create a simplified `BlogLayout`.

- [ ] **Step 2: Copy blog pages**

```bash
mkdir -p src/pages/blog
cp ../blog-site/src/pages/BlogPage.tsx src/pages/blog/BlogPage.tsx
cp ../blog-site/src/pages/CategoryPage.tsx src/pages/blog/CategoryPage.tsx
cp ../blog-site/src/pages/PostPage.tsx src/pages/blog/PostPage.tsx
cp ../blog-site/src/pages/AuthorPage.tsx src/pages/blog/AuthorPage.tsx
cp ../blog-site/src/pages/PreviewPage.tsx src/pages/blog/PreviewPage.tsx
cp ../blog-site/src/pages/SearchPage.tsx src/pages/blog/SearchPage.tsx
cp ../blog-site/src/pages/SignInRedirect.tsx src/pages/blog/SignInRedirect.tsx
```

- [ ] **Step 3: Copy blog features and services**

```bash
cp -r ../blog-site/src/features/blog src/features/blog
cp -r ../blog-site/src/features/search src/features/search
mkdir -p src/services
cp ../blog-site/src/services/client.ts src/services/blogClient.ts
```

Do NOT copy `features/web3/`, `features/profile/`, or `features/notifications/`.

- [ ] **Step 4: Copy blog shared types, utils, images**

```bash
cp -r ../blog-site/src/shared src/shared/blog
cp -r ../blog-site/src/images src/images/blog
```

- [ ] **Step 5: Create BlogLayout (simplified from blog-site's PageLayout)**

```tsx
// src/components/blog/BlogLayout.tsx
import type { ReactNode } from 'react'
import { BlogNavigation } from './BlogNavigation/BlogNavigation'

interface BlogLayoutProps {
  children: ReactNode
  activeCategory?: string
  banner?: ReactNode
  showBlogNavigation?: boolean
  relatedPosts?: ReactNode
}

function BlogLayout({ children, activeCategory, banner, showBlogNavigation = true, relatedPosts }: BlogLayoutProps) {
  return (
    <>
      {showBlogNavigation && <BlogNavigation active={activeCategory} />}
      {banner}
      {children}
      {relatedPosts}
    </>
  )
}

export { BlogLayout }
```

This replaces blog-site's `PageLayout` — no Navbar, no Footer, no StandaloneContext. Landing's Layout handles all of that.

- [ ] **Step 6: Commit raw copy**

```bash
git add src/components/blog/ src/pages/blog/ src/features/blog/ src/features/search/ src/services/blogClient.ts src/shared/blog/ src/images/blog/
git commit -m "chore: copy blog-site source files into landing-site"
```

---

### Task 14: Fix imports and remove Web3 dependencies in blog code

**Files:**

- Modify: All files copied in Task 13

- [ ] **Step 1: Fix import paths**

| Old import path                              | New import path                                   |
| -------------------------------------------- | ------------------------------------------------- |
| `../components/Blog/...`                     | `../components/blog/...`                          |
| `../components/PageLayout/PageLayout`        | `../components/blog/BlogLayout`                   |
| `../components/PageLayout/StandaloneContext` | **DELETE** — no longer exists                     |
| `../services/client`                         | `../services/blogClient`                          |
| `../shared/types/...`                        | `../shared/blog/types/...`                        |
| `../shared/utils/...`                        | `../shared/blog/utils/...`                        |
| `../app/store`                               | `../shells/store`                                 |
| `../app/hooks`                               | `../shells/store` (useAppDispatch/useAppSelector) |
| `../hooks/useAuthIdentity`                   | `../hooks/useAuthIdentity` (landing's version)    |
| `../images/...`                              | `../images/blog/...`                              |

- [ ] **Step 2: Replace all Web3 hook usage with landing's auth hooks**

Search all copied blog files and replace:

```typescript
// REMOVE these imports:
import { useWalletState } from '@dcl/core-web3/lazy'
import { useTokenBalance } from '@dcl/core-web3'
import { Web3CoreProvider, Web3SyncProvider } from '@dcl/core-web3'
import { WalletStateProvider } from '@dcl/core-web3/lazy'
import { clearWagmiState } from '@dcl/core-web3'

// REPLACE wallet state usage:
// BEFORE:
const { address, isConnected } = useWalletState()
// AFTER:
const { address, hasValidIdentity } = useAuthIdentity()

// REPLACE isConnected checks:
// BEFORE:
if (isConnected) {
  /* notifications, profile load, etc */
}
// AFTER:
if (hasValidIdentity) {
  /* same logic */
}
```

- [ ] **Step 3: Update blog pages to use BlogLayout instead of PageLayout**

In every blog page that imports `PageLayout`, replace with `BlogLayout`:

```typescript
// BEFORE:
import { PageLayout } from '../components/PageLayout/PageLayout'
// AFTER:
import { BlogLayout } from '../components/blog/BlogLayout'
```

Remove any `useStandalone()` or `StandaloneContext` usage.

- [ ] **Step 4: Handle notifications without Web3**

Blog's `usePageNotifications` uses `isConnected` to gate notifications. Replace:

```typescript
// BEFORE:
const { isConnected } = useWalletState()
isNotificationsEnabled: isConnected && isPollingEnabled

// AFTER:
const { hasValidIdentity } = useAuthIdentity()
isNotificationsEnabled: hasValidIdentity && isPollingEnabled
```

Note: If blog doesn't even show notifications in its pages (navbar handles them), this hook can be removed entirely.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc -b 2>&1 | head -50
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix: update blog-site imports, remove Web3 deps, use landing auth"
```

---

### Task 15: Wire blog Redux into DappsShell store

**Files:**

- Modify: `src/shells/store.ts`
- Modify: `src/shells/DappsShell.tsx`

- [ ] **Step 1: Add redux-persist and blog reducers to store**

```typescript
// src/shells/store.ts
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import type { TypedUseSelectorHook } from 'react-redux'
import { useDispatch, useSelector } from 'react-redux'
import { blogReducer } from '../features/blog/blog.slice'
import { cmsClient } from '../services/blogClient'
import { algoliaClient } from '../features/search/search.client'

const blogPersistConfig = {
  key: 'blog',
  storage,
  whitelist: ['ids', 'entities']
}

const rootReducer = combineReducers({
  blog: persistReducer(blogPersistConfig, blogReducer),
  [cmsClient.reducerPath]: cmsClient.reducer,
  [algoliaClient.reducerPath]: algoliaClient.reducer
})

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }).concat(cmsClient.middleware, algoliaClient.middleware),
  devTools: import.meta.env.DEV
})

const persistor = persistStore(store)

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

const useAppDispatch = () => useDispatch<AppDispatch>()
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export { store, persistor, useAppDispatch, useAppSelector }
export type { RootState, AppDispatch }
```

No `networkReducer`, `transactionsReducer`, or `walletReducer` — no Web3 state needed.

- [ ] **Step 2: Add PersistGate to DappsShell**

```tsx
// src/shells/DappsShell.tsx
import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { CircularProgress } from 'decentraland-ui2'
import { store, persistor } from './store'

function DappsShellFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress color="inherit" />
    </div>
  )
}

function DappsShell() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Suspense fallback={<DappsShellFallback />}>
          <Outlet />
        </Suspense>
      </PersistGate>
    </Provider>
  )
}

export { DappsShell }
```

Three providers total: Redux, PersistGate, Suspense. No Web3.

- [ ] **Step 3: Verify build**

```bash
npx tsc -b && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/shells/
git commit -m "feat: add blog reducers and PersistGate to DappsShell store"
```

---

### Task 16: Add blog routes, config, and SEO function

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/config/env/*.json`
- Modify: `src/intl/en.json`
- Modify: `vite.config.ts`
- Create: `api/seo.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Add blog lazy routes to App.tsx**

```tsx
const BlogPage = lazy(() => import('./pages/blog/BlogPage').then(m => ({ default: m.BlogPage })))
const PostPage = lazy(() => import('./pages/blog/PostPage').then(m => ({ default: m.PostPage })))
const CategoryPage = lazy(() => import('./pages/blog/CategoryPage').then(m => ({ default: m.CategoryPage })))
const AuthorPage = lazy(() => import('./pages/blog/AuthorPage').then(m => ({ default: m.AuthorPage })))
const SearchBlogPage = lazy(() => import('./pages/blog/SearchPage').then(m => ({ default: m.SearchPage })))
const PreviewPage = lazy(() => import('./pages/blog/PreviewPage').then(m => ({ default: m.PreviewPage })))

// Inside <Route element={<DappsShell />}>:
<Route path="/blog" element={<BlogPage />} />
<Route path="/blog/preview" element={<PreviewPage />} />
<Route path="/blog/search" element={<SearchBlogPage />} />
<Route path="/blog/sign-in" element={<SignInRedirect />} />
<Route path="/blog/author/:authorSlug" element={<AuthorPage />} />
<Route path="/blog/:categorySlug" element={<CategoryPage />} />
<Route path="/blog/:categorySlug/:postSlug" element={<PostPage />} />
```

Remove `DappsShellPlaceholder` for blog.

- [ ] **Step 2: Add blog config variables to env files**

Add to `src/config/env/dev.json` (and equivalent for stg/prd):

```json
{
  "ALGOLIA_APP_ID": "1H67SAMO2T",
  "ALGOLIA_API_KEY": "d7f493e3a24525b7021451b81b1d294a",
  "ALGOLIA_BLOG_INDEX": "blog_contentful_prd",
  "CMS_BASE_URL": "https://cms.decentraland.zone/spaces/ea2ybdmmn1kv/environments/master",
  "BLOG_BASE_URL": "/blog"
}
```

- [ ] **Step 3: Add CMS proxy to vite.config.ts**

```typescript
proxy: {
  '/auth': { /* existing */ },
  '/api/cms': {
    target: 'https://cms.decentraland.zone',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => path.replace(/^\/api\/cms/, '')
  }
}
```

- [ ] **Step 4: Merge blog translations**

Check for collisions, then merge into `src/intl/en.json`.

- [ ] **Step 5: Copy SEO serverless function**

```bash
mkdir -p api
cp ../blog-site/api/seo.ts api/seo.ts
```

- [ ] **Step 6: Update vercel.json**

```json
{
  "rewrites": [
    { "source": "/blog/:path*", "destination": "/api/seo?path=/blog/:path*" },
    { "source": "/blog", "destination": "/api/seo?path=/blog" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 7: Install @vercel/node for serverless function**

```bash
npm install --save-dev @vercel/node@5.5.16
```

- [ ] **Step 8: Full verification**

```bash
npm run format && npm run lint:fix && npm run build && npm test
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add blog routes, config, SEO function, and translations"
```

---

### Task 17: Pre-commit checks for PR3

- [ ] **Step 1: Full verification**

```bash
npm run format && npm run lint:fix && npm run lint:pkg && npm run build && npm test
```

- [ ] **Step 2: Review diff and commit fixes**

```bash
git diff feat/remove-federation-prepare-shells...HEAD --stat
git add -A
git commit -m "chore: format and lint fixes for blog migration"
```

---

## CLAUDE.md Content

Full content for `CLAUDE.md` (Task 6):

```markdown
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
No Web3 providers — auth uses localStorage identity via `useAuthIdentity`.

**Rule: Never import anything from `src/shells/` in lightweight route code.**

## Key Directories

| Path                     | Purpose                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `src/shells/`            | DappsShell + Redux store. Lazy-loaded.                                                    |
| `src/pages/`             | Pages. `explore/` and `blog/` subdirs.                                                    |
| `src/components/`        | Components. `explore/` and `blog/` subdirs.                                               |
| `src/components/Layout/` | Global navbar + footer (Outlet pattern).                                                  |
| `src/features/`          | Data clients. `events/` and `profile/` are lightweight. `blog/`, `search/` use RTK Query. |
| `src/hooks/`             | `useAuthIdentity` and `useWalletAddress` — canonical auth hooks for all routes.           |
| `src/config/env/`        | Per-environment config (`dev.json`, `stg.json`, `prd.json`).                              |
| `src/intl/`              | Translations. Single `en.json`.                                                           |
| `api/`                   | Vercel serverless. `seo.ts` injects blog meta tags.                                       |

## Auth Flow

- `useWalletAddress()` reads `single-sign-on-*` from localStorage. No Web3 provider.
- `useAuthIdentity()` wraps it. Returns `{ identity, hasValidIdentity, address }`.
- Sign-in: redirects to `/auth` (SSO dapp). Identity written to localStorage.
- Sign-out: clears `single-sign-on-*`, `wagmi*`, `wc@2*` from localStorage.
- Explore and blog use `signedFetch` with the identity for authenticated API calls.

## Performance

- Hero pre-rendered as static HTML+CSS (`scripts/prerender-hero.mjs`).
- Analytics deferred via `requestIdleCallback` (4s timeout).
- Layout lazy-loaded (keeps MUI out of critical path).
- DappsShell lazy-loaded (Redux + blog cache only loaded on /explore or /blog).

## Common Commands

    npm run dev          # Vite dev server
    npm run build        # tsc + vite build + hero prerender
    npm test             # Jest
    npm run format       # Prettier
    npm run lint:fix     # ESLint

## Adding Routes

**Lightweight** (homepage, legal): Add `<Route>` inside `<Layout />`, OUTSIDE `<DappsShell />`.
**Heavy** (needs Redux): Add `<Route>` INSIDE `<DappsShell />`. Add reducers to `src/shells/store.ts`.
```

---

## Dependencies Comparison (before vs after)

### NOT installed (Web3 packages eliminated):

- ~~`@dcl/core-web3`~~ — saved ~50KB
- ~~`wagmi`~~ — saved ~150KB
- ~~`magic-sdk`~~ — saved ~80KB
- ~~`@magic-ext/oauth2`~~ — saved ~20KB
- ~~`thirdweb`~~ — saved ~300-500KB

### New dependencies (blog only):

- `contentful` ~40KB, `@contentful/rich-text-*` ~15KB
- `algoliasearch` ~50KB
- `redux-persist` ~8KB, `reselect` ~3KB
- `react-helmet` ~5KB, `react-responsive` ~3KB, `react-twitter-embed` ~5KB
- `date-fns` (tree-shakeable, only imports used)

**Net bundle impact for DappsShell chunk:** ~130KB instead of ~710-910KB. Savings: **~580-780KB gzipped**.

---

## Post-Merge: Infrastructure Changes (PR4 + PR5)

After PR1+PR2+PR3 land on master (auto-deploys to zone/dev), two external repos need updating:

### PR4: definitions repo — Update routing for zone/staging

Update path routing so `/explore` and `/blog` point to landing-site instead of separate apps.

- **Zone/staging ONLY** — prod stays as-is until validated
- Explore: currently not in prod via definitions, so no prod concern
- Blog: currently in prod, so prod change is a separate follow-up

### PR5: sites-deployer repo — Remove separate app deployments for zone/staging

Remove explore-site and blog-site as separate deployments for zone and staging environments.

- **Zone/staging ONLY** — prod removal after validation
- Blog exists in prod via sites-deployer — remove from prod only after zone/staging validated
- Explore does NOT exist in prod yet — no prod concern

### Order of operations

1. Merge PR1+PR2+PR3 to master → auto-deploys landing-site to zone
2. PR4: Update definitions for zone/staging routing
3. PR5: Remove explore/blog from sites-deployer for zone/staging
4. Validate on zone
5. Prod cutover: Update definitions + sites-deployer for prod (separate PRs)

---

## Self-Review Checklist

1. **Spec coverage:**

   - [x] Stacked PRs (PR1 base, PR2/PR3 children)
   - [x] Federation removal
   - [x] DappsShell architecture (no Web3, homepage unaffected)
   - [x] Global navbar/footer shared across all routes
   - [x] Explore migration (no Web3 deps)
   - [x] Blog migration (no Web3 deps, including SEO function)
   - [x] CLAUDE.md creation
   - [x] Bundle size protection (lazy loading + no Web3)
   - [x] Auth unification (landing's useAuthIdentity everywhere)

2. **Placeholder scan:** No TBD/TODO items. All decision points resolved.

3. **Type consistency:** `useAuthIdentity` returns `{ identity, hasValidIdentity, address }` everywhere. `hasValidIdentity` replaces `isConnected` in all gating logic.
