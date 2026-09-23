# AI Agent Context

Orientation for an agent that has not read this codebase yet. `CLAUDE.md` at the repo root is the authoritative source for architecture, conventions and the pre-PR rules; this file only gives the shape of the project. When the two disagree, `CLAUDE.md` wins and this file is the one that needs fixing.

## What this is

`sites` (`@dcl/sites`) is the Vite/React SPA behind `decentraland.org`. It started as the landing page replacement for a Gatsby app and has since absorbed most of the standalone dapps (events, blog, jump, social, places, cast, storage, account, reels, profile, report), each as a lazy-loaded route group rather than a separate deployment.

## Architecture in one paragraph

Routes live on three tiers so the homepage stays fast. Lightweight routes ship in the main bundle with no Redux and no Web3. Heavy routes render inside `src/shells/DappsShell.tsx`, which boots the Redux store and the RTK Query middleware only when one of them is visited. A third shell, `src/shells/BlockchainShell.tsx`, dynamically imports the Web3 stack and mounts only for the few account actions that need a signer. Code reachable from a lightweight route must never import `src/shells/*`; `npm run lint:shells` enforces that by walking the import graph. The full route map and the tier rules are in `CLAUDE.md` > Architecture: Dual Shell.

## Where things live

| Path                            | What                                                                |
| ------------------------------- | ------------------------------------------------------------------- |
| `src/App.tsx`                   | Router. Splits routes across the three tiers.                       |
| `src/shells/`                   | `DappsShell`, `BlockchainShell`, the Redux store and its listeners. |
| `src/services/<name>Client.ts`  | RTK Query base clients (infra only, no endpoints).                  |
| `src/features/<domain>/`        | Endpoints injected into a base client, plus domain logic.           |
| `src/pages/`, `src/components/` | Pages and components, with a subdirectory per absorbed dapp.        |
| `src/intl/`                     | Six locales, `en.json` is the source of truth.                      |
| `src/config/env/`               | Per-environment JSON, read through `getEnv()`.                      |
| `scripts/`                      | Build helpers plus the `lint:i18n` and `lint:shells` checks.        |
| `api/seo.ts`                    | Preview-only Vercel function for blog OG meta.                      |
| `docs/domains/*.md`             | Per-dapp file maps. Read the one matching the task.                 |

## Data and auth

Remote data goes through RTK Query: base clients in `src/services/`, endpoints injected from `src/features/`. Content for the marketing pages comes from Contentful through `cms-api.decentraland.org`. Authentication is localStorage-based on every tier (`useWalletAddress`, `useAuthIdentity`), and mutations sign their payload through `signedFetch`. Private caches are keyed by the signed-in account and cleared on account change, so cached data cannot leak between wallets.

## Stack

React 18, React Router 7, Vite 8, TypeScript 5.9, Redux Toolkit 2 with RTK Query, `decentraland-ui2` (MUI-based) for UI, Jest 29 with ts-jest and React Testing Library, ESLint 9 with Prettier. Node `>=22.12`, npm `>=10`. Web3 (`wagmi`, `viem`, `magic-sdk`, `thirdweb`, `@dcl/core-web3`) is present but loads only behind `BlockchainShell`.

## Deployment

Vercel is preview-only. Production is served by the `sites-deployer` Cloudflare Worker from a CDN bundle, which also owns the OG meta and the per-route headers. Anything configured in `vercel.json` or `api/seo.ts` affects previews only; verify a production header or title against the live site, not against those files. See `CLAUDE.md` > Deployment.
