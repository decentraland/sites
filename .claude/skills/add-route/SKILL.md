---
name: add-route
description: Use when adding a new route/page to the SPA. Decides Layout-less vs lightweight vs heavy (DappsShell) tier, enforces the dual-shell boundary, and adds the navbar clearance that fixed-position layout requires. Triggers on "new page", "new route", "add route", "create page", or edits to src/App.tsx.
---

# add-route

This SPA has a **dual shell with a third Layout-less group**. Routes go in one of three tiers — picking the wrong one breaks Lighthouse on the homepage, unnecessarily ships Redux to a static page, or paints content behind the fixed navbar.

## Decision

**Lightweight** (default — no Redux, no RTK Query, no Web3, no heavy CMS / LiveKit deps):

- Marketing pages, legal pages, sign-in landing, brand, content, ethics, help, press, discord, report, etc.
- Data via `useSyncExternalStore`-based clients (see `src/features/events/events.discovery.ts`, `src/features/profile/profile.client.ts`, `src/features/reels/reels.client.ts`).

**Heavy** (mounted under `<DappsShell />`):

- Anything that needs Redux/RTK Query.
- Pages that consume Contentful rich-text, dompurify, LiveKit, full-text search.
- Existing heavy areas you can mirror: `/whats-on/*`, `/blog/*`, `/jump/*`, `/social/*`, `/cast/*`, `/storage/*`.

**Layout-less** (rare — fullscreen UX that bypasses navbar + footer):

- Currently `/reels/*`, `/download`, `/download_success`, `/invite/:referrer`.
- Same rules as lightweight (no Redux, no Web3) but the `<Route>` is placed BEFORE the `<Route element={<Layout />}>` block in `src/App.tsx`.
- Choose this only when the immersive UX is the whole point of the page; it sacrifices the shared header/footer.

If unsure, default to **lightweight (with Layout)**.

## Steps — lightweight route

1. Create page at `src/pages/<route>/<Route>.tsx` (or `src/pages/<route>.tsx` for a single file).
2. In `src/App.tsx`, add `const MyPage = lazy(() => import('./pages/<route>'))`.
3. Place `<Route>` **inside** `<Route element={<Layout />}>` block, **outside** `<Route element={<DappsShell />}>`.
4. Data access: co-locate a `useSyncExternalStore` client under `src/features/<api>/` mimicking `features/events/events.discovery.ts`, `features/profile/`, or `features/reels/`. **Do NOT** import from `src/shells/*`, `src/services/*`, or any heavy-tier feature directory: `features/{cms,places,communities,cast2,storage}/*`, nor the RTK Query files in `features/events/` (`events.client.ts`, `events.admin.client.ts`) — only `events.discovery.ts` is lightweight.
5. Add navbar clearance to the page's outer container (rule 13):
   ```ts
   const Container = styled(Box)(({ theme }) => ({
     paddingTop: 64,
     [theme.breakpoints.up('md')]: { paddingTop: 96 }
   }))
   ```
6. If the page sets `<title>` via Helmet + async data, follow rule 23 (call `useBlogPageTracking` or sibling, extend `Layout.helpers.ts:isPageTrackingExempt`). Otherwise the existing `usePageTracking(pathname)` from Layout fires correctly.
7. i18n keys: namespace `page.<route>.*` for meta, follow `add-i18n-key` skill for parity.

## Steps — heavy route

1. Create page at `src/pages/<area>/<Route>.tsx` (e.g. under `src/pages/whats-on/`, `src/pages/blog/`, `src/pages/jump/`, `src/pages/social/`, `src/pages/cast/`, `src/pages/storage/`).
2. In `src/App.tsx`, add `const MyPage = lazy(() => import('./pages/<area>/<route>'))`.
3. Place `<Route>` **inside** `<Route element={<DappsShell />}>` block. If the area needs an extra Outlet wrapper (LiveKit + Notification contexts for cast, layout chrome for whats-on), add a per-area Layout component and nest the routes under it (see `WhatsOnLayout`, `CastLayout`).
4. RTK Query: prefer injecting endpoints into an existing base client (`cmsClient`, `placesClient`, `socialClient`, `cast2Client`, `storageClient`, `subgraphClient`, `eventsClient`, `adminClient`). Only add a new base client under `src/services/<name>Client.ts` (and register the reducer + middleware in `src/shells/store.ts`) when the new domain genuinely doesn't fit any existing one.
5. Same navbar clearance rule (step 5 above).
6. If using Helmet + async title: rule 23.

## Steps — Layout-less (fullscreen) route

1. Create page at `src/pages/<area>/<Page>.tsx`.
2. In `src/App.tsx`, place the `<Route>` BEFORE the `<Route element={<Layout />}>` block (mirror reels / download / invite).
3. No navbar clearance — there is no navbar to clear.
4. Same data + import restrictions as the lightweight tier.
5. Helmet titles still follow rule 23 if the title resolves async.

## Keep README in sync

The route table under "What lives here" in `README.md` is curated by hand — there is no codegen. Any time you **add, remove, or rename** a route in `src/App.tsx`, update the matching row in `README.md` **in the same PR**:

- Route column: every public-facing path (including legacy aliases worth advertising).
- Notes column: 404 catch-alls (`/area/*`), legacy redirects, and tier-specific quirks (`fullscreen`, `Heavy DappsShell route`, etc.).

If the change is purely internal (component rename, lazy-import path, comment) and no public path changes, the README is fine as is.

A `PostToolUse` hook fires on every edit to `src/App.tsx` to surface this reminder.

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
