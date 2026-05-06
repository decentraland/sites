---
name: migrate-dapp
description: Use when absorbing a standalone Decentraland dapp (jump, blog, whats-on, social) into the sites SPA as a heavy DappsShell route. Triggers on "migrate dapp", "absorb <dapp> into sites", "port <dapp>". Captures path/auth/i18n/sign-in decisions, files to touch, the Web3-drop pattern, and the Jest/ts-jest gotchas you'd otherwise re-discover by trial.
---

# migrate-dapp

Playbook for absorbing a standalone Decentraland dapp into this SPA. Mirrors how `whats-on`, `blog`, `jump`, and `social` were brought in. **Heavy tier only** — every dapp ported so far needs Redux + RTK Query.

## Overview

The migration is mechanical once decisions are made. It's never "copy code 1:1" — the source dapp ships its own Web3 stack, navbar/footer, and provider tree, and ALL of those get dropped. The user-facing UI (cards, lists, modals) stays.

## Decisions to take with the user FIRST (AskUserQuestion)

Don't guess these — they shape the code.

1. **Path**: source uses some basename (`/social`, `/jump`, `/blog`). What public path do we mount under in sites? Singular vs plural matters (`/community/:id` vs `/communities/:id`). Verify against the production sitemap, not just the source router. If the source has sub-paths/tabs, ask whether they should be URL-driven or internal state.
2. **Auth**: the source almost certainly imports `wagmi`, `magic-sdk`, `thirdweb`, `decentraland-connect`. Sites **drops Web3** — `useAuthIdentity` (localStorage SSO) + `signedFetch` only. Confirm this is the chosen approach (it's the only one consistent with blog/whats-on/jump). Unauthenticated CTAs redirect to the global SSO via `redirectToAuth(path, queryParams)`.
3. **Sign-in callback**: reuse the global `/sign-in` lightweight page (already exists in `src/App.tsx`). Don't port the source's own `SignInRedirect`.
4. **i18n locales**: source typically ships en/es/zh. Sites needs all 6 (en, es, fr, ja, ko, zh) per rule 9. Ask: hand-translate fr/ja/ko now, copy English placeholders, or block the PR on localization team.
5. **Navbar item**: ask explicitly — don't add `LandingNavbar` entries unprompted.

Use `AskUserQuestion` for these in **plan mode**. Cite the trade-offs (e.g. dropping Web3 = `~580–780KB` saved, mutations require pre-existing identity).

## Phase 1: explore (plan mode)

Launch up to 3 `Explore` agents in parallel:

- One to map the source dapp: routes, RTK Query clients, types, page components, helpers, i18n keys, segment events, auth flow, tests.
- One to refresh the sites patterns: `src/services/blogClient.ts`, `src/features/blog/blog.client.ts`, `src/shells/store.ts`, `src/shells/DappsShell.tsx`, `src/components/Layout/Layout.helpers.ts`, `src/utils/signedFetch.ts`, `src/hooks/useAuthIdentity.ts`, `src/hooks/useBlogPageTracking.ts`, `src/utils/authRedirect.ts`, `src/features/profile/profile.client.ts`, `src/features/blog/useInfiniteBlogPosts.ts`, env JSONs.
- Optional third agent for path resolution if the source has a `basename` quirk.

Then read the actual files (not just agent summaries) for: source `*.client.ts`, source `*.types.ts`, source page components, source i18n locales (all of them — you'll port them).

## Files to add (heavy tier)

| Path                                             | Purpose                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/<dapp>Client.ts`                   | RTK Query base — `createApi({ reducerPath: '<dapp>Client', baseQuery: customQuery, tagTypes: [...] })`. Custom baseQuery scans localStorage for SSO identity (`localStorageGetIdentity` + `signedFetchFactory`), no Redux state, no wagmi. **Use a lazy getter** for `getEnv('<DAPP>_API_URL')` (rule 16). |
| `src/features/<domain>/<domain>.client.ts`       | `<dapp>Client.injectEndpoints(...)`. Mutations use `onQueryStarted` for optimistic updates / cache reads (rule 17). Read cache via `endpoint.select(args)(state)` — **never** `state.<dapp>Client.queries as any` (rule 18).                                                                               |
| `src/features/<domain>/<domain>.types.ts`        | Domain types + enums. Verify shape against real API response — don't infer from source TS types (feedback `verify_api_response_shape`).                                                                                                                                                                    |
| `src/features/<domain>/<domain>.helpers.ts`      | Helpers (URL builders, formatters, color seeders). Each lazy-getter wraps `getEnv(...)` if it can throw.                                                                                                                                                                                                   |
| `src/features/<domain>/index.ts`                 | Barrel — re-export public RTK Query hooks (rule 7). NO hook re-exports (rule "Hook location").                                                                                                                                                                                                             |
| `src/hooks/usePaginated<Domain>.ts` + `.spec.ts` | Wrappers around the paginated query endpoint. Use `usePaginatedQuery` if multiple paginations exist; otherwise inline.                                                                                                                                                                                     |
| `src/hooks/useInfiniteScrollSentinel.ts`         | Sentinel-ref IntersectionObserver, only if `@dcl/hooks` `useInfiniteScroll` doesn't fit (it operates on window scroll; use sentinel for `overflow:auto` containers). Already exists post-`migrate-social-dapps`.                                                                                           |
| `src/pages/<area>/<Page>.tsx` + `.styled.ts`     | Page component. Setea `<Helmet>` con title async, llama `useBlogPageTracking({ name, properties })`. Container con `paddingTop: 64` mobile / `96` desktop (rule 13).                                                                                                                                       |
| `src/pages/<area>/<Area>NotFoundPage.tsx`        | Catch-all dentro del area path (`/<area>/*`).                                                                                                                                                                                                                                                              |
| `src/components/<area>/<Component>/...`          | Componentes UI con `*.styled.ts` co-located, object-syntax styled. List-row components wrapped in `memo()` (rule 11). NO `className` selectors — every child is its own styled (feedback `no_classname_in_styled_components`).                                                                             |

## Files to modify

| Path                                         | Cambio                                                                                                                                                                             |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                                | Add `lazy(() => import('./pages/<area>/<Page>'))` and place `<Route path="/<path>/..." />` **inside** `<Route element={<DappsShell />}>`.                                          |
| `src/shells/store.ts`                        | Register `[<dapp>Client.reducerPath]: <dapp>Client.reducer` and concat its middleware.                                                                                             |
| `src/shells/DappsShell.tsx`                  | If pages use `<Helmet>`, wrap children with `<HelmetProvider>` (already done in master post-social migration — verify it's there).                                                 |
| `src/components/Layout/Layout.helpers.ts`    | Extend `isPageTrackingExempt` with `pathname === '/<path>'` and `pathname.startsWith('/<path>/')` (rule 23 — Helmet+async title race).                                             |
| `src/config/env/{dev,stg,prd}.json`          | Add new env keys. Match `.zone` for dev/stg, `.org` for prd. Don't put secrets — these ship to client.                                                                             |
| `src/intl/{en,es,fr,ja,ko,zh}.json`          | Add `<namespace>.*` block. Use a node script to insert programmatically (avoids string-matching the trailing `}`). Validate parity + duplicate keys (rule 9).                      |
| `src/modules/segment.types.ts`               | Append new `SegmentEvent` enum entries with a clear prefix (`<DAPP>_*`).                                                                                                           |
| `.github/ISSUE_TEMPLATE/bug_report.yml`      | Add the new route to the `Page / Area` dropdown — the template explicitly says "Keep options in sync with the routes defined in src/App.tsx". Format: `<Dapp> — <Page> (/<path>)`. |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Add a matching entry to the `Area` dropdown.                                                                                                                                       |

## Gotchas (paid in blood)

- **`decentraland-ui2` does NOT export `muiIcons` or a JumpIn `modalProps.title/description/buttonLabel` API** in v3.7+. Source dapps using these will need rewrites: `import CheckIcon from '@mui/icons-material/Check'` and a custom `<CommunityJumpInButton />` (or equivalent) that calls `launchDesktopApp({ communityId })` with `DownloadModal` fallback. Pattern in `src/components/jump/JumpInButton/JumpInButton.tsx`.
- **Reuse existing components first**. Check `LiveNowCardItem` (whats-on event card), `EventDetailModal`, `useEventDetailModal` before writing your own. Source dapps often render their own card — DRY by mapping the dapp's event shape into `EventEntry` and reusing the whats-on card. The social migration ended up doing exactly this.
- **`decentraland-ui2` is ESM-only and Jest can't transform it**. UI specs MUST `jest.mock('decentraland-ui2', ...)` AND `jest.mock('./<Component>.styled', ...)`. See `src/components/social/CommunityDetail/MembersList/MembersList.spec.tsx` for the forwardRef-with-prop-filtering pattern. Don't try to make ts-jest transform `decentraland-ui2` — that's the wrong layer.
- **`import.meta.env` in `src/config/index.ts`** doesn't compile under ts-jest. Specs that touch `getEnv()` transitively MUST `jest.mock('../../config/env', () => ({ getEnv: () => 'https://...' }))`.
- **`decentraland-crypto-fetch` references global `Request`**, missing in older jsdom. The base-client smoke spec must `jest.mock('decentraland-crypto-fetch', () => ({ signedFetchFactory: () => async () => new Response('{}') }))` BEFORE `import { <dapp>Client }`.
- **No top-level throws in shell-reachable files** (rule 16). All env getters are lazy (`getXxxUrl()` throws on call, not on import). One throw at module top crashes the whole DappsShell chunk.
- **No `import { store }` in endpoint files** (rule 17). Use `onQueryStarted` for dispatch, `endpoint.select()(state)` for reads.
- **Mutations must be immutable** (rule 22). When enriching cached responses, build a `Map`/spread new objects — never mutate `draft.data.results[i]` keys directly outside of `updateQueryData`.
- **`?action=...` auto-execute pattern**: when the CTA redirects unauthenticated users to SSO, append `?action=join|requestToJoin`. After auth, the page re-renders with identity AND the action param, runs the mutation once via `useEffect` + `executedActionRef`, then strips the param via `navigate({ search: '' }, { replace: true })`. See `CommunityDetail.tsx`.
- **`HelmetProvider` must wrap the lazy heavy chunk**. The DappsShell already does this post-social migration. New heavy pages don't need their own provider.
- **Source dapps use `getRandomRarityColor(theme)` (Math.random per render)** — do NOT port this directly. Make it deterministic by seed (e.g. address) so avatars don't flicker on rerender. See `getRarityColor(theme, seed)` in `src/features/communities/communities.helpers.ts`.

## Verification (in order — no skipping)

1. `npm run format`
2. `npm run lint:fix` — re-run if it auto-fixed
3. `npm run lint:pkg`
4. `npm run build` — catches stricter TS than `tsc --noEmit` and surfaces missing decentraland-ui2 exports
5. `npm test` — must include the smoke test asserting the new reducer is registered (rule 6)
6. `npm run preview` + Chrome DevTools MCP for the route. Check: signed-in vs not, public vs private/gated, mobile breakpoint vs desktop, infinite scroll fires fetches, navbar clearance, Helmet title, page tracking fires AFTER title resolves.
7. i18n parity one-liner before pushing:
   ```bash
   for f in en es fr ja ko zh; do node -e "const j=require('./src/intl/$f.json'); if(!j.<namespace>?.<known_subkey>) throw new Error('$f missing'); console.log('$f ok')"; done
   ```
8. Run `pr-review-toolkit:code-reviewer` on `git diff master...HEAD`. Treat P0/P1 as blockers.

## Out of scope by default (ask explicitly to add)

- Navbar item / nav menu wiring
- SEO rewrite for the new path (most absorbed dapps are auth-gated → no SEO benefit)
- Vite manualChunks tweaks (current chunks already cover most patterns)
- Deleting the standalone source repo (separate operation, after merge)
- Web3 in-page wallet connect (explicitly dropped)

## Reference: prior migrations

- `whats-on` — events flow + admin
- `blog` — Contentful + Algolia
- `jump` — deep-link handler
- `social` — communities (most recent; `feat/migrate-social-dapps` branch is the canonical example)
