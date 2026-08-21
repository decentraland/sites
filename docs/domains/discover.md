# Discover

The `/discover` explore section (heavy `DappsShell` tier). Routes: `/discover` (Live Now rail + Featured rail + Explore band), `/discover/communities`, `/discover/place/:position`, `/discover/world/:name`, `/discover/*` (404, reuses `SocialNotFoundPage`). All render inside `<DiscoverLayout />` (purple radial page background, 64/96 navbar clearance).

## Data layer

| Piece                                       | Purpose                                                                                                                                                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/discover/discover.client.ts`  | Endpoints injected into `placesClient` (places, **destinations**, favorites, hot-scenes, live-worlds, worlds-by-names, place/world detail) and `socialClient` (communities list).                                     |
| `src/features/discover/discover.types.ts`   | Row + args types. `DiscoverOrderBy` mirrors the API enum (`most_active`, `like_score`, `created_at`, `updated_at`) — there is NO server-side alphabetical ordering.                                                   |
| `src/features/discover/discover.helpers.ts` | `isHiddenPlace` (junk filter), `placeCoverImage`, `buildDetailPath`, `buildJumpInHref`, `discoverPlacePayload` (Segment), categories.                                                                                 |
| `src/features/discover/sceneAdapter.ts`     | Scene detail plumbing: catalyst entity resolution, gatekeeper `/get-scene-adapter` + cast watcher-token (signed fetch), `fetchWorldScenes` (returns `null` on transient failure vs `[]` for a genuinely empty world). |
| `src/features/discover/guestIdentity.ts`    | Tab-lifetime guest auth chain for read-only room joins.                                                                                                                                                               |

### Endpoint quirks (places-api, verified against docs/openapi.yaml)

- `/destinations` is the ONLY endpoint that mixes places + worlds and the only server-side source of highlighted worlds (`/worlds` ignores `only_highlighted`). Its order contract is **highlighted first → `ranking` desc → `order_by`** — fine for curated surfaces (Featured) and small filtered sets (owner / favourites), wrong for a user-facing sort (why the sort dropdown was removed).
- `/places` drops the `owner` filter when `order_by=most_active` — owner queries always use `updated_at`.
- `search` requires ≥3 chars (the URL builder drops shorter terms); `limit` caps at 100.

## Pages + components

- `src/pages/discover/DiscoverHomePage.tsx` — Live Now rail (top 4 live, mobile carousel), Featured rail (collapsed to 2 rows behind VIEW ALL / VIEW LESS), Explore band (tabs, search, category; grid = live-not-in-rails first by user count, then curated `/destinations` order, deduped against both rails). Failed queries render a shared error + retry state.
- `src/pages/discover/DiscoverScenePage.tsx` — live-presence-gated detail. Desktop live → bevy iframe (`BEVY_WEB_URL` + `systemScene=tortilla.dcl.eth&portables=none&guest=1&hud=0`) + always-visible read-only chat; empty/mobile → JUMP IN modal/full page.
- `src/components/discover/` — cards (`PlaceCard`, `FeaturedCard`, `LiveEventCard`, `CommunityCard`, all `memo()`d, covers via `safeCssUrl`), `SceneLiveWatcher` (viewer card + chat dock), `SceneJumpInModal`, `_shared/` (tokens: `SCENE_PANEL_GRADIENT`, `FEATURED_GRADIENT`, `HOVER_GLOW`, error/retry styled).
- Owner by-lines resolve the owner's profile name first (batched `POST /lambdas/profiles` in `features/profile/profile.client.ts`), falling back to scene metadata.

## Observability

Network failures log raw bodies to console and report to Sentry via `src/modules/discoverSentry.ts` (deferred import — the Sentry chunk never loads eagerly in `DappsShell`).
