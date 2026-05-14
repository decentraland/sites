# Decentraland Sites

[![Coverage Status](https://coveralls.io/repos/github/decentraland/sites/badge.svg?branch=master)](https://coveralls.io/github/decentraland/sites?branch=master)

Decentraland's main website. A single Vite SPA that consolidates the homepage and several previously standalone dapps into one repository — module federation was retired and every absorbed app now ships as a native lazy-loaded route group.

## What lives here

| Section                    | Routes                                                                                                                                        | Notes                                                                                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing & marketing        | `/`, `/create`, `/discord`, `/press`, `/help`                                                                                                 | API-driven homepage (hero, missions/features, trending news, social proof, FAQ, banner CTAs).                                                                                                   |
| Legal                      | `/brand`, `/content`, `/ethics`, `/privacy`, `/referral-terms`, `/rewards-terms`, `/security`, `/terms`                                       | Static legal pages.                                                                                                                                                                             |
| Download                   | `/download`, `/download_success`, `/download/creator-hub`, `/download/creator-hub-success`                                                    | Desktop / Creator Hub installer flow. `/download` and `/download_success` are fullscreen (no shared navbar+footer).                                                                             |
| Onboarding                 | `/invite/:referrer`, `/sign-in`, `/report`, `/report/success`                                                                                 | Referral invite hero, SSO redirect bridge, in-world report form. `/report/players` redirects to `/report`.                                                                                      |
| Reels                      | `/reels`, `/reels/list/:address`, `/reels/:imageId`                                                                                           | Fullscreen viewer for in-game camera screenshots — migrated from `reels.decentraland.org`.                                                                                                      |
| What's on (events)         | `/whats-on`, `/whats-on/new-hangout`, `/whats-on/edit-hangout/:eventId`, `/whats-on/admin/pending-events`, `/whats-on/admin/users`            | Heavy DappsShell route. Legacy `/whats-on/new-event` and `/whats-on/edit-event/:eventId` redirect into the hangout flow; `/events/*` and `/places/*` paths redirect here with deep-link params. |
| Blog                       | `/blog`, `/blog/preview`, `/blog/search`, `/blog/sign-in`, `/blog/author/:authorSlug`, `/blog/:categorySlug`, `/blog/:categorySlug/:postSlug` | Contentful-backed CMS. Server-rendered Open Graph meta via `api/seo.ts`.                                                                                                                        |
| Jump (launcher deep-links) | `/jump`, `/jump/places`, `/jump/places/invalid`, `/jump/events`, `/jump/events/invalid`                                                       | Deep-link handler for the desktop launcher (`decentraland://`). Legacy `/jump/event` (singular) preserved for prod links.                                                                       |
| Social (communities)       | `/social/communities/:id`, `/social/*` (404)                                                                                                  | Community detail page, signed-fetch mutations.                                                                                                                                                  |
| Cast (browser streaming)   | `/cast/s/:token`, `/cast/s/streaming`, `/cast/w/:worldName/parcel/:parcel`, `/cast/w/:location`, `/cast` + `/cast/*` (404)                    | LiveKit-based streaming — migrated from `decentraland/cast2`.                                                                                                                                   |
| Storage service            | `/storage`, `/storage/select`, `/storage/env`, `/storage/scene`, `/storage/players`, `/storage/players/:address`, `/storage/*` (404)          | Migrated from the standalone storage-service-site.                                                                                                                                              |

The full route map and tier rules (Layout-less / lightweight / heavy DappsShell) live in `CLAUDE.md`.

## Architecture (one-line summary)

Three route tiers protect homepage Lighthouse performance:

- **Layout-less**: `/reels/*`, `/download`, `/download_success`, `/invite/:referrer`. Fullscreen — bypass navbar+footer.
- **Lightweight (with Layout)**: `/`, legal, marketing, sign-in, etc. No Redux, no Web3, data via `useSyncExternalStore` clients.
- **Heavy (`<DappsShell />` lazy chunk)**: every absorbed dapp. Boots Redux + RTK Query + the per-domain client only when the user navigates into one of these areas.

Authentication everywhere reads identity from `localStorage` via `useAuthIdentity` — no wagmi, magic-sdk, or thirdweb. Mutations on heavy routes sign requests via `signedFetch(identity)`.

Read `CLAUDE.md` before adding routes, RTK Query clients, i18n keys, or styled components.

## Getting started

### Prerequisites

- Node `^20.19.0 || >=22.12.0`
- npm `>=10`

### Install + run

```bash
npm ci
npm run dev
```

`npm run dev` starts Vite at `http://localhost:5173` with proxies for `/api/cms` (Contentful CMS) and `/auth` (SSO).

### Environment configuration

Environment values live in `src/config/env/{dev,stg,prd}.json` and are accessed via `getEnv('KEY')` from `src/config/env.ts`. The `@dcl/ui-env` package auto-selects the right file based on the hostname; override at runtime with `?env=dev|stg|prd`.

For build-time variables `scripts/prebuild.cjs` writes a generated `.env` from `process.env` (used by Vercel and GitHub Actions). Local development does not require a hand-written `.env` for the default flow.

`src/config/env/*.json` files ship in the client bundle — never put secrets, API keys, or tokens there. Server-only secrets belong in Vercel env vars, accessed from `api/seo.ts` via `process.env.*`.

## Common commands

```bash
npm run dev            # Vite dev server (+ /api/cms + /auth proxies)
npm run build          # prebuild + tsc -b + vite build + hero prerender
npm run preview        # Serve dist/ — required to validate prod-only failures (CLAUDE.md rule 14)
npm test               # Jest, co-located *.spec.ts(x) suites
npm run test:coverage  # Jest with coverage report
npm run format         # Prettier
npm run lint:fix       # ESLint
npm run lint:pkg       # package.json lint
```

## Testing

Tests are co-located alongside source as `*.spec.ts(x)`. Jest + React Testing Library; no separate `tests/` tree.

```bash
npm test                  # run the suite
npm run test:coverage     # run with coverage report
```

Conventions live in `CLAUDE.md` > Coding conventions > Testing — `describe('when …')` / `it('should …')`, `getByRole` over `getByText`, `jest.resetAllMocks()` in `afterEach`.

## Contributing

1. Branch: `<type>/<description>` (feat, fix, chore, docs, refactor, style, test).
2. Run the pre-PR gate (`format` → `lint:fix` → `lint:pkg` → `build` → `test`) — see `CLAUDE.md` > Pre-PR review for the full 25-rule checklist.
3. Single-line commits: `<type>: <summary>`. No `Co-authored-by`. No `--no-verify`.
4. Squash-merged to `master`.

## AI agent context

Detailed architecture context lives in `CLAUDE.md` (always loaded by Claude Code) and `docs/pre-pr-rules-detail.md` (extended rules 19–25). Project-level Claude config (skills, hooks, agents) lives under `.claude/` — see `.claude/README.md`.

For the long-form companion doc, see [docs/ai-agent-context.md](docs/ai-agent-context.md).

## License

Apache-2.0 — see [LICENSE](LICENSE).
