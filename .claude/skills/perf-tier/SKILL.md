---
name: perf-tier
description: Use when changing the build config, lazy-loading, manual chunks, hero prerender, or any code that affects Lighthouse scores / LCP / bundle size. Covers the dual-shell lazy boundaries, manual chunks setup (including the CSS gotcha), hero prerender, and deferred analytics. Triggers on edits to `vite.config.ts`, `scripts/prerender-hero.mjs`, `src/modules/DeferredAnalyticsProvider.tsx`, `src/modules/deferredThirdParty.ts`, `src/App.tsx` (lazy imports). Also on mentions of "LCP", "Lighthouse", "manualChunks", "modulePreload", "hero prerender", "lazy loading", "deferred analytics", "Core Web Vitals", "bundle size", "render-blocking".
---

# perf-tier

The homepage Lighthouse score is the headline metric. Every kilobyte added to the main bundle, every render-blocking stylesheet, and every eager network request costs LCP / FCP / TBT points. The dual-shell architecture exists to protect this.

## Lazy boundaries

- **Hero prerender** (`scripts/prerender-hero.mjs`) — injects a static HTML shell + critical CSS into `dist/index.html` at build time so LCP paints **before** React mounts.
- **`<Layout />` is lazy** — `const Layout = lazy(...)` in `src/App.tsx`. Keeps `decentraland-ui2`'s Navbar (~1.3MB of MUI) out of the critical path until after hero paint.
- **`<DappsShell />` is lazy** — Redux, RTK Query, Contentful renderer, dompurify, livekit-client (`@livekit/components-react`) and the per-dapp endpoint code only load when a user navigates to `/events/*`, `/blog/*`, `/jump/*`, `/social/*`, `/cast/*`, `/storage/*`, or `/profile/*`.
- **Deferred analytics** — Segment (`DeferredAnalyticsProvider`) and Contentsquare (`scheduleDeferredThirdParty`) activate via `requestIdleCallback` with a 4s fallback timeout.

## Manual chunks (vite.config.ts)

The build splits these JS-only vendor chunks for cache stability across releases:

- `vendor-sentry`
- `vendor-schemas` (ajv)
- `vendor-crypto` (`@dcl/crypto`, `eth-connect`)
- `vendor-intl`
- `vendor-ua`
- `vendor-router`
- `vendor-livekit` (JS-only, no CSS — see gotcha below)

Five of them (`vendor-sentry|crypto|schemas|ua|livekit` — see the regex in `vite.config.ts` `modulePreload.resolveDependencies`) are filtered out of module preload so they don't get eagerly fetched on routes that never load them; `vendor-intl` and `vendor-router` ARE preloaded.

### CSS gotcha (read this)

**Packages that ship CSS (e.g. `@livekit/components-styles`) must NOT live inside `manualChunks`.** Vite injects their stylesheet as a render-blocking `<link rel="stylesheet">` on **every page** even when the JS is filtered out of `modulePreload`.

Keep CSS-bearing packages outside `manualChunks` so the CSS rides with the importing lazy chunk and only loads on the route that actually needs it.

**Verify after any `manualChunks` change:**

```bash
grep "modulepreload\|stylesheet" dist/index.html
```

Nothing related to a lazy route (livekit, cast, whats-on) should appear in `dist/index.html`. If it does, the chunk needs to move out of `manualChunks`.

## Pitfalls

- Adding a new JS package to `manualChunks` without checking whether it ships CSS → adds render-blocking CSS to every page.
- Importing from `src/shells/*` in a lightweight route → defeats the whole `DappsShell` lazy boundary.
- Top-level `throw` in any module reachable from `src/shells/store.ts` → crashes the lazy chunk load entirely. See skill `shell-safe-imports`.
- Hero prerender mismatch: changes to the landing hero must be mirrored in `scripts/prerender-hero.mjs` — otherwise the prerendered HTML doesn't match what React renders, causing FOUC.
- Eager-loading the Layout (removing the `lazy()` around it) → 1.3MB of MUI on the critical path.
- Adding parallel metadata files (llms.txt, secondary OG maps) just to clear a Lighthouse warning when the SEO worker already covers it → adds a maintenance vector with no benefit.

## Verification

After build / chunk changes:

```bash
npm run build && grep "modulepreload\|stylesheet" dist/index.html
```

For LCP-specific work, see skill `chrome-devtools-mcp:debug-optimize-lcp`.
