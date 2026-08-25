# whats-on

Events + hangouts area. Mounted under `<DappsShell />` (heavy route).

## Routes

`/events`, `/events/new-hangout`, `/events/edit-hangout/:eventId`, `/events/admin/pending-events`, `/events/admin/users`. Legacy aliases `/events/new-event` and `/events/edit-event/:eventId` redirect into the hangout flow. `/events/*` and `/places/*` legacy paths from the standalone events/places sites redirect into `/events` with deep-link params.

## Key paths

| Path                                         | Purpose                                                                                                                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/whats-on/`                        | Page components for the whats-on area (list, new/edit hangout, admin views).                                                                                                                                  |
| `src/components/whats-on/`                   | Whats-on-specific UI components (cards, filters, hangout form, admin panels).                                                                                                                                 |
| `src/features/events/events.client.ts`       | RTK Query endpoints for `/events/*` reads + mutations. Defines `eventsClient` (base + endpoints in the same file — legacy shape, but still loads via the shell).                                              |
| `src/features/events/events.admin.client.ts` | Admin approve/reject + permission management. Defines `adminClient` (also legacy shape).                                                                                                                      |
| `src/features/events/events.discovery.ts`    | **Lightweight** homepage live-cards data client built on `useSyncExternalStore`. Safe to import from lightweight routes (the homepage uses it). Do NOT import the other two `events.*.client.ts` files there. |

## Auth + mutations

Mutations (create event, RSVP, admin actions) call `signedFetch(url, identity)` from `src/utils/signedFetch.ts`. Reads are anonymous. See skill `auth-flow` for the wallet/identity hooks.

## RTK Query notes

The `eventsClient` and `adminClient` base clients live next to their endpoints (in `src/features/events/`) rather than in `src/services/`. Both still register via `src/shells/store.ts`. New endpoints follow the same shape — see skill `rtk-query-split`.

## Cross-references

- Skill `rtk-query-split` — RTK Query architecture + Pre-PR rules 17 & 18.
- Skill `auth-flow` — signed mutations.
- Skill `add-route` — adding new routes under `/events/*`.
