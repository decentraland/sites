# reels

In-game camera screenshots. Absorbed from the standalone `reels.decentraland.org` Gatsby app. **Layout-less** (fullscreen UX) — bypasses `<Layout />` and `<DappsShell />` entirely. The immersive screenshot UX is preserved by keeping these routes out of the shared navbar/footer chrome.

## Routes

`/reels`, `/reels/list/:address`, `/reels/:imageId`.

Placed BEFORE the `<Route element={<Layout />}>` block in `src/App.tsx` (Layout-less group).

## Key paths

| Path                                  | Purpose                                                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/pages/reels/`                    | Page components for the reels area (gallery, single image view).                                                  |
| `src/components/Reels/`               | Reels-specific UI components (image grid, fullscreen viewer, share controls). Note the capitalized directory.    |
| `src/features/reels/reels.client.ts`  | Reels camera-screenshot client + helpers. Uses `useSyncExternalStore`-style hooks (NOT RTK Query).                |
| `src/features/reels/*.helpers.ts`     | Image URL builders, address parsing, share-link helpers.                                                          |

## Lightweight tier rules apply

Reels are lightweight even though they're a full feature area:

- Use `useSyncExternalStore`-based clients (mirrors `features/events/events.discovery.ts`, `features/profile/`).
- Do NOT import from `src/shells/*`, `src/services/*`, or any heavy-tier feature directory.
- No Redux, no RTK Query, no Web3 deps.

## Cross-references

- Skill `add-route` — Layout-less tier (placed BEFORE `<Layout />` block).
- Skill `auth-flow` — wallet/identity hooks (reels uses `useWalletAddress` for the `/reels/list/:address` view).
