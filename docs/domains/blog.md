# blog

Decentraland blog. CMS-backed posts, categories, authors. Mounted under `<DappsShell />` (heavy route). Has dedicated SEO worker for crawler-visible OG meta.

## Routes

`/blog`, `/blog/preview`, `/blog/search`, `/blog/sign-in`, `/blog/author/:authorSlug`, `/blog/:categorySlug`, `/blog/:categorySlug/:postSlug`.

## Key paths

| Path                                  | Purpose                                                                                                                                                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/blog/`                     | Page components for the blog area (list, post detail, search, author, category, preview, sign-in).                                                                                                                            |
| `src/components/blog/`                | Blog-specific UI components (post cards, rich-text renderer, category nav, search input).                                                                                                                                     |
| `src/features/cms/cms.client.ts`      | RTK Query endpoints — blog post / category / author. Injects into `cmsClient`.                                                                                                                                                |
| `src/features/cms/cms.search.client.ts` | RTK Query endpoints — full-text search via cms-server. Injects into the same `cmsClient` (shared HTTP cache).                                                                                                               |
| `src/features/cms/cms.slice.ts`       | Normalized post entity adapter — selectors like `selectBlogPostById`. Populated via `onQueryStarted` upserts (NOT direct store imports from endpoint files — see skill `rtk-query-split` rule 17).                            |
| `src/features/cms/*.helpers.ts` / `*.mappers.ts` | Domain helpers, slug parsing, Contentful→view mapping.                                                                                                                                                              |
| `src/services/cmsClient.ts`           | RTK Query base — `cmsClient` (Contentful + cms-server search). Empty endpoints; injected from `features/cms/`. |
| `src/shared/blog/`                    | Domain types and utilities (dates, slugs, locations) for blog content.                                                                                                                                                        |
| `api/seo.ts`                          | Vercel function — rewrites OG/Twitter meta for `/blog/*` at the edge. Crawlers don't run JS. See skill `seo-worker`.                                                                                                          |

## Auth

Blog public endpoints don't need identity. `/blog/sign-in` uses a parallel redirect helper (`blogAuthRedirect`) that does NOT call `markSignInPending` — any wallet-switcher flow there will land on a stale wallet. See skill `auth-flow`.

## Page tracking (Helmet)

Blog routes set `<title>` via Helmet + async CMS data. They MUST use `useBlogPageTracking({ name, properties })` from `src/hooks/useBlogPageTracking.ts` instead of the default `usePageTracking(pathname)` — otherwise Segment grabs the previous title because Helmet writes the title asynchronously. Blog routes are also in `Layout.helpers.ts:isPageTrackingExempt` to skip the default tracker. See Pre-PR rule 23 in `docs/pre-pr-rules-detail.md`.

## Cross-references

- Skill `rtk-query-split` — RTK Query architecture + rules 17 & 18 (entity adapter pattern).
- Skill `seo-worker` — `api/seo.ts`, CMS_BASE_URL coherence, HTML escaping.
- Skill `auth-flow` — wallet hooks, `/blog/sign-in` edge case.
