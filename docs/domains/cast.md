# cast

LiveKit browser streaming. Absorbed from `decentraland/cast2`. Mounted under `<DappsShell />` (heavy route) with an extra `<CastLayout />` wrapper that provides LiveKit + Notification contexts and renders the toast stack.

## Routes

`/cast/s/:token`, `/cast/s/streaming`, `/cast/w/:worldName/parcel/:parcel`, `/cast/w/:location`. Plus `/cast` index and `/cast/*` catch-all rendering `CastNotFoundPage`.

## Key paths

| Path                                   | Purpose                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/pages/cast/`                      | Page components for the cast area (streaming UI, world join, not-found).                               |
| `src/components/cast/`                 | Cast-specific UI components (video tiles, controls, participant list, toast stack).                    |
| `src/features/cast2/cast2.client.ts`   | RTK Query endpoints for LiveKit streaming. Defines `cast2Client`.                                      |
| `src/features/cast2/*.context.tsx`     | LiveKit + Notification contexts consumed by `<CastLayout />`.                                          |
| `src/features/cast2/comms-protocol.ts` | Comms protocol wrapper (peer connection, signaling).                                                   |
| `src/features/cast2/peer-wrapper.ts`   | LiveKit peer abstraction.                                                                              |
| `src/features/cast2/cast2.errors.ts`   | Error → i18n key mapping for cast-specific failures.                                                   |
| `src/services/cast2Client.ts`          | RTK Query base for cast — signed-fetch baseQuery, supports both anonymous and token-in-URL auth flows. |

## LiveKit deps

`livekit-client` and `@livekit/components-react` are the heaviest deps in the heavy chunk — they only load when a `/cast/*` route is navigated to.

**CSS gotcha:** `@livekit/components-styles` ships CSS. It MUST NOT live inside `manualChunks` in `vite.config.ts` — Vite would inject the stylesheet as render-blocking on every page. See skill `perf-tier`.

## Auth

Cast can run anonymously OR with a token-in-URL. The `cast2Client` baseQuery handles both shapes. See skill `auth-flow` for the localStorage wallet hooks (only used when a logged-in user joins).

## Cross-references

- Skill `rtk-query-split` — RTK Query architecture + rules 17 & 18.
- Skill `perf-tier` — manualChunks CSS gotcha, LiveKit lazy loading.
- Skill `auth-flow` — token-in-URL flow.
- Skill `add-route` — adding new routes under `/cast/*`.
