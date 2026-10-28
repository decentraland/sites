# profile

Profile route group absorbed from the standalone `profile.decentraland.org` dapp. **Heavy routes** inside `<DappsShell />` — Redux + RTK Query + `@dcl/social-rpc-client`. Account features (mana transfer/bridge, credits, subscriptions) are NOT part of this domain.

## Routes

`/profile`, `/profile/me` (redirects to the signed-in address), `/profile/:address`, `/profile/:address/:tab`. Legacy `/profile/accounts/:address` redirects to the new shape. Tabs: `overview`, `creations`, `communities`, `places`, `photos` (+ own-only `assets`, `referral-rewards`).

## Key paths

| Path                                         | Purpose                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/profile/`                         | `ProfilePage` (route mount, tab URL sync) + `tabs/` (one component per tab) + `ProfileAccountsRedirect`.                                                           |
| `src/components/profile/`                    | `ProfileSurface` (shared by route + modal), `ProfileLayout`, `ProfileHeader`, `ProfileTabs`, `ProfileModal`, `ProfileMobileMenu`, etc.                             |
| `src/features/profile/profile.client.ts`     | The single Catalyst profile cache (`useSyncExternalStore`, per-tick batched `POST /lambdas/profiles` per peer) — the ONLY profile file safe on lightweight routes. |
| `src/features/profile/profile.*.client.ts`   | RTK Query endpoints per tab (`assets`, `creations`, `places`, `photos`, `badges`, `wearables`, `referrals`) injected into base clients.                            |
| `src/features/profile/profile.social.rpc.ts` | Friendship/block/mutuals over `@dcl/social-rpc-client` (WebSocket singleton with idle teardown + retry-on-stale-client guard).                                     |
| `src/services/marketplaceClient.ts`          | Base client for marketplace catalog/NFT endpoints (creations, assets, equipped wearables).                                                                         |
| `src/services/referralClient.ts`             | Base client for referral-progress (signed via `resolveActiveIdentity` — NEVER scan localStorage for identities).                                                   |
| `src/hooks/useLaunchExplorer.ts`             | Shared deep-link launch (JUMP IN + EDIT CTAs): `launchDesktopApp` + ui2 `DownloadModal` fallback; fires `GO_TO_EXPLORER`.                                          |

## Surfaces & modals

- One `ProfileSurface` renders the standalone route, the standalone `ProfileModal` (`?profile=<addr>` via `ProfileModalHost`) and in-modal swaps (whats-on event detail, jump cards).
- `useModalSurfaceStack` (under `components/profile/ProfileModal/`) keeps modal navigation history: profile/photo/place/community surfaces swap in-place and back unwinds one level — never a dialog on a dialog.
- Mobile uses hierarchical navigation: no tab segment → `ProfileMobileNav` root screen; tabs are sub-screens with a `MobileTabHeader` breadcrumb.

## Tabs model

Data tabs reveal on data (`useProfileTabAvailability`): each starts hidden until a `limit:1` probe confirms content; the hidden-tab redirect waits for `isReady`.

## Catalog cards

Cards come straight from `decentraland-ui2` (`CatalogCard`, ≥3.13.0 — the local shim was removed). Hover previews use `AssetPreviewPlayerProvider` (one shared wearable-preview iframe): emotes play on the profile owner's avatar, wearables render worn by it. `profile={address}` makes the preview use the viewed profile's avatar.

## Cross-references

- Skill `rtk-query-split` — base clients vs injected endpoints.
- Skill `auth-flow` — identity for signed fetches (`resolveActiveIdentity` coherence rule).
- Skill `add-route` — heavy tier rules.
- Skill `tracking-events` — `GO_TO_EXPLORER` fires from `useLaunchExplorer`.
