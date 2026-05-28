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

## Auth

Jump can run without identity. Reads are anonymous.

## Cross-references

- Skill `rtk-query-split` — RTK Query architecture + rules 17 & 18.
- Skill `add-route` — adding new routes under `/jump/*`.
