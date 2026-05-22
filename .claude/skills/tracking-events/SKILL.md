---
name: tracking-events
description: Reference and investigation playbook for analytics tracking in sites. Use when locating where an event is fired, understanding the deferred-analytics provider, adding/changing a Segment event, debugging missing events in the warehouse, or reasoning about download/onboarding/Click funnels. Triggers on "Segment", "analytics event", "tracking", "useTrackClick", "useDeferredTrack", "useAnalytics", "data-event", "download_started", "download_success", "download_failed", "Onboarding Checkpoint", "REELS_*", "GO_TO_EXPLORER", "page tracking", "where is X fired", "what tracks X", "anon_user_id", "dónde se manda evento".
---

# tracking-events

The single source of truth for understanding analytics in sites. **Read top-to-bottom the first time** so the conventions stick; then use the section links as a reference.

## 1. The stack

- **Provider:** Segment (analytics-next). Initialized lazily via `DeferredAnalyticsProvider` (`src/modules/DeferredAnalyticsProvider.tsx`), which schedules the writeKey load via `requestIdleCallback` with a 4s fallback timer. That means **on cold loads, `useAnalytics().isInitialized` is `false` for up to ~4s**.
- **Underlying lib:** `@dcl/hooks` (workspace submodule `hooks/`) exposes `useAnalytics()` which returns `{ isInitialized, track, identify, page }`. When `isInitialized === false`, `track` is a no-op — calls just drop. There is **no built-in queueing** in `useAnalytics`.
- **Contentsquare:** activated alongside Segment via `scheduleDeferredThirdParty` in `src/modules/deferredThirdParty.ts`. Out of scope here; it's session recording, not event tracking.
- **Anonymous id:** `@segment/analytics-next` stores its anonymous id in `localStorage` as `ajs_anonymous_id` (JSON-encoded). Read it via `useAnonUserId()` (`src/hooks/useAnonUserId.ts`) which validates against UUID format and also accepts an `?anon_user_id=…` URL param override (used by the download success → launcher → Explorer attribution chain).

## 2. The hooks — pick the right one

| Hook                          | Where it lives                              | When to use                                                                                                                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useAnalytics()`              | `@dcl/hooks`                                | When you need the raw Segment primitives. Tracks fired before Segment loads will silently drop. Rare; prefer the wrappers below.                                                                                                                                                                                                         |
| `useDeferredTrack()`          | `src/hooks/useDeferredTrack.ts`             | When the event must survive Segment's lazy init. Returns a function with the same signature as `track`, but if `isInitialized === false` it queues the call and drains the queue when Segment becomes ready. Preferred default for any track fired from a component that mounts on a route the user can deep-link to.                    |
| `useTrackClick()`             | `src/hooks/adapters/useTrackLinkContext.ts` | Click handlers driven by `data-*` attributes on the clicked element. **Always emits `SegmentEvent.CLICK`** as the event name; the action subtype lives in the payload as `event` (sourced from `data-event`). Strips `payload.event` when it would equal the event name (`Click`). Uses `useDeferredTrack` internally — no silent drops. |
| `useBlogPageTracking()`       | `src/hooks/useBlogPageTracking.ts`          | Per-route `page()` event for Helmet-titled routes where the automatic `page()` in `Layout.tsx` races the async title write. See sites CLAUDE.md rule 23.                                                                                                                                                                                 |
| `useLegacyRedirectTracking()` | `src/hooks/useLegacyRedirectTracking.ts`    | Specialized: waits up to 800ms for Segment to load, then emits one of `LEGACY_EVENTS_REDIRECTED` / `LEGACY_PLACES_REDIRECTED` and proceeds with the `<Navigate>`. Pattern reference for "block briefly on analytics readiness then unblock UI".                                                                                          |

## 3. The event enums — where to find names

All declared in `src/modules/segment.types.ts` and re-exported by `src/modules/segment.ts`:

- **`SegmentEvent`** — every event name fired with `track()`. Mixed casing because some literals are historical: `'Click'`, `'Download'`, `'Reels Click …'` (Title Case Words), and the funnel events `download_started / download_success / download_failed` (snake_case). Don't normalize — the data team trackes by these literal strings.
- **`DownloadPlace`** — kebab-case enum for the `place` field of `download_*` events. Values: `landing-hero`, `landing-hero-epic`, `landing-hero-platform-switch`, `come-hang-out`, `jump-in-already-user`, `download-page`, `download-success-footer`, `unknown`.
- **`SectionViewedTrack`** — Title Case enum for the `place` field of `Click` events (consumed via `data-place`). Values: `Landing Hero`, `Creators Hero`, `Landing Explore`, etc. **Different namespace from `DownloadPlace`** — they happen to overlap in intent (e.g. `SectionViewedTrack.LANDING_HERO = 'Landing Hero'` vs `DownloadPlace.LANDING_HERO = 'landing-hero'`), but to join them in a query the warehouse has to normalize.

## 4. The `data-event` convention (Click events)

`useTrackClick()` reads ALL `data-*` attributes on the clicked element, converts each to camelCase, and merges them into the payload. The hook **always emits `SegmentEvent.CLICK`** as the event name — the action subtype lives in `payload.event`.

**Rules for callers:**

- `data-event` MUST be a `SegmentEvent` enum value, never a hardcoded literal. The lowercase `"click"` literal is no longer accepted as a special value — use `data-event={SegmentEvent.CLICK}` if you want to be explicit.
- If `data-event` equals `SegmentEvent.CLICK`, the adapter strips it from the payload (would otherwise duplicate the event name).
- `data-place` is the canonical key for "where the click happened" — use `SectionViewedTrack.X` enum values.

**Examples in current code:**

- `data-event={SegmentEvent.DOWNLOAD}` → Hero Download / Epic / Create/Hero (primary + secondaries) / CreatorHubDownload (primary + secondaries) / DownloadSuccess footer. Payload includes `event: 'Download'`.
- `data-event={SegmentEvent.REELS_CLICK_DCL_LOGO}` → Reels Logo. Payload includes `event: 'Reels Click Decentraland Logo'`.
- `data-event={SegmentEvent.CLICK}` → WhatsOn / WhatsOnCard / WeeklyRituals / ComeHangOut / CatchTheVibe / JumpIn (via CTAButton default). Payload does NOT include `event` (stripped because it would duplicate the event name).

**Common other data-\* attrs that flow into payloads:** `data-section`, `data-card`, `data-os`, `data-title`, `data-subtitle`.

## 5. The download funnel (Explorer)

Three event families live across the funnel:

### 5.1 Click upstream (any CTA decorated with `data-event={SegmentEvent.DOWNLOAD}`)

Fired by `useTrackClick()`. Payload: `{ place: '<Section Title>', anything-else-from-data-* }`.

### 5.2 ~~Onboarding Checkpoint~~ — DEPRECATED 2026-05-22

The `'Onboarding Checkpoint'` family (CP5 reached / completed, CP6 reached) was **fully removed** from the codebase. The helper at `src/modules/onboardingCheckpoint.ts` is gone; `DownloadLayout` and `DownloadOptions` no longer fire it. If a future requirement needs a download-funnel checkpoint, design from scratch rather than reviving this — the original schema (numeric `checkpointId`, `email`/`wallet` PII in payload) was the reason it got cut.

### 5.3 `download_started / _success / _failed`

Fired by `src/pages/DownloadSuccess/DownloadSuccess.tsx` via `createDownloadTracker` (`src/modules/downloadTracking.ts`).

**Two flows in the same component:**

- **Auto-flow** (page mount `useEffect`): the user landed on `/download_success?os=…&arch=…&place=…&anon_user_id=…` after a redirect from Hero / DownloadOptions / ComeHangOut / JumpIn. The download is triggered automatically.
- **Footer re-download** (`handleDownloadClick`): user clicks the "download again" link in the success page footer. Same shape but `place = 'download-success-footer'` is hardcoded.

**Payload shape (both flows, see `src/modules/downloadTracking.ts`):**

```ts
DOWNLOAD_STARTED → {
  place?,                              // omitted if UNKNOWN
  href,                                // the actual downloadUrl streamed (gateway + anon_user_id)
  os, arch,
  anon_user_id?,                       // omitted if undefined
  auth_state,                          // 'authenticated' | 'anonymous'
  revisit,                             // 0 = first visit, n = n-th revisit (sessionStorage counter per os:arch)
  started_at                           // ms timestamp at .started() call time
}

DOWNLOAD_SUCCESS → DOWNLOAD_STARTED's payload + {
  filename,
  succeeded_at, duration_ms,
  bytes_transferred?                   // only on Windows streamed path (downloadFileWithProgress)
}

DOWNLOAD_FAILED → DOWNLOAD_STARTED's payload + {
  reason,                              // error.message
  failed_at, duration_ms
}
```

**Timing semantics:**

- `_STARTED` fires **before** `streamOrFallback` (intent signal). If user closes the tab during the stream → `_STARTED` is in the warehouse, no `_SUCCESS` / `_FAILED`. Pair-wise diff `count(_STARTED) - count(_SUCCESS) - count(_FAILED)` ≈ abandon rate.
- `_SUCCESS` fires **after** `streamOrFallback` resolves. Note: this is "bytes arrived at the browser" (Windows) or "estimated time elapsed" (macOS) — NOT "user clicked Save". There is no clean signal for actual disk-write without `showSaveFilePicker`, which is Chromium-only and breaks Safari/Firefox and the macOS `kMDItemWhereFroms` attribution. The `os` field in the payload tells consumers which semantic applies.
- `_FAILED` fires in the `.catch()` branch. If the failure is in `calculateDownloadUrl` (i.e. before the tracker was built), a fallback tracker is constructed in the catch with `href = osLink` (CDN fallback URL) and the same shape is preserved.

**Revisits:** the previous `sessionStorage` / `history.state` idempotency bails were removed. Every aterrizaje en `/download_success` re-runs the full flow and emits events with `revisit: n`. The counter is keyed by `os:arch` combo (`sessionStorage:downloadSuccess:visits:${os}:${arch}`).

**Queueing:** events fire through `useDeferredTrack()`. If Segment isn't initialized yet, they queue and drain when `isInitialized` flips to true. **Timestamps are captured at call time, not at delivery time** — so even if Segment loads after the stream completes, `started_at` / `succeeded_at` preserve the real timing.

### 5.4 `Click` upstream — where the data lands

When the upstream `Click` (post-P0-1 fix: `'Download'` event name) is correctly fired with `place: 'Landing Hero'` (Title Case `SectionViewedTrack`), but `download_started` arrives with `place: 'landing-hero'` (kebab-case `DownloadPlace`). They're the same intent — different namespace. The data team must normalize to join them.

## 6. The Creator Hub funnel — current state

**Only the upstream `Click` is tracked**, by design. Decision (2026-05-22): the Creator Hub flow doesn't ship `creator_hub_download_*` outcome events because the download is `dispatch-and-forget` — we have no signal that the file actually saved, no progress, no `_FAILED` to fire. The primary download CTAs (CreatorsHero, CreatorHubDownload page) emit `Click` with `place=Creators Hero` or `place=Download` and `event=Download` via the standard `useTrackClick` adapter. The footer re-download on `/download/creator-hub-success` also fires `Click` with `place=Creator Hub Success Footer` + `data-os` so analytics can distinguish footer clicks from primary CTAs. No `page()` event on the success page.

## 7. Adjacent / route-level tracking

- **Automatic `page(pathname)`** in `src/components/Layout/Layout.tsx:33`, runs on every route change unless the path is in `ANALYTICS_EXEMPT_PATHS`.
- **Exempt paths:** `/brand`, `/content`, `/download`, `/ethics`, `/privacy`, `/referral-terms`, `/rewards-terms`, `/security`, `/terms`. These skip the automatic page() — but **manual track() calls fire as usual**. The comment on the constant has been historically misleading; clarify if you touch it.
- **Routes with NO `page()` at all:** `/download_success`, `/download/creator-hub`, `/download/creator-hub-success`, `/reels/*`, `/invite/:referrer`. These are Layout-less and don't get the automatic page(). Some (e.g. `/blog/*`) use `useBlogPageTracking` to fire their own page() event.

## 8. Other event domains — pointers

| Domain           | Where the fires live                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reels actions    | `src/components/Reels/ImageActions/ImageActions.tsx`, `Metadata.tsx`, `UserMetadata.tsx`, `WearableMetadata.tsx`, `ReelsListPage.tsx`, `Reels/Logo/Logo.tsx`                         |
| Communities      | `src/components/whats-on/Communities/CommunityInfo.tsx` (`COMMUNITY_CLICK_*` family)                                                                                                 |
| Report Player    | `src/components/whats-on/.../ReportForm.tsx` (`REPORT_PLAYER_*` family)                                                                                                              |
| Storage          | via `src/hooks/useStorageTrack.ts` (`STORAGE_*` families, injects `realmName`/`parcel`/`address`)                                                                                    |
| Jump             | `src/components/JumpInButton/JumpInButton.tsx` (`GO_TO_EXPLORER` + `Click {event:'Client not installed'}`)                                                                           |
| Legacy redirects | `src/hooks/useLegacyRedirectTracking.ts` (`LEGACY_EVENTS_REDIRECTED`, `LEGACY_PLACES_REDIRECTED`)                                                                                    |
| Invite Hero      | `src/components/Invite/InviteHero/InviteHero.tsx:76` — **uses string literal `'Click'` with `section: ...` instead of the enum + `place`. Inconsistent — flagged as P2 in Plan.md.** |

## 9. How to find where event X is fired

```bash
# 1. Find the enum entry to get the literal string value.
rg -n "SegmentEvent\\.X|'X event literal'" src/modules/segment.types.ts

# 2. Grep all track() calls for it.
rg -n "track\\(\\s*SegmentEvent\\.X|track\\(\\s*'X event literal'" src/

# 3. If it's a Click subtype, also search data-event:
rg -n 'data-event=\\{SegmentEvent\\.X\\}|data-event="X literal"' src/

# 4. For Storage / Reels families that pass the enum through a wrapper:
rg -n "useStorageTrack\\(\\)" src/
```

If grep returns zero matches the enum value is **dead code**. See section 7 of the P0-1 inventory at `tracking-issues/P01-callsites-inventory.md` and Plan.md `P2-2` for the current list of ~25 dead enum values.

## 10. How to add a new tracking event

1. **Add the literal** to the appropriate enum in `src/modules/segment.types.ts`. Match existing casing within its family (snake_case for funnel events, Title Case for "section" events, kebab-case for `DownloadPlace`-like dimensions).
2. **Decide the hook:** is the event fired from a click-handled DOM element? `useTrackClick` via `data-event`. From inside a component lifecycle on a route the user can deep-link to? `useDeferredTrack`. From a context where Segment is guaranteed ready (e.g. inside a `useEffect` that already awaits something Segment-y)? `useAnalytics` is fine.
3. **Payload conventions:**
   - snake_case keys (the codebase has eslint-disable comments for `auth_state`, `anon_user_id`, etc. — keep the existing pattern).
   - Capture client timestamps for any event whose timing matters; assume Segment ingestion delay is non-zero.
   - Omit optional fields when they'd be `undefined` rather than sending null — keeps warehouse rows cleaner.
4. **Tests:** add a unit test that asserts both the event name and the payload shape. See `src/modules/downloadTracking.spec.ts` for a per-event matcher pattern and `src/pages/DownloadSuccess/DownloadSuccess.spec.tsx` for an integration shape with mocked hooks.
5. **Coordinate with data team if the event is consumed by an existing dashboard.** Don't rename existing events — the warehouse joins on the literal name. Adding new fields is safe; removing/renaming requires a parallel-emission window.

## 11. Outstanding / known issues (track in `tracking-issues/Plan.md`)

- **P0-1** (✅ in progress): `useTrackClick` ignoring `data-event` for non-Click events. See `tracking-issues/P01-callsites-inventory.md` for the 13-callsite breakdown.
- **P0-2** (✅ done — Onboarding Checkpoint family deprecated 2026-05-22): all CP5/CP6 fires and the `trackCheckpoint` helper were removed. No replacement scheduled.
- **P0-3:** Creator Hub has zero outcome tracking. Solution: mirror Explorer pattern with a `CREATOR_HUB_DOWNLOAD_*` enum family, reuse `createDownloadTracker`.
- **P1-1** (✅ done): `download_started/success/failed` payload + timing fixes. See Plan.md section.
- **P1-2:** `useAnonUserId` not reactive to `isInitialized` — Hero builds redirect URL without `anon_user_id` if user clicks fast.
- **P1-3** (✅ partial via `useDeferredTrack`): `useTrackClick` silent drop when `isInitialized === false`. Adopting `useDeferredTrack` inside the adapter would resolve this for Click events too.
- **P2 list:** see Plan.md.

## 12. Reference files in priority order

1. `src/modules/segment.types.ts` — enums.
2. `src/modules/segment.ts` — re-exports + `resolveDownloadPlace`.
3. `src/hooks/useDeferredTrack.ts` — queue+drain hook.
4. `src/hooks/adapters/useTrackLinkContext.ts` — Click adapter.
5. `src/modules/downloadTracking.ts` + `.types.ts` — Download events factory.
6. `src/modules/DeferredAnalyticsProvider.tsx` — provider wiring.
7. `src/components/Layout/Layout.tsx` — automatic `page()` + `ANALYTICS_EXEMPT_PATHS`.
8. `src/hooks/useBlogPageTracking.ts` — manual `page()` for Helmet routes.
9. `tracking-issues/Plan.md` (workspace root) — outstanding work.
10. `tracking-issues/P01-callsites-inventory.md` — `data-event` callsite map.
