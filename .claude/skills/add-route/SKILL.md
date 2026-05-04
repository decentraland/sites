---
name: add-route
description: Use when adding a new route/page to the SPA. Decides lightweight vs heavy (DappsShell) tier, enforces the dual-shell boundary, and adds the navbar clearance that fixed-position layout requires. Triggers on "new page", "new route", "add route", "create page", or edits to src/App.tsx.
---

# add-route

This SPA has a **dual shell**. Routes go in one of two tiers — picking the wrong one breaks Lighthouse on the homepage or unnecessarily ships Redux to a static page.

## Decision

**Lightweight** (no Redux, no RTK Query, no Web3, no heavy CMS deps):

- Marketing pages, legal pages, download flow, sign-in landing, invite, brand, content, ethics, etc.
- Data via `useSyncExternalStore`-based clients (see `src/features/events/events.client.ts`, `src/features/profile/profile.client.ts`).

**Heavy** (mounted under `<DappsShell />`):

- Anything that needs Redux/RTK Query (`/whats-on/*`, `/blog/*`).
- Pages that consume Contentful rich-text, Algolia, dompurify.

If unsure, default to **lightweight**.

## Steps — lightweight route

1. Create page at `src/pages/<route>/<Route>.tsx` (or `src/pages/<route>.tsx` for a single file).
2. In `src/App.tsx`, add `const MyPage = lazy(() => import('./pages/<route>'))`.
3. Place `<Route>` **inside** `<Route element={<Layout />}>` block, **outside** `<Route element={<DappsShell />}>`.
4. Data access: co-locate a `useSyncExternalStore` client under `src/features/<domain>/` mimicking `features/events/` or `features/profile/`. **Do NOT** import from `src/shells/*`, `src/services/*`, `src/features/{blog,search,whats-on-events}/*`.
5. Add navbar clearance to the page's outer container (rule 13):
   ```ts
   const Container = styled(Box)(({ theme }) => ({
     paddingTop: 64,
     [theme.breakpoints.up('md')]: { paddingTop: 96 }
   }))
   ```
6. If the page sets `<title>` via Helmet + async data, follow rule 23 (call `useBlogPageTracking` or sibling, extend Layout's skip list). Otherwise the existing `usePageTracking(pathname)` from Layout fires correctly.
7. i18n keys: namespace `page.<route>.*` for meta, follow `add-i18n-key` skill for parity.

## Steps — heavy route

1. Create page at `src/pages/<area>/<Route>.tsx` (e.g. under `src/pages/whats-on/` or `src/pages/blog/`).
2. In `src/App.tsx`, add `const MyPage = lazy(() => import('./pages/<area>/<route>'))`.
3. Place `<Route>` **inside** `<Route element={<DappsShell />}>` block.
4. RTK Query: inject endpoints into an existing client (`cmsClient`, `algoliaClient`, or `whatsOnEventsClient`). New base client → `src/services/<name>Client.ts` and register in `src/shells/store.ts`.
5. Same navbar clearance rule (step 5 above).
6. If using Helmet + async title: rule 23.

## Verification

```bash
npm run build && npm run preview
```

Then navigate the new route at `http://localhost:4173/<route>` and dynamic variants. **Vite dev is more permissive than the prod build** — a passing dev does NOT guarantee prod (rule 14).

Visually verify navbar clearance with Chrome DevTools at 375px and 1280px widths.

## Boundary check

Grep before pushing:

```bash
git diff master...HEAD --name-only | xargs grep -l "from ['\"].*shells/" 2>/dev/null
```

Hits outside `src/App.tsx` and `src/shells/` itself = boundary violation (rule 2).

## Pitfalls

- Forgetting clearance → page content sits behind the fixed navbar.
- Adding Redux to a marketing page → ships ~580KB unnecessarily.
- Importing `useBlogPageTracking` from a non-Helmet route → double `page()` events.
- Skipping `npm run preview` → CJS-heavy deps explode at runtime in prod (rule 14).
