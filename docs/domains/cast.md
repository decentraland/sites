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

## Presentation composition

A presentation renders in one of two ways, depending on whether the presentation state carries `slide`.

- **v1 (no `slide`):** the `presentation-bot:*` participant publishes one composited tile. `ParticipantGrid` shows it and auto-expands it only on its first appearance (a ref latches per bot-presence cycle and resets when the bot leaves), so a tile the user picks is not snapped back to the bot on re-render. The streamer's `CameraOverlayHandle` sits over that tile's `<video>` with no camera preview.
- **v2 (`slide` present):** the streamer view, the `/cast` watcher, and Places `SceneLiveWatcher` (both modes; `SceneRoomMount` provides `NotificationProvider` + `PresentationProvider`) render `PresentationStage` instead. The watcher keeps showing it after the streamer leaves, because the bot outlives them.
- **Stage layers:** the slide PNG as an `<img>`; the bot's `presentation-video` track over its `slideVideos[playingVideoIndex].geometry` rectangle while a video plays or is paused; the `presenterIdentity` camera in a circle at `overlay`, only while that camera is published and unmuted. `ParticipantGrid` never shows a `presentation-video` tile.
- **Presenter handle:** only the `presenterIdentity` participant gets `CameraOverlayHandle`. It draws their local camera, mirrored, inside the dotted circle, so dragging has no server round-trip, and the stage leaves its own circle out for them.
- **Slide origin:** the stage sets `<img src>` only when `isAllowedSlideUrl` (`src/features/cast2/cast2.slideUrl.ts`) accepts the URL: the `getPresenterServerUrl()` origin and a `/presentations/<uuid>/slides/<16 hex>.png` path, the exact shape the presenter server issues.
- **Bot trust:** `PresentationContext` follows one bot: the first `presentation-bot:*` participant whose metadata has `role: 'presentation'`, or else the first `presentation-bot:*` participant, so packets that beat the metadata update are not lost. Presentation packets from any other sender, a second bot included, are dropped. Bot metadata and `presentation:state` packets go through one parser (`toIncomingState`) that defaults bad fields instead of rejecting the message: an unknown `videoState` (the server's `'error'` included) becomes `'idle'`, so the play control stays available. Slide videos are all-or-nothing on shape only (string `url`, finite geometry); geometry is not range-checked because `playingVideoIndex` indexes the server's list and the PPTX renderer can emit off-slide or zero-size rectangles.
- **Camera bubble drag:** `useNormalizedPointerDrag` cancels a press when a move arrives with `buttons === 0`. Keep that guard: the `HandleCircle` can unmount or lose capture mid-drag (a remeasure, the circle dropping under `MIN_CIRCLE_DIAMETER`, a v1/v2 switch) with no `pointerup`/`pointercancel`, and without it the next plain hover keeps dragging the bubble and sends overlay commands.
- **Protocol:** the field contract is "Shared protocol contract" in `cast-presenter-server/docs/specs/client-composition/plan.md`.

## Auth

Cast can run anonymously OR with a token-in-URL. The `cast2Client` baseQuery handles both shapes. See skill `auth-flow` for the localStorage wallet hooks (only used when a logged-in user joins).

## Cross-references

- Skill `rtk-query-split` — RTK Query architecture + rules 17 & 18.
- Skill `perf-tier` — manualChunks CSS gotcha, LiveKit lazy loading.
- Skill `auth-flow` — token-in-URL flow.
- Skill `add-route` — adding new routes under `/cast/*`.
