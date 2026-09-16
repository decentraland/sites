# jump

Launcher deep-link handler — resolves places, events, and world coordinates from the URL into the explorer launcher. Mounted under `<DappsShell />` (heavy route).

## Routes

`/jump`, `/jump/places`, `/jump/places/invalid`, `/jump/events`, `/jump/events/invalid`. Legacy `/jump/event` alias still used by production.

## Key paths

| Path                                   | Purpose                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/jump/`                      | Page components for the jump area (resolver UI, invalid-target landing pages).                                            |
| `src/components/jump/`                 | Jump-specific UI (place/event card previews, "open in explorer" CTA).                                                     |
| `src/features/places/places.client.ts` | RTK Query endpoints for `/jump/*` deep-link resolution (places, events, world coordinates). Injected into `placesClient`. |
| `src/services/placesClient.ts`         | RTK Query base for places deep-link resolution (`decentraland-places` API).                                               |

## Jump-in on touch devices

A phone gets the same two-step as desktop: `useExplorerLauncher` fires the `decentraland://open`
protocol through `src/utils/mobileAppLaunch.ts` and falls back to the tagged store URL only when it
didn't take. The app registers the scheme on both platforms (iOS `CFBundleURLSchemes`, Android
`BROWSABLE` intent-filter in the `decentraland/godotengine` fork), and `/open` is the route that
teleports; a bare `decentraland://?x` has no route.

Two mechanics worth knowing before touching this:

- **Nothing tells a web page whether a custom scheme was handled.** Both tiers infer it the same
  way: fire the navigation, listen for `visibilitychange` / `pagehide` / `blur`, and treat "page
  never lost focus" as "not installed". Desktop waits 750ms in ui2; mobile waits 1500ms because an
  app switch takes longer to report hidden.
- **Android goes through `intent://…#Intent;scheme=decentraland;package=…;S.browser_fallback_url=…`.**
  Chrome resolves it against the installed package and, when nothing handles it, opens the fallback
  URL itself, so a device without the app never hits the `ERR_UNKNOWN_URL_SCHEME` error page. iOS has
  no equivalent: an uninstalled scheme can surface Safari's "cannot open page" alert before the
  timeout redirects to the App Store.

App links are NOT used here. `decentraland.org/jump|/events|/places` are declared in the explorer's
Android manifest and iOS entitlements, but decentraland.org serves neither `.well-known` file
(`curl -sI https://decentraland.org/.well-known/assetlinks.json` returns the SPA shell), and a
same-origin navigation is never handed to the app anyway. The explorer also answers app links on
`mobile.dclexplorer.com/open`, which is outside our control, so we don't send users there.

## Auth

Jump can run without identity. Reads are anonymous.

## Cross-references

- Skill `rtk-query-split` — RTK Query architecture + rules 17 & 18.
- Skill `add-route` — adding new routes under `/jump/*`.
