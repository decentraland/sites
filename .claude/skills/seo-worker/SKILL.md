---
name: seo-worker
description: Use when editing the Vercel SEO function (`api/seo.ts`), the rewrite rules (`vercel.json`), or anything CMS-origin related across env config and the vite dev proxy. Covers the OG/Twitter meta rewrite flow, HTML escaping, origin allowlist, and the CMS_BASE_URL coherence rule. Triggers on edits to `api/seo.ts`, `vercel.json`, `src/config/env/{dev,stg,prd}.json`, or `vite.config.ts` (proxy section). Also on mentions of "SEO", "OG tags", "open graph", "Twitter card", "crawler", "Helmet titles", "Vercel function", "CMS_BASE_URL", "Contentful API", "PAGES map".
---

# seo-worker

`api/seo.ts` is the SEO layer that makes blog content shareable. Crawlers (Twitter, Facebook, Discord, Slack) don't run JavaScript — Helmet titles set client-side are invisible to them. This serverless function rewrites OG meta at the edge before the HTML reaches the crawler.

## Flow

`vercel.json` rewrites `/blog/:path*` to `/api/seo?path=...`. On request, `api/seo.ts`:

1. Parses the path (post, category, author, search, or unknown).
2. Fetches relevant metadata from `cms-api.decentraland.org/spaces/ea2ybdmmn1kv/environments/master`.
3. Loads the static `dist/index.html` shell, rewrites `og:*` / `twitter:*` / canonical meta tags with the fetched values, and returns.
4. Applies **strict HTML escaping** + path sanitization + canonical origin allowlist (`decentraland.org`, `decentraland.zone`, `decentraland.today`).
5. Sets `Cache-Control: 1 hour, stale-while-revalidate 14 hours`.

## CMS_BASE_URL coherence (Pre-PR rule 15)

All `CMS_BASE_URL` references MUST point to the same origin (`cms-api.decentraland.org`):

- `src/config/env/dev.json`
- `src/config/env/stg.json`
- `src/config/env/prd.json`
- `api/seo.ts` (fallback)
- `vite.config.ts` (dev proxy target)

Shared HTTP cache and ETag revalidation depend on this. Diverging origins forfeit the cache.

The dev proxy `/api/cms` rewrite must substitute the **full upstream path** (`/spaces/ea2ybdmmn1kv/environments/master`), not just strip the local prefix.

## Security checklist for new template paths

When adding a new `path` handler to `api/seo.ts`:

- **HTML-escape every interpolated value.** Never use raw CMS strings in meta content — they're attacker-controllable through CMS fields.
- **Enforce the origin allowlist** before setting `canonical` / `og:url`. Don't blindly accept any URL from the CMS.
- **Sanitize the path** before using it in fetch URLs — strip `..`, query strings, fragments.

## Adding a new shareable static route

When you add a non-blog shareable route (homepage variant, campaign landing, etc.) to the SPA:

1. Add the pathname to the SEO worker's `PAGES` map in **`sites-deployer`** (`workers/sites-worker/rollouts/routes/handlers/OpenGraphStaticPageRoute.ts`). This is a separate repo from sites.
2. Skip if non-shareable or already covered by a dedicated handler (invite, reels).

Crawlers don't run JS — Helmet titles aren't visible; the worker rewrites OG meta at the edge based on this map.

## Pitfalls

- Setting `CMS_BASE_URL` to a different origin in one env file → cache fragmented across origins, ETag revalidation fails.
- Forgetting HTML escaping on a new interpolated value → stored XSS via CMS fields.
- Bypassing the origin allowlist "just for this campaign URL" → open redirect surface.
- Adding a shareable route to the SPA without updating `sites-deployer` PAGES → crawlers get the generic homepage OG tags, sharing previews look broken.
- Touching the `dist/index.html` shell template without re-running `npm run build` — the function reads the built file, not source.
- Adding `llms.txt` or other parallel metadata files to address a Lighthouse warning when sites' 4-layer SEO architecture (Helmet client-side, `api/seo.ts` for blog, sites-deployer worker for static pages, sitemap) already covers it.

## issue_comment workflows note

`.github/workflows/*.yml` files triggered by `issue_comment` (like `/lighthouse`) run from master, not from the PR's branch. Edits to those workflow files in a PR don't apply to that PR's command runs — only post-merge.
