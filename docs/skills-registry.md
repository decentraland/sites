# Skills registry

Human-readable index of all project-level skills, hooks, and per-dapp docs. **Single source of truth for governance** — when paths or Pre-PR rules change, audit this file first so the `SKILL.md` descriptions and CLAUDE.md pointers stay in sync.

No tooling generates from this file. It's a manual index. If you add a skill, hook, or Pre-PR rule and forget to update here, the project drifts silently — that's the failure mode this file exists to catch.

## Active skills

Each row maps to a `SKILL.md` under `.claude/skills/<name>/`.

| Skill                     | Trigger paths                                                                                                                                          | Trigger keywords                                                                                                             | Pre-PR rules                              | Cross-refs                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `add-route`               | `src/App.tsx`                                                                                                                                          | "new page", "new route", "add route", "create page"                                                                          | 2 (boundary check), 13 (navbar clearance) | `docs/domains/*`                                           |
| `add-i18n-key`            | `src/intl/*.json`                                                                                                                                      | "translation", "i18n", "locale", "intl"                                                                                      | 9 (parity, dupes)                         | —                                                          |
| `auth-flow`               | `src/hooks/useWalletAddress.ts`, `useAuthIdentity.ts`, `src/utils/signedFetch.ts`                                                                      | "auth", "identity", "wallet", "sign-in", "sign-out", "SSO", "signedFetch"                                                    | —                                         | `docs/domains/{whats-on,social,storage,blog}.md`           |
| `avatar-background-color` | `**/avatar*`, `**/*.styled.ts` (Avatar\*)                                                                                                              | "avatar", "AvatarFace", "AvatarImage", "profile picture"                                                                     | —                                         | —                                                          |
| `coverage-guard`          | (on-demand)                                                                                                                                            | "/coverage-guard", "check coverage", "coverage floor"                                                                        | 6 (95% floor)                             | dispatches `coverage-keeper` agent                         |
| `migrate-dapp`            | (on-demand)                                                                                                                                            | "migrate dapp", "absorb X", "port X"                                                                                         | —                                         | `docs/domains/*`                                           |
| `perf-tier`               | `vite.config.ts`, `scripts/prerender-hero.mjs`, `src/modules/DeferredAnalyticsProvider.tsx`, `src/modules/deferredThirdParty.ts`, `src/App.tsx` (lazy) | "LCP", "Lighthouse", "manualChunks", "modulePreload", "lazy loading", "deferred analytics", "Core Web Vitals", "bundle size" | —                                         | `docs/domains/cast.md` (LiveKit CSS)                       |
| `pre-pr-review`           | (on-demand, before `gh pr create`)                                                                                                                     | "create PR", "open pull request", "ready to push", "pre-PR check"                                                            | 1 (code-reviewer dispatch)                | dispatches `pr-review-toolkit:code-reviewer` agent         |
| `rtk-query-split`         | `src/services/*Client.ts`, `src/features/*/*.client.ts` (and `*.admin.client.ts`, `*.search.client.ts`)                                                | "RTK Query", "injectEndpoints", "transformResponse", "onQueryStarted", "base client", "endpoint injection", "reducerPath"    | 17, 18                                    | `docs/domains/{whats-on,blog,jump,social,cast,storage}.md` |
| `seo-worker`              | `api/seo.ts`, `vercel.json`, `src/config/env/{dev,stg,prd}.json`, `vite.config.ts` (proxy)                                                             | "SEO", "OG tags", "open graph", "Twitter card", "crawler", "Helmet titles", "Vercel function", "CMS_BASE_URL", "PAGES map"   | 15 (CMS origin coherence)                 | `docs/domains/blog.md`                                     |
| `shell-safe-imports`      | `src/shells/store.ts`, `src/services/*Client.ts`, `src/features/*/*.client.ts`                                                                         | "top-level throw", "env var validation", "lazy chunk", "DappsShell crash", "shell-reachable", "module top-level"             | 16 (no top-level throws)                  | —                                                          |

## Per-dapp directory docs

Reference docs for per-dapp file maps. **Not skills** — no auto-load. Read on demand when working in that dapp.

| Doc                        | Covers                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `docs/domains/whats-on.md` | `src/features/events/`, `components/whats-on/`, `pages/whats-on/`. Events API + admin + lightweight discovery client. |
| `docs/domains/blog.md`     | `src/features/cms/`, `src/services/cmsClient.ts`, `src/shared/blog/`. Contentful + cms-server.                        |
| `docs/domains/jump.md`     | `src/features/places/`, `src/services/placesClient.ts`. Launcher deep-link resolution.                                |
| `docs/domains/social.md`   | `src/features/communities/`, `src/services/socialClient.ts`. Communities API.                                         |
| `docs/domains/cast.md`     | `src/features/cast2/`, `src/services/cast2Client.ts`. LiveKit streaming.                                              |
| `docs/domains/storage.md`  | `src/features/storage/`, `src/services/storageClient.ts`, `src/services/subgraphClient.ts`. Storage + subgraph.       |
| `docs/domains/reels.md`    | `src/features/reels/`, `components/Reels/`. Layout-less, lightweight tier.                                            |
| `docs/domains/report.md`   | `src/features/report/`, `components/Report/`. Lightweight, no RTK Query.                                              |

## Active hooks (auto-fire)

Configured in `.claude/settings.json`.

| Hook                             | Event                                    | Purpose                                                                                                                         | Token cost when silent     |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `session-start.sh`               | SessionStart                             | Prints branch + reminders into context                                                                                          | ~200 chars/session         |
| `pre-bash-block-destructive.sh`  | PreToolUse(Bash)                         | Blocks `rm -rf src/`, force-push to master, `--package-lock-only`, `--no-verify`, `reset --hard`, `clean -fd`, branch -D master | 0 (silent unless blocking) |
| `pre-write-warn-package-lock.sh` | PreToolUse(Edit/Write/MultiEdit)         | Warns on `package.json` / `package-lock.json` / `src/config/env/*.json` edits                                                   | 0 (silent unless match)    |
| `pre-write-warn-classname.sh`    | PreToolUse(Edit/Write/MultiEdit) on .tsx | Warns when introducing `className=` (violates the styled-components-only rule)                                                  | 0 (silent unless match)    |
| `post-edit-i18n-parity.sh`       | PostToolUse(Edit/Write/MultiEdit)        | Reminds about 5 locale siblings when `src/intl/*` is edited                                                                     | 0 (silent unless match)    |
| `post-edit-routes-readme.sh`     | PostToolUse(Edit/Write/MultiEdit)        | Reminds about README route table when `src/App.tsx` is edited                                                                   | 0 (silent unless match)    |

**Removed:** `stop-coverage-guard.sh` (Stop hook) — was auto-dispatching the `coverage-keeper` agent on every Stop after `src/**` / `api/**` edits. Removed on 2026-05-20 for token cost. Coverage floor (rule 6) still applies as policy; run `/coverage-guard` skill on demand.

## Pre-PR rules → skill mapping

Quick lookup for which skill (if any) owns each Pre-PR rule. Rules without a skill live entirely in CLAUDE.md.

| Rule  | Topic                                                                                     | Owned by                                           |
| ----- | ----------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1     | Code-reviewer agent dispatch                                                              | skill `pre-pr-review`                              |
| 2     | Architectural boundary check                                                              | CLAUDE.md (Architecture > Dual Shell)              |
| 3     | YAGNI                                                                                     | CLAUDE.md                                          |
| 4     | DRY                                                                                       | CLAUDE.md                                          |
| 5     | Behavior changes / NOTE comments                                                          | CLAUDE.md                                          |
| 6     | Test coverage (95% floor)                                                                 | skill `coverage-guard`                             |
| 7     | Barrel exports                                                                            | CLAUDE.md (also referenced from `rtk-query-split`) |
| 8     | ESLint scope                                                                              | CLAUDE.md                                          |
| 9     | i18n parity + no dupe keys                                                                | skill `add-i18n-key`                               |
| 10    | Error handling (no raw bodies to UI)                                                      | CLAUDE.md                                          |
| 11    | List rendering (memo)                                                                     | CLAUDE.md                                          |
| 12    | N+1 hot paths                                                                             | CLAUDE.md                                          |
| 13    | Navbar clearance                                                                          | skill `add-route`                                  |
| 14    | Prod build + dynamic routes                                                               | CLAUDE.md                                          |
| 15    | CMS origin + vite proxy coherence                                                         | skill `seo-worker`                                 |
| 16    | No module-top-level throws                                                                | skill `shell-safe-imports`                         |
| 17    | RTK Query no direct store imports                                                         | skill `rtk-query-split`                            |
| 18    | RTK Query no internal cache state                                                         | skill `rtk-query-split`                            |
| 19-25 | Extended rules (XSS, URL validation, lockfile, immutable cache, page tracking, props, sx) | `docs/pre-pr-rules-detail.md`                      |

## When to update this file

- **New skill added** → add row to "Active skills" + update "Pre-PR rules → skill mapping" if it claims any rules.
- **Skill description changes** → update triggers / paths / keywords here, keep them in sync with the `SKILL.md` frontmatter.
- **Pre-PR rule added/moved/deleted** → update "Pre-PR rules → skill mapping" + the CLAUDE.md Pre-PR section.
- **Hook added/removed** → update "Active hooks".
- **New per-dapp doc** → add to "Per-dapp directory docs".
- **Skill deleted** → remove its row AND grep the repo for `skill `<name>`` pointers in CLAUDE.md, other skills, and per-dapp docs.
