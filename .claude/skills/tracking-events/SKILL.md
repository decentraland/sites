---
name: tracking-events
description: Reference and investigation playbook for analytics tracking in sites. Use when locating where an event is fired, understanding the deferred-analytics provider, adding/changing a Segment event, debugging missing events in the warehouse, or reasoning about download/onboarding/Click funnels. Triggers on "Segment", "analytics event", "tracking", "useTrackClick", "useDeferredTrack", "useAnalytics", "data-event", "download_started", "download_success", "download_failed", "Onboarding Checkpoint", "REELS_*", "GO_TO_EXPLORER", "page tracking", "where is X fired", "what tracks X", "anon_user_id", "dónde se manda evento", "utm", "campaign attribution", "partner attribution", "download_target".
---

# tracking-events

The single source of truth for understanding analytics in sites. **Read top-to-bottom the first time** so the conventions stick; then use the section links as a reference.

## 1. The stack

- **Provider:** Segment (analytics-next). Initialized lazily via `DeferredAnalyticsProvider` (`src/modules/DeferredAnalyticsProvider.tsx`), which schedules the writeKey load via `requestIdleCallback` with a 4s fallback timer. That means **on cold loads, `useAnalytics().isInitialized` is `false` for up to ~4s**.
- **Underlying lib:** `@dcl/hooks` (workspace submodule `hooks/`) exposes `useAnalytics()` which returns `{ isInitialized, track, identify, page }`. When `isInitialized === false`, `track` is a no-op — calls just drop. There is **no built-in queueing** in `useAnalytics`.
- **Contentsquare:** activated alongside Segment via `scheduleDeferredThirdParty` in `src/modules/deferredThirdParty.ts`. Out of scope here; it's session recording, not event tracking.
- **Anonymous id:** `@segment/analytics-next` stores its anonymous id in `localStorage` as `ajs_anonymous_id` (JSON-encoded). Read it via `useAnonUserId()` (`src/hooks/useAnonUserId.ts`) which validates against UUID format and also accepts an `?anon_user_id=…` URL param override (used by the download success → launcher → Explorer attribution chain).

## 2. Two abstraction layers — infra and domain

Tracking in sites is split into two layers that compose cleanly:

- **Infra (`useDeferredTrack`)** — wraps `useAnalytics().track` with a queue. Doesn't know what the event is or what the payload means. Its only job: make sure the track call survives Segment's lazy boot. Adds `track_called_at`, `track_delivered_at`, `track_deferred` to every payload so the data team can audit deferral. **Caveat:** the queue is component-scoped — pending events are dropped on unmount. Fine for events on routes where abrupt departure is unlikely; wrong choice for events on routes users are likely to leave abruptly (see `postSegmentEvent` below and LL-10).
- **Infra (`postSegmentEvent` + `ensureSegmentAnonymousId`)** — the unload-safe alternative (`src/modules/segmentBeacon.ts` + `src/modules/segmentAnonymousId.ts`). Posts directly to Segment's HTTP Tracking API via `navigator.sendBeacon` (falling back to `fetch keepalive`), bypassing `useAnalytics()`/`useDeferredTrack()` entirely — so it works even if Segment hasn't booted yet, and survives a same-tick page unload. `ensureSegmentAnonymousId()` mints/persists a Segment-adoptable anonymous id (the same localStorage shape analytics-next writes) so events fired before Segment boots still carry a real, adoptable id instead of a throwaway one.
- **Domain (`createDownloadTracker`, future per-funnel factories)** — knows the schema of a specific funnel. Builds the canonical payload, captures timestamps tied to domain semantics (`started_at`, `succeeded_at`), exposes a small intent-shaped API (`.started()` / `.success()` / `.failed()`). Doesn't know about Segment loading — internally fires via whichever transport its factory chose (`useDeferredTrack` or `postSegmentEvent`).

You should almost never call `useAnalytics().track` directly. The decision tree:

- Click handler driven by `data-*`? → `useTrackClick` (which already uses `useDeferredTrack` internally).
- Download funnel event (`download_started/_success/_failed`)? → `createDownloadTracker(ctx)` — fires via `postSegmentEvent` (see 5.3).
- New domain that needs queueing AND fires on a route users don't abruptly leave? → call `useDeferredTrack()` and pass it to whatever domain factory you build.
- New domain that fires on a route users are likely to abruptly leave (installer pages, exit-intent diagnostics, etc.)? → use `postSegmentEvent` + `ensureSegmentAnonymousId()` directly, following `downloadTracking.ts` / `downloadFunnelExit.ts`. Don't reach for `useAnalytics().track` directly unless you accept silent-drop on cold loads.

## 3a. The hooks — pick the right one

| Hook                          | Where it lives                              | When to use                                                                                                                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useAnalytics()`              | `@dcl/hooks`                                | When you need the raw Segment primitives. Tracks fired before Segment loads will silently drop. Rare; prefer the wrappers below.                                                                                                                                                                                                         |
| `useDeferredTrack()`          | `src/hooks/useDeferredTrack.ts`             | When the event must survive Segment's lazy init. Returns a function with the same signature as `track`, but if `isInitialized === false` it queues the call and drains the queue when Segment becomes ready. Preferred default for any track fired from a component that mounts on a route the user can deep-link to — **except** events on routes users are likely to abruptly leave (installer pages, exit-intent diagnostics): the queue is component-scoped and drops pending events on unmount. `download_started/_success/_failed` used to be the textbook example of this hook's intended use; it no longer is — see 5.3 and LL-10. |
| `postSegmentEvent()` + `ensureSegmentAnonymousId()` | `src/modules/segmentBeacon.ts` + `src/modules/segmentAnonymousId.ts` | Unload-safe alternative to `useDeferredTrack` for events fired on routes users are likely to abruptly leave. Fires immediately via `navigator.sendBeacon`/`fetch keepalive`, independent of Segment's own boot state. Used by `useDownloadClick`, `downloadFunnelExit.ts`, and `createDownloadTracker` (download_started/_success/_failed). |
| `useTrackClick()`             | `src/hooks/adapters/useTrackLinkContext.ts` | Click handlers driven by `data-*` attributes on the clicked element. **Always emits `SegmentEvent.CLICK`** as the event name; the action subtype lives in the payload as `event` (sourced from `data-event`). Strips `payload.event` when it would equal the event name (`Click`). Uses `useDeferredTrack` internally — no silent drops. |
| `useBlogPageTracking()`       | `src/hooks/useBlogPageTracking.ts`          | Per-route `page()` event for Helmet-titled routes where the automatic `page()` in `Layout.tsx` races the async title write. See sites CLAUDE.md rule 23.                                                                                                                                                                                 |
| `useLegacyRedirectTracking()` | `src/hooks/useLegacyRedirectTracking.ts`    | Specialized: waits up to 800ms for Segment to load, then emits one of `LEGACY_EVENTS_REDIRECTED` / `LEGACY_PLACES_REDIRECTED` and proceeds with the `<Navigate>`. Pattern reference for "block briefly on analytics readiness then unblock UI".                                                                                          |

## 3b. The event enums — where to find names

All declared in `src/modules/segment.types.ts` and re-exported by `src/modules/segment.ts`:

- **`SegmentEvent`** — every event name fired with `track()`. Mixed casing because some literals are historical: `'Click'`, `'Download'`, `'Reels Click …'` (Title Case Words), and the funnel events `download_started / download_success / download_failed` (snake_case). Don't normalize — the data team tracks by these literal strings.
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

**Transport:** events fire via `postSegmentEvent()` (`src/modules/segmentBeacon.ts`) with `ensureSegmentAnonymousId()` (`src/modules/segmentAnonymousId.ts`) as the anonymous id — NOT through `useDeferredTrack()`. This changed because `/download_success` is the page users are most likely to abruptly leave (they're about to run the installer they just downloaded), and `useDeferredTrack`'s queue is component-scoped: any event still queued when the component unmounts is silently dropped. Since Segment's lazy boot (`DeferredAnalyticsProvider`, up to ~4s idle timeout) is frequently slower than the flow that fires `tracker.started()`, a meaningful fraction of these events were being queued and then lost on navigation. `postSegmentEvent` posts directly via `navigator.sendBeacon` (falling back to `fetch keepalive`), independent of Segment's own init state, and `ensureSegmentAnonymousId()` mints/persists a real Segment-adoptable id so attribution survives even when the event fires before Segment ever boots. See `useDownloadClick` (PR #636) and `downloadFunnelExit.ts` (PR #632) for the precedent this migration followed, and LL-10 below. **Timestamps are still captured at call time** (`started_at` / `succeeded_at` / `failed_at`), so timing analysis is unaffected by the transport change.

### 5.4 `Click` upstream — where the data lands

When the upstream `Click` (post-P0-1 fix: `'Download'` event name) is correctly fired with `place: 'Landing Hero'` (Title Case `SectionViewedTrack`), but `download_started` arrives with `place: 'landing-hero'` (kebab-case `DownloadPlace`). They're the same intent — different namespace. The data team must normalize to join them.

### 5.5 Partner (UTM) attribution + `download_target` — PR #654, 2026-07-02

Marketing shares links like `https://decentraland.org/download?utm_source=shefi&utm_campaign=…`. Two things had to be threaded through the whole funnel: the UTM params themselves, and a `download_target` dimension (`desktop_installer` / `app_store` / `google_play`) so the warehouse can split desktop installer activations from mobile store exits (the latter never reach `/download_success`).

**Campaign params — `src/modules/campaignParams.ts` (new):**

- `CAMPAIGN_PARAM_KEYS` — allowlist of the 5 params: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`.
- `collectCampaignParams(source?: URLSearchParams)` — reads those keys off `source` (defaults to `window.location.search`, SSR-guarded), truncates each value to `MAX_CAMPAIGN_VALUE_LENGTH = 256` chars, omits absent/empty ones.
- `withCampaignParams(path)` — appends the currently-collected params to a path. Used for the `/download` fallback href rendered before `userAgentData` resolves (Hero, ComeHangOut, PlayPage).
- **Documented limitation (in the file's own docstring):** params are read from the CURRENT URL at call time, not persisted per session. A visitor landing on `/?utm_source=…` who then browses internally before clicking a download CTA loses the attribution — the query string is gone by the time `collectCampaignParams()` runs. Partner links must point directly at a page hosting download CTAs (`/`, `/download`, `/play`).
- Kept snake_case (`utm_source`, not `utmSource`) so the keys match both the raw partner-sent param names and the Segment payload convention (LL-3) — no renaming needed to flow into tracking payloads.

**`src/hooks/useDownloadSuccessHref.ts` (new):** returns a memoized `(os, place) => href` builder for `/download_success` links: `buildDownloadSuccessHref(os, place, { anonUserId, campaignParams: collectCampaignParams() })`. `anonUserId` is captured via `useAnonUserId()` at hook scope, but `collectCampaignParams()` is called **inside the returned callback**, not at hook render time — i.e. re-evaluated fresh on every click, not cached. Intentional: it keeps the params live for the button's actual click moment rather than whatever the URL was when the component last rendered. Replaces a local `useCallback(() => buildDownloadSuccessHref(os, place, { anonUserId }), [anonUserId])` that used to be duplicated in Hero, ComeHangOut, and PlayPage — now they all call this hook (`DownloadOptions` still composes `buildDownloadSuccessHref` inline because it also needs to pass `arch`).

**`src/modules/segment.types.ts` — `DownloadTarget` enum (new):**

```ts
enum DownloadTarget {
  DESKTOP_INSTALLER = 'desktop_installer',
  APP_STORE = 'app_store',
  GOOGLE_PLAY = 'google_play'
}
```

Set via `data-download-target={DownloadTarget.X}` on every download CTA (Hero, ComeHangOut, DownloadOptions, DownloadLayout's mobile store badges, PlayPage) and read into payloads by `useDownloadClick` / `buildTrackerExtra` (below).

**`src/modules/url.ts` — `DownloadSuccessHrefOptions.campaignParams`:** the param-assembly loop in `buildDownloadSuccessHref` guards against a campaign key clobbering a routing param: `if (params.has(key)) continue` before `params.set(key, value)`, so no `utm_*` can overwrite `os`/`place`/`arch`/`anon_user_id`. Unreachable today (the `utm_*` allowlist in `collectCampaignParams` can't collide with those names), but the option accepts a bare `Record<string, string>` so a future caller passing raw `searchParams` entries can't corrupt the funnel.

**`src/hooks/useDownloadClick.ts` — merge order:** the returned click handler builds `payload = { ...collectCampaignParams(), ...dataAttributes }` — `data-*` attributes are spread **after** campaign params, so a same-named `data-*` attribute wins on collision (campaign params never override component-controlled data). `downloadTarget` is destructured out of `dataAttributes` first and re-added as `payload.download_target` (`readDataAttributes` camelCases `data-download-target` → `downloadTarget`; the warehouse dimension is snake_case) — this rename happens once on the shared payload object before the warm/cold branch, so both transports (`deferredTrack` when Segment is warm, `postSegmentEvent` when cold) get the same snake_case key.

**`src/pages/DownloadSuccess/DownloadSuccess.tsx` — `buildTrackerExtra()`:** builds the shared `extra` object merged into every `download_started/_success/_failed` payload (`downloadTracking.ts`'s `buildBasePayload` spreads `ctx.extra` first, so core schema fields still win on collision):

```ts
{ ...(collectClientFingerprint() ?? {}), ...campaignParamsRef.current, download_target: DownloadTarget.DESKTOP_INSTALLER }
```

wrapped in a try/catch (line ~127-140) because it runs in two places that must never throw: the footer re-download handler (before its try/finally arms) and the mount effect's catch (while building the `_FAILED` fallback tracker). **The catch block only returns `{ download_target: DownloadTarget.DESKTOP_INSTALLER }`** — see P2-4 below, this silently drops the campaign params for that one event if `collectClientFingerprint()` throws.

**`src/components/Layout/DownloadLayout.tsx`:** the mobile store badges (Google Play / App Store) call `useDownloadClick()` (aliased `trackStoreExit`) with their own `data-*` attributes (`data-download-target={DownloadTarget.GOOGLE_PLAY | APP_STORE}`, `data-os`, `data-place={DownloadPlace.DOWNLOAD_PAGE}`). This is the only attribution signal for these exits — they leave to the store and never reach `/download_success`, so there's no `download_started` for them; the beacon-backed `Click` event is the whole record.

**Hero.tsx / ComeHangOut.tsx:** both replaced their local `downloadSuccessHref` builder with `useDownloadSuccessHref()` and added `data-download-target` to every download CTA (desktop button, Epic button, platform-switch icons, mobile store buttons). `PlayPage.tsx` and `DownloadOptions.tsx` got the same `data-download-target` additions (all `DESKTOP_INSTALLER` except the store badges).

## 6. The Creator Hub funnel — current state

**Only the upstream `Click` is tracked**, by design. Decision (2026-05-22): the Creator Hub flow doesn't ship `creator_hub_download_*` outcome events because the download is `dispatch-and-forget` — we have no signal that the file actually saved, no progress, no `_FAILED` to fire. The primary download CTAs (CreatorsHero, CreatorHubDownload page) emit `Click` with `place=Creators Hero` or `place=Download` and `event=Download` via the standard `useTrackClick` adapter. The footer re-download on `/download/creator-hub-success` also fires `Click` with `place=Creator Hub Success Footer` + `data-os` so analytics can distinguish footer clicks from primary CTAs. No `page()` event on the success page.

## 7. Adjacent / route-level tracking

- **Automatic `page(pathname)`** in `src/components/Layout/Layout.tsx` (~line 16), runs on every route change unless `isPageTrackingExempt(pathname)` (`src/components/Layout/Layout.helpers.ts`) exempts it.
- **Exempt paths:** `/brand`, `/content`, `/download`, `/ethics`, `/privacy`, `/referral-terms`, `/rewards-terms`, `/security`, `/terms`. These skip the automatic page() — but **manual track() calls fire as usual**. The comment on the constant has been historically misleading; clarify if you touch it.
- **Routes with NO `page()` at all:** `/download_success`, `/download/creator-hub`, `/download/creator-hub-success`, `/reels/*`, `/invite/:referrer`. These are Layout-less and don't get the automatic page(). Some (e.g. `/blog/*`) use `useBlogPageTracking` to fire their own page() event.

## 8. Other event domains — pointers

| Domain           | Where the fires live                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reels actions    | `src/components/Reels/ImageActions/ImageActions.tsx`, `Metadata.tsx`, `UserMetadata.tsx`, `WearableMetadata.tsx`, `ReelsListPage.tsx`, `Reels/Logo/Logo.tsx` |
| Communities      | `src/components/social/CommunityDetail/CommunityInfo/CommunityInfo.tsx` (`COMMUNITY_CLICK_*` family)                                                         |
| Report Player    | `src/components/Report/ReportForm/ReportForm.tsx` (`REPORT_PLAYER_*` family)                                                                                 |
| Storage          | via `src/hooks/useStorageTrack.ts` (`STORAGE_*` families, injects `realmName`/`parcel`/`address`)                                                            |
| Jump             | `src/hooks/useLaunchExplorer.ts` fires `GO_TO_EXPLORER` (shared by `src/components/jump/JumpInButton/` and `EditProfileButton`)                              |
| Legacy redirects | `src/hooks/useLegacyRedirectTracking.ts` (`LEGACY_EVENTS_REDIRECTED`, `LEGACY_PLACES_REDIRECTED`)                                                            |
| Invite Hero      | `src/components/Invite/InviteHero/InviteHero.tsx` — migrated to `useTrackClick` + `data-place` (see LL-3 below).                                             |

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

If grep returns zero matches the enum value is **dead code** — verify with a repo-wide grep before assuming an event still fires.

## 10. How to add a new tracking event

1. **Add the literal** to the appropriate enum in `src/modules/segment.types.ts`. Match existing casing within its family (snake_case for funnel events, Title Case for "section" events, kebab-case for `DownloadPlace`-like dimensions).
2. **Decide the transport:** is the event fired from a click-handled DOM element? `useTrackClick` via `data-event`. From inside a component lifecycle on a route the user can deep-link to but is unlikely to abruptly leave? `useDeferredTrack`. From inside a component lifecycle on a route users ARE likely to abruptly leave (installer pages, exit-intent diagnostics)? `postSegmentEvent` + `ensureSegmentAnonymousId()` — see 5.3 and LL-10. From a context where Segment is guaranteed ready (e.g. inside a `useEffect` that already awaits something Segment-y)? `useAnalytics` is fine.
3. **Payload conventions:**
   - snake_case keys (the codebase has eslint-disable comments for `auth_state`, `anon_user_id`, etc. — keep the existing pattern).
   - Capture client timestamps for any event whose timing matters; assume Segment ingestion delay is non-zero.
   - Omit optional fields when they'd be `undefined` rather than sending null — keeps warehouse rows cleaner.
4. **Tests:** add a unit test that asserts both the event name and the payload shape. See `src/modules/downloadTracking.spec.ts` for a per-event matcher pattern and `src/pages/DownloadSuccess/DownloadSuccess.spec.tsx` for an integration shape with mocked hooks.
5. **Coordinate with data team if the event is consumed by an existing dashboard.** Don't rename existing events — the warehouse joins on the literal name. Adding new fields is safe; removing/renaming requires a parallel-emission window.

## 11. Outstanding / known issues

- **P0-1** (✅ shipped): `useTrackClick` ignoring `data-event` for non-Click events — fixed; verify with the dead-enum grep above when touching callsites.
- **P0-2** (✅ done — Onboarding Checkpoint family deprecated 2026-05-22): all CP5/CP6 fires and the `trackCheckpoint` helper were removed. No replacement scheduled.
- **P0-3:** Creator Hub has zero outcome tracking. Solution: mirror Explorer pattern with a `CREATOR_HUB_DOWNLOAD_*` enum family, reuse `createDownloadTracker`.
- **P1-1** (✅ done): `download_started/success/failed` payload + timing fixes. See Plan.md section.
- **P1-2** (✅ done — `useAnonUserId` reactivity 2026-05-22): hook now depends on `isInitialized` so it re-evaluates when Segment boots; `DownloadSuccess` gates the auto-download on a `anonUserIdReady` state with an 800ms timeout fallback. See LL-9.
- **P1-3** (✅ partial via `useDeferredTrack`): `useTrackClick` silent drop when `isInitialized === false`. Adopting `useDeferredTrack` inside the adapter would resolve this for Click events too.
- **P1-4** (✅ done — `download_started/_success/_failed` drop-on-unmount fixed 2026-07-01): these events used to fire via `useDeferredTrack`, whose queue is component-scoped and drops pending events on unmount — a real risk on `/download_success`, the page users are most likely to abruptly leave. `createDownloadTracker` now fires via `postSegmentEvent` + `ensureSegmentAnonymousId()` instead, matching the `useDownloadClick` (PR #636) / `downloadFunnelExit.ts` (PR #632) precedent. See 5.3 and LL-10.
- **P2-4** (open, found during PR #654 review, not fixed — documenting only): `DownloadSuccess.tsx`'s `buildTrackerExtra()` (~line 127) merges `collectClientFingerprint()` + `campaignParamsRef.current` + `download_target`, wrapped in a try/catch because it must never throw (see 5.5). If `collectClientFingerprint()` throws, the catch returns **only** `{ download_target: DownloadTarget.DESKTOP_INSTALLER }` — the campaign params (`utm_*`) captured in `campaignParamsRef.current` are silently dropped from that event, even though they don't depend on the thing that failed. Fix would be catching around just the fingerprint call and still spreading `campaignParamsRef.current` unconditionally, but that's a design decision for whoever picks this up, not done here.
- **P2 list:** see Plan.md.

## 12. Lessons learned — anti-patterns to NOT repeat

Discovered the hard way during the 2026-05-22 tracking overhaul. Read before designing any tracking change.

### LL-1. Don't mirror the Explorer pattern blindly on the Creator Hub

The Creator Hub flow is **dispatch-and-forget** (anchor click → 3s setTimeout → redirect). There is no stream, no progress, no failure signal from the browser. **Do NOT add a `creator_hub_download_started/_success/_failed` event family unless the data team explicitly requests it** — the upstream `Click` already covers the funnel that product needs. The 2026-05-22 P0-3 was originally scoped as a full event family by reading the analysis HTML in isolation; the user corrected it to "just fix the footer click" because the rest was unnecessary scope creep.

### LL-2. Don't assume an event family is active — check with the data team

The `'Onboarding Checkpoint'` family was deprecated by data team and the entire helper + callsites had to be removed. Before adding any tracking to a "checkpoint"-style funnel, confirm with the data team that they want it. Don't reanimate `trackCheckpoint` — design from scratch.

### LL-3. Payload key conventions (read before adding any track call)

- **`place`** (not `section`, not `location`) — the canonical key for "where the click happened". `InviteHero.tsx` previously used `section: eventPlace` and it broke every analytics query that grouped by `place`. Fixed by migrating to `useTrackClick` + `data-place`.
- **`os`** (not `osName`, not `operativeSystem`) — short and consistent with the codebase's `OperativeSystem` enum values. `JumpInButton` previously used `osName` and it splintered queries.
- **`event`** — sub-type of a Click. Used as a payload key when the click should be filtered into a sub-bucket (e.g. `Click + event=Download` is "a Click that's a download"). Values should ALWAYS come from `SegmentEvent` enum, never hardcoded literals like `"click"` or `"Client not installed"`.
- **`anon_user_id`** (snake_case, optional) — never `anonUserId` (camelCase) in payloads. Mirrors the Segment warehouse convention.
- **`auth_state`** (snake_case) — values are `'authenticated' | 'anonymous'`, literal strings.

### LL-4. `data-event` is always an enum value, never a literal

`useTrackClick` strips `payload.event` when it equals the event name (`'Click'`). To make this work consistently, **every** `data-event` in the codebase must use a `SegmentEvent` enum value (e.g. `data-event={SegmentEvent.CLICK}` or `data-event={SegmentEvent.DOWNLOAD}`). Hardcoded literals like `data-event="click"` (lowercase) are not allowed — they break the strip logic and produce inconsistent casing in the warehouse.

### LL-5. `data-place` must match the component's actual section

Before copying a `data-place` from a neighboring component, verify that the section value matches THIS component, not the one you copied from. `ComeHangOut.tsx` previously had `data-place={SectionViewedTrack.LANDING_HERO}` because someone copy-pasted from Hero. That misattributed every ComeHangOut click as a Hero click in analytics. Fixed by adding `SectionViewedTrack.LANDING_COME_HANG_OUT` and using it.

### LL-6. There are two `place` namespaces — pick the right one

- `SectionViewedTrack` (Title Case: `'Landing Hero'`) — for **Click** events, used via `data-place`.
- `DownloadPlace` (kebab-case: `'landing-hero'`) — for **download_started/success/failed** events, used via URL query param.

They overlap in intent but NOT in value. `SectionViewedTrack.DOWNLOAD = 'Download'` and `SegmentEvent.DOWNLOAD = 'Download'` happen to share a literal, which has led to bugs where someone passed `SectionViewedTrack.DOWNLOAD` as `data-event` thinking they were referring to the event family. Use `SegmentEvent.DOWNLOAD` for `data-event`. Use `SectionViewedTrack.X` for `data-place`. Don't mix.

### LL-7. Before adding tracking, check whether an existing hook already covers it

`useTrackClick` is the canonical Click adapter. `useDeferredTrack` is the canonical queue-on-init hook. `createDownloadTracker` is the canonical download events factory. Inventing a new mechanism without first verifying these can't cover the use case is the most common source of duplicated logic + divergent payloads.

### LL-8. The `_SUCCESS` event in the download family doesn't mean "saved to disk"

`download_success` semantics:

- Windows: bytes arrived to browser memory via streamed `fetch`.
- macOS: estimated time elapsed (800ms–4000ms heuristic).

Neither signals OS-level disk save. The only way to know that would be `showSaveFilePicker` which is Chromium-only and breaks the `<a download>` flow that macOS needs for `kMDItemWhereFroms`. **Don't rename to `_DISPATCHED` or anything else** — the data team tracks by the literal name. The imprecision is documented in payload metadata (`bytes_transferred`, `delivery_mode` via `os`) instead.

### LL-9. The `useAnonUserId` race — fixed 2026-05-22

The hook is now **reactive** to `useAnalytics().isInitialized`: when Segment boots and writes `ajs_anonymous_id` to localStorage, the memo re-evaluates and consumers (Hero's `buildDownloadSuccessHref`, DownloadSuccess's `calculateDownloadUrl` call) see the up-to-date value on the next render.

`DownloadSuccess.tsx` gates the auto-download on an `anonUserIdReady` state. If `anonUserId` is `undefined` at mount, it waits up to **800ms** for the reactive update before triggering the download regardless. Trade-off: cold loads of `/download_success` see up to 800ms of backdrop before the stream starts, which is imperceptible compared to the gateway's 5-30s NSIS+sign step. Worth it to avoid losing campaign attribution on direct landings.

If you add a NEW page that derives URLs or analytics payloads from `useAnonUserId`, decide whether to:

- **Render-time only** — Hero pattern: derive the value at render and re-render automatically when the hook updates. Cheap and reactive.
- **Effect-time** — DownloadSuccess pattern: gate the effect on a `anonUserIdReady` state when the effect can't naturally re-run on hook updates.

### LL-10. Component-lifecycle events on a route users abruptly leave shouldn't use `useDeferredTrack` — even though 3a recommends it by default

`useDeferredTrack`'s own docstring says its queue is component-scoped and drops any still-pending event on unmount — a deliberate trade-off to avoid a module-level queue leaking events across page navigations. That's a fine trade-off for most routes, which is why 3a recommends it as the default for lifecycle events on deep-linkable routes. But `/download_success` (`DownloadSuccess.tsx`) is the one page in the app where the user is *specifically* about to leave — they just downloaded an installer and are switching away to run it — right as `download_started`/`_success`/`_failed` fire. Combined with Segment's lazy boot (`DeferredAnalyticsProvider`, up to ~4s idle timeout) frequently outlasting the time it takes `calculateDownloadUrl` to resolve and call `tracker.started()`, a meaningful fraction of these events were queued and then silently lost. Fixed 2026-07-01 by migrating `createDownloadTracker` to `postSegmentEvent` + `ensureSegmentAnonymousId()` (`src/modules/downloadTracking.ts`), following the exact precedent `useDownloadClick` (PR #636) and `downloadFunnelExit.ts` (PR #632) already established for this same page. **The lesson generalizes:** before defaulting to `useDeferredTrack` per 3a's table, ask whether the event's route is one users are likely to abruptly leave (installer pages, external-redirect pages, exit-intent diagnostics) — if so, use the beacon transport instead, regardless of the general-case guidance.

## 13. Reference files in priority order

1. `src/modules/segment.types.ts` — enums.
2. `src/modules/segment.ts` — re-exports + `resolveDownloadPlace`.
3. `src/hooks/useDeferredTrack.ts` — queue+drain hook.
4. `src/modules/segmentBeacon.ts` + `src/modules/segmentAnonymousId.ts` — unload-safe beacon transport + adoptable anonymous id.
5. `src/hooks/adapters/useTrackLinkContext.ts` — Click adapter.
6. `src/modules/downloadTracking.ts` + `.types.ts` — Download events factory (fires via the beacon transport, see 5.3/LL-10).
7. `src/modules/downloadFunnelExit.ts` — sibling beacon-transport precedent for the download family.
8. `src/modules/campaignParams.ts` — UTM param collection + truncation, `withCampaignParams` (see 5.5).
9. `src/hooks/useDownloadSuccessHref.ts` — memoized `/download_success` href builder baking in `anonUserId` + campaign params (see 5.5).
10. `src/modules/DeferredAnalyticsProvider.tsx` — provider wiring.
11. `src/components/Layout/Layout.tsx` + `Layout.helpers.ts` — automatic `page()` + `isPageTrackingExempt`.
12. `src/hooks/useBlogPageTracking.ts` — manual `page()` for Helmet routes.
