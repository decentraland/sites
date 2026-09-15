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

`useExplorerLauncher` can't use `launchDesktopApp` on a phone, so it navigates to
`https://mobile.dclexplorer.com/open?position=&realm=&dclenv=` instead. That host is the only one
whose `/open*` paths are declared in the mobile explorer's AASA (iOS) and `assetlinks.json`
(Android), so an installed app takes the navigation and teleports; a device without it loads that
page, which shows the place and both store links.

Our own `/jump`, `/events` and `/places` prefixes ARE declared as app links in the explorer's
Android manifest and iOS entitlements, but `decentraland.org` serves neither well-known file
(`curl -sI https://decentraland.org/.well-known/assetlinks.json` returns the SPA shell), so an
inbound shared link still opens the browser. Fixing that belongs to `sites-deployer`, and it would
not change the in-page button either: a same-origin navigation is never handed to the app.

## Auth

Jump can run without identity. Reads are anonymous.

## Cross-references

- Skill `rtk-query-split` — RTK Query architecture + rules 17 & 18.
- Skill `add-route` — adding new routes under `/jump/*`.
