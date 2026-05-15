# Profile migration — context, status, learnings

Migration of the standalone `profile.decentraland.org` and `account.decentraland.org` dApps into the `sites` SPA as a new `/profile/*` route group. Tracked on branch `feat/profile-migration` (was `feat/profile-rebuild`).

This is **NOT a 1:1 port** — the UI is rewritten in `decentraland-ui2` against the new Figma file `Profile-Account` (`yJKdWwOvajSa3R95RAEMkq`). The account dApp is being **absorbed** into the unified profile (it will not get its own root); MVP only ships the profile pages.

Fixture address for testing: `0xd9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd` (Brai).

## Scope (MVP)

The 4 Figma nodes are the source of truth:

- `Member Profile` (167:89079) + `Member Profile Flow` (167:89148)
- `My Profile` (322:49163) + `My Profile Flow` (346:33999)

Pattern: `/profile/:address/:tab?`. `/profile/me` redirects to the logged-in address. Member tabs (5): Overview, Creations, Communities, Places, Photos. My tabs (6): + Assets, + Referral Rewards.

**Out of scope for the MVP**: account dApp transfer/bridge/credits/subscription, archiving the standalone dApp repos, 301 redirects, friendship/follow/block end-to-end wiring beyond the Header CTA stubs.

## Architecture

- **Routing** (`src/App.tsx`): all 5 profile routes (`/profile`, `/profile/me`, `/profile/:address`, `/profile/:address/:tab`) are lazy-loaded **inside** `<Route element={<DappsShell />}>` — heavy tier. The shell already provides Redux, Suspense, HelmetProvider.
- **`/profile/me` redirect** (`ProfileMeRedirect.tsx`): reads `useAuthIdentity()` and `<Navigate>` to `/profile/<address>` or `/sign-in?redirect=/profile/me` if unauthenticated.
- **Standalone Profile Page** (`pages/profile/ProfilePage.tsx`) and the **ProfileSurface** (`components/profile/ProfileSurface/ProfileSurface.tsx`) — surface is extracted from the page so the same component renders inside both the route and the in-modal swap. ProfileSurface accepts an `embedded?: boolean` prop; when true it strips `ProfileLayout`'s outer chrome (gradient bg + ProfileCard frame) and lets the host (modal Paper) act as the container.
- **No Web3 providers.** Auth via `useAuthIdentity()` (localStorage SSO) + `signedFetch(url, identity)` for mutations. Matches the sites pattern documented in CLAUDE.md.
- **Hover-on-self redirects**: the global `ProfileModalHost` mounted in `DappsShell` opens a profile modal anywhere on heavy routes when `?profile=<address>` is in the URL.

### Two ways to open a profile

1. **Standalone modal** — anywhere on a heavy route, call `useOpenProfileModal()(address)`. Adds `?profile=<addr>` to the current URL → `ProfileModalHost` mounts `ProfileModal` on top. Closing strips the param, back button restores.
2. **In-modal swap** — when the caller is inside another modal (event detail, place detail), that modal renders `<ModalProfileNavigationProvider onOpenProfile={swapToProfile}>`. `useOpenProfileModal()` reads that context first and delegates to the host modal; the host modal swaps its content for `<ProfileSurface embedded ... />` and widens its `maxWidth`. Back chevron in the profile header returns to the event view via `onBack`. This is what whats-on uses.

## Directory map of the new code

```
src/
├── pages/profile/
│   ├── ProfilePage.tsx               # standalone /profile/:address route
│   ├── ProfileMeRedirect.tsx         # /profile/me → /profile/<viewerAddr>
│   ├── index.tsx                     # exports
│   └── tabs/
│       ├── OverviewTab.tsx           # bio + badges + info + links + equipped items
│       ├── OverviewTab.types.ts
│       ├── OverviewTab.helpers.ts    # toRarity, toItemNetwork, toCatalogAsset, formatPriceMana, ...
│       ├── OverviewTab.styled.ts
│       ├── OverviewTab.creator.tsx   # <CreatorByLine> partial (uses useCreatorProfile)
│       ├── AssetsTab.tsx             # stub
│       ├── CreationsTab.tsx          # stub
│       ├── CommunitiesTab.tsx        # stub
│       ├── PlacesTab.tsx             # stub
│       ├── PhotosTab.tsx             # stub
│       ├── ReferralRewardsTab.tsx    # stub
│       └── StubTab.tsx               # shared empty-tab scaffold
├── components/profile/
│   ├── AvatarRender/                 # WearablePreview wrapper, 389×706.442 fixed
│   ├── NFTGrid/                      # generic grid + rarity bg helper
│   ├── ProfileAvatar/                # round avatar with seeded background + padding ring (ADR-292)
│   ├── ProfileHeader/                # name + addr + CTAs + close + onBack chevron
│   ├── ProfileLayout/                # LayoutRoot + ContentArea + ProfileCard + BodySplit (animated aside)
│   ├── ProfileSurface/               # composes Header + Tabs + AvatarRender + tab content
│   ├── ProfileTabs/                  # ui2 Tabs, URL-driven, tab availability per Member/My
│   └── ProfileModal/
│       ├── ProfileModal.tsx                 # Dialog wrapping ProfileSurface
│       ├── ProfileModalHost.tsx             # global mount, listens to ?profile=
│       ├── ProfileModal.constants.ts        # PROFILE_MODAL_QUERY_KEY (separate to avoid pulling heavy deps into useOpenProfileModal)
│       ├── ModalProfileNavigation.tsx       # context for in-modal swap
│       └── useOpenProfileModal.ts           # context-first, URL-fallback opener
├── features/profile/
│   ├── profile.client.ts             # lightweight useSyncExternalStore lookup (avatar/name/colour) — used elsewhere too
│   ├── profile.wearables.client.ts   # marketplace-api /v2/catalog for equipped items
│   ├── profile.badges.client.ts      # badges-api /users/:address/badges
│   ├── profile.social.client.ts      # social-rpc-v2 friendship endpoints
│   └── index.ts
└── shells/
    └── DappsShell.tsx                # mounts <ProfileModalHost /> alongside the Outlet
```

External:

- `src/hooks/useCreatorProfile.ts` — already existed for whats-on. Resolves creator address → display name + face URL + ADR-292 seed colour. Reused for "By {creatorName}" everywhere.
- `src/intl/{en,es,fr,ja,ko,zh}.json` — all six locales have the `profile.*` namespace populated.

## ui2 fork (decentraland-ui2)

The submodule sits at `profile-migration/ui2/` checked out on tag **`3.8.0`** with **uncommitted changes** in `src/components/CatalogCard/`:

- `CatalogCard.types.ts` — 4 new optional props (backward-compatible):
  - `creatorSlot?: ReactNode` — replaces the default `<AssetAddress>` below the title. Pass `null` to hide.
  - `hideRarityOnHover?: boolean` — fades the `RarityBadge` out on hover (used so `bottomAction` takes its slot).
  - `hoverShadow?: 'default' | 'glow'` — `'glow'` swaps the legacy depth shadow for the whats-on style spotlight (`translateY(-4px)` + `0px 2px 12px 12px rgba(255,255,255,0.3)`).
  - `bottomAction?: ReactNode` — block revealed at the bottom of the card on hover (the "BUY" button).
- `CatalogCard.tsx` — renders `creatorSlot` when set; renders `bottomAction` inside `BottomActionContainer`; the rarity badge is wrapped in `RarityBadgeSlot` so it can be faded.
- `CatalogCard.styled.ts` — switched the `${BottomActionContainer}` / `${RarityBadgeSlot}` selectors to **`data-role="catalog-card-bottom-action"` / `data-role="catalog-card-rarity"`** attribute selectors. The legacy `${ExtraInformationContainer}` / `${CatalogItemInformationContainer}` / `${AssetImageContainer}` still use Emotion component selectors — sites' Vite babel-plugin transform keeps them working.

To get those changes into sites we use a local pack + install:

```sh
cd ui2
npm install            # only once (deps for tsc)
npm run build          # tsc → dist/
npm pack               # decentraland-ui2-1.3.10.tgz

cd ../sites
npm install --no-save ../ui2/decentraland-ui2-1.3.10.tgz
rm -rf node_modules/.vite
npm run dev            # restart, hard-reload the browser
```

`npm link` was tried earlier but **broke transitive hoists** (`radash`, `date-fns` — see learnings). The `.tgz` install is more robust because npm copies the package contents into `node_modules/decentraland-ui2/` instead of symlinking; transitive deps come from sites' own `node_modules`.

`npm ci` will purge the override and reinstall `decentraland-ui2@3.8.0` from the registry; repeat the pack+install after.

When the ui2 changes get committed upstream and a new version is published, drop the override and bump the dep in sites' `package.json`.

## Vite config additions (`sites/vite.config.ts`)

- **`emotion-ui2-styled-transform`** — a top-level Vite plugin that runs `@babel/core.transformAsync` with `@emotion/babel-plugin` over any file matching `/decentraland-ui2[/\\]dist[/\\].+\.styled\.js$/`. Needed because Vite uses `@vitejs/plugin-react` v6 (oxc-based), which does not run babel on user code; the legacy CatalogCard styles depend on `@emotion/babel-plugin` to inject `target` identifiers for component selectors. This plugin fires during `npm run build` (Rollup).
- **`optimizeDeps.rolldownOptions.plugins`** — the same babel-plugin transform registered for Vite's dep prebundle (Rolldown). Top-level Vite plugins do **not** fire during prebundle; if this is omitted the dev server crashes with `Component selectors can only be used in conjunction with @emotion/babel-plugin`.
- **`vite-plugin-node-polyfills` removed.** No sites source code imports `Buffer`/`process`/`global` at runtime; `@dcl/hashing` uses a safe `util.inquire("buffer")` fallback. Removed to silence deprecation warnings.

## Backend endpoints in use

| Endpoint                              | Service           | Env var               | Public/auth |
| ------------------------------------- | ----------------- | --------------------- | ----------- |
| `GET /lambdas/profiles/:address`      | catalyst lambdas  | `PEER_URL`            | public      |
| `GET /users/:address/badges`          | badges-api        | `BADGES_API_URL`      | public      |
| `GET /v2/catalog?network=&urn=…`      | marketplace-api   | `MARKETPLACE_API_URL` | public      |
| social-rpc-v2 GetFriendshipStatus etc | social-service-ea | `SOCIAL_RPC_URL`      | authed      |

URLs in the env JSONs were patched: `BADGES_API_URL`, `MARKETPLACE_API_URL`, `REFERRAL_API_URL`, `PROFILE_URL`.

## What's done (master plan phase tracking)

- ✅ Phase 1 — Routing + lazy mount inside DappsShell
- ✅ Phase 2 — ProfileLayout + ProfileHeader + ProfileAvatar (76px with ADR-292 ring) + AvatarRender (WearablePreview 500×706, overflow visible so wings spill behind the info column)
- ✅ Phase 3 — ProfileTabs + URL sync + animated aside collapse on non-overview tabs
- ✅ Phase 4 — OverviewTab (bio, info grid, links, badges with achieved-tier tooltip, equipped items with `CatalogCard` + wearable category / body-shape badges)
- ✅ Phase 5 — Creations tab (`/v2/catalog?creator=:address` with `minListingPrice` fallback) — CatalogCard grid, Wearables/Emotes chip filters, "View all" link to `marketplace/accounts/:address`, Load-more pagination, BUY action overlays badge row on hover
- ✅ Phase 6 — Assets tab (My only) (`/v1/nfts?owner=:address`) — All/Wearables/Emotes/Names/Lands/Estates chip filters, on-sale price from `order.price`, marketplace token-page link
- ✅ Phase 7 — Communities tab (`/v1/members/:address/communities`, signed) — own-profile only (endpoint enforces auth === address); member view shows "private" empty state; thumbnails + member count + role chip
- ✅ Phase 8 — Places tab (`places-api /api/places?owner=:address`) — thumbnail / title / location / likes / online count, click → `/jump/places?position=X,Y`
- ✅ Phase 9 — Photos tab (`camera-reel-service`, env `REEL_SERVICE_URL`) — 4-col grid spec from Figma (`264.972px` card height / `16.885px` padding / `12.989px` gap), card uses `currentImages` from server total. Signed-fetch when viewing own profile (private photos surface). Click opens a `PhotoModal` in-place via `useOpenPhotoModal()`; modal reuses `ImageActions` (share to X / copy link / download / toggle info), `UserMetadata` (people row + collapsible wearables panel with BUY-on-hover from ui2), `JumpInButton` (sites' ui2 wrapper). When mounted **inside** another modal (e.g. `ProfileModal`), the click is intercepted by `ModalProfileNavigationProvider.onOpenPhoto` and the host swaps its content to `PhotoSurface` with a back chevron — never stacks a dialog on a dialog (see learning #19).
- ✅ Phase 10 — Referral Rewards (My only) — full port of profile-dapp's `Referrals/Hero/Journey/RewardCard` (envelope hero, share-to-X menu, expandable "How it works" steps, 9-tier animated stepper with shake/splash animations, rarity-tinted reward cards). Assets shipped under `public/images/referrals/` (envelope, logo-with-pointer, sports-medal, tier_1..9, reach-\*-background). i18n keys (`profile.referral_hero_section`, `profile.referral_journey`, `profile.referral_reward_card`) mirrored across 6 locales. Endpoint lives at `${SOCIAL_API_URL}/v1/referral-progress` — `REFERRAL_API_URL` env was pointing at a dead host originally; fixed to `social-api.decentraland.{zone,org}`.
- ✅ Phase 11 — Friendship & Block CTAs via `@dcl/social-rpc-client` (WebSocket). Live `getFriendshipStatus`, `requestFriendship`/`cancel`/`accept`/`removeFriendship`. Block / unblock kebab menu next to friendship button. Mutual friends preview (3 avatar dots + count) via `getMutualFriends`. Friends count + Friends modal for own profile via `getFriends`.
- ✅ Phase 12 — Mobile breakpoint per Figma `MobileMenu` (`167:85610`, `322:49246`). Horizontal `ProfileTabs` hidden `<md`; `<ProfileHeader>` exposes an `onOpenMenu` hamburger (`MobileMenuIconButton`); `<ProfileMobileMenu>` drawer slides in from the left with the avatar block + vertical tabs list (same `hiddenTabs` filter as desktop, 16px Inter semibold uppercase labels, active state highlighted, click closes). Drawer z-index sits above `theme.zIndex.modal` so it works inside `ProfileModal` too. Mobile sizing: header avatar 76→48, name 24→18, `AvatarRender` 706→360 height, `EquippedGrid` and `PhotosGrid` keep 2 columns at all narrow widths, `BodyArea` padding shrinks at `<sm`, all header CTAs (`Friends count`, `Get a name`, `Invite friends`, `Add/Remove friend`) flip to `size="small"` on mobile via `useTabletAndBelowMediaQuery`. Inline `sx` migrated to dedicated styled wrappers (`WalletIcon`, `CopyButtonIcon`, `MoreActionsButton`, `BlockMenuItemIcon`, `DrawerIconButton`).
- ✅ Profile-as-modal: `ProfileModal` (wide dialog mirroring whats-on chrome), `ProfileModalHost`, `useOpenProfileModal`, `ModalProfileNavigationProvider`
- ✅ Event modal swap-in-modal: clicking `DetailModalCreator` swaps `EventDetailModal` content for the profile surface; back chevron returns to event
- ✅ Jump cards (places + events): avatar + creator name open the standalone `ProfileModal` via `useOpenProfileModal()`
- ✅ Tooltip on badges (name + achieved tier name + tier-specific description + completion date)
- ✅ i18n parity in 6 locales for the `profile.*` namespace (en/es/fr/ja/ko/zh)
- ✅ Vite dev defaults to `?env=prod` via `.env.development` (`VITE_REACT_APP_DCL_DEFAULT_ENV=prod`)
- ✅ Tabs reveal-on-data (`useProfileTabAvailability`) — every data-driven tab (`places/photos/creations/assets/communities`) starts hidden and reveals only after its probe query (`limit:1`) confirms `total > 0`. `overview` always visible. `referral-rewards` (own only) always visible. `communities` on member view always hidden (the endpoint requires `auth === :address`, so there is nothing to render). Direct URL hits on a hidden tab redirect to overview via `onTabChange('overview')` from `ProfileSurface`.
- ✅ Mutual friends avatars — render up to 3 slots when `mutualCount > 0`. Slot with a friend in the RPC preview renders a real `<ProfileAvatar>` (face image with fallback to initial + deterministic colour). Slots without preview data render a colour-only `<MutualPic>` seeded by `${address}-${idx}` through the same `getAvatarBackgroundColor` hash. RPC sometimes returns `paginationData.total` without populating `friends`; previously this collapsed the cluster — now the visual count always matches.
- ✅ Photo-in-modal flow — `PhotoSurface` extracted from `PhotoModal` accepts `onBack?`; when present, the top-left chevron is a back button (returns to profile content); otherwise a close. `ProfileModal` wraps children in `ModalProfileNavigationProvider({ onOpenProfile, onOpenPhoto })` and toggles between `<ProfileSurface>` and `<PhotoSurface>` based on internal `viewingPhotoId` state. `useOpenPhotoModal()` delegates to the host when inside the provider, else owns a local open-state.
- ✅ Equipped wearables prefer `minListingPrice` over `price` (`profile.wearables.client.ts:nonZeroPrice`) — primary-market `price` is `"0"` for sold-out items, while `minListingPrice` is the secondary-market floor. Without this, equipped CatalogCards rendered inconsistent BUY prices.
- ✅ CatalogCard compat shim (`src/components/profile/CatalogCard/`) — declares the ui2 PR #440 props (`infoBadges`, `creatorSlot`, `bottomAction`, `disableInfoExpansion`, `hideRarityOnHover`, `hoverShadow`) on top of `decentraland-ui2@3.8.0` so sites can pass them through TS without the published ui2 component yet implementing them. Drop the shim and `import { CatalogCard } from 'decentraland-ui2'` directly once ui2 ships a version with the slots.
- ✅ Wearable hover in PhotoModal uses the profile-card glow `boxShadow: '0px 4px 25px 0px rgba(255, 255, 255, 0.25)'` instead of the legacy `background: #716b7c` (which clashed with the radial-purple panel).

## What's left

- Phase 13 — Automated E2E + Lighthouse audit + bundle-size diff vs master.
- **Sort by Latest** dropdown in Badges section (Figma).
- ui2 PR #440 (`feat/catalog-card-info-badges`) — open upstream. When merged, drop the local `--no-save` tgz install and bump `decentraland-ui2` in `package.json`. Until then, sites carries override CSS in `OverviewTab.styled.ts:EquippedGrid` (image shrink + info-container collapse on hover) — remove that override when the published ui2 version ships `disableInfoExpansion`.
- Tests: more coverage on `OverviewTab`, `ProfileModal`, `ModalProfileNavigation`, `EventDetailModal` profile swap, `FriendsModal`, `CreationsTab`/`AssetsTab` pagination.
- Web3-free verification: confirm `wagmi`/`magic-sdk`/`thirdweb` are not pulled in by the DappsShell chunk (manual `npm run build` chunk listing).

## Hard-earned learnings — keep them in mind

1. **ui2 CatalogCard hover relies on Emotion component selectors.** The `${StyledX}` form requires `@emotion/babel-plugin` at build time. Sites' Vite + oxc plugin doesn't run babel; without our compensating transform the dev server throws `Component selectors can only be used in conjunction with @emotion/babel-plugin`. The fix lives in `vite.config.ts` (top-level plugin + `optimizeDeps.rolldownOptions.plugins`). Anywhere we **add** styles to ui2 we should prefer `data-role` attribute selectors so consumers don't need the babel transform.

2. **`@vitejs/plugin-react` v6 is oxc-based.** No `babel` option. If you need babel transforms (Emotion, etc.) write a separate Vite plugin that calls `@babel/core.transformAsync`.

3. **Vite 8 prebundle uses Rolldown.** Top-level Vite plugins do **not** fire during prebundle. Use `optimizeDeps.rolldownOptions.plugins` for prebundle-time transforms. `optimizeDeps.esbuildOptions` is deprecated.

4. **`vite-plugin-node-polyfills` warns loudly in Vite 8.** Sites' source code doesn't import `Buffer`/`process`/`global` directly; transitive uses go through safe shims. Drop the plugin.

5. **`npm link` is dangerous with ui2.** `decentraland-ui2` declares `radash`, `date-fns` etc. as dependencies. When sites consumes ui2 via npm, those hoist to sites' `node_modules`. When you `npm link`, those deps stay inside `ui2/node_modules/` and TypeScript can't resolve them (sites' source imports `radash` directly — pre-existing anti-pattern in master). Use `npm pack` + `npm install --no-save <tgz>` instead; npm copies the package contents into sites' `node_modules`.

6. **WearablePreview baseUrl must NOT end with a slash.** The component compares `event.origin === baseUrl` to filter the iframe's postMessage traffic. Browser `event.origin` never has a trailing slash; `WEARABLE_PREVIEW_URL` in the env JSONs does. Strip it before passing: `getEnv('WEARABLE_PREVIEW_URL')?.replace(/\/+$/, '')`. Without this the spinner never clears.

7. **`@dcl/ui-env` cache is global.** When testing `?env=prd` overrides, `profile.client.ts` had to bake the env into the cache key (`${PEER_URL}|${address}`) — otherwise switching envs in dev keeps stale entries.

8. **Marketplace `/v2/catalog` returns `price="0"` in wei for items without listings.** Don't use price > 0 as a gate on UI affordances (BUY button, hover behaviours). Cards always link to the marketplace; let the marketplace show actual availability.

9. **Equipped wearable URNs are TOKEN URNs.** Catalyst returns `urn:...collections-v2:0xCONTRACT:ITEMID:TOKENID`. The marketplace catalog endpoint indexes ITEM URNs (without the trailing token id). Strip the 7th segment before querying (`toItemUrn` in `profile.wearables.client.ts`).

10. **Grid template gotcha.** `gridTemplateColumns: '0px 1fr'` with a single rendered child puts it in the **first** (0px-wide) cell — invisible. When `hasAside=false`, use a single-column grid (`'1fr'`). Two-column with 0px first works only when the aside is _also rendered but hidden_.

11. **ProfileLayout `embedded` mode** strips the outer chrome (gradient bg + ProfileCard frame). Use whenever the surface is mounted inside another modal/dialog whose Paper provides the visible container — otherwise you get the dreaded "double container" look.

12. **`BodyArea` needs `overflow: 'auto'` for modal embeds.** When the Paper has a constrained `maxHeight`, BodyArea must internal-scroll or content gets clipped. Header + Tabs stay pinned at the top of the modal — desired UX.

13. **Modal-in-modal: context, not URL.** Two patterns coexist. The global `useOpenProfileModal` first checks `useModalProfileNavigation()` (a context) — if present (we're inside another modal), it delegates to the parent modal's handler. Otherwise it falls back to `?profile=<addr>` and `ProfileModalHost`. This lets the event modal "swallow" profile navigation and swap content in-place.

14. **CatalogCard from ui2 has fixed width `theme.spacing(36) ≈ 288px`.** Inside an auto-fill grid (`repeat(auto-fill, minmax(250px, 1fr))`), override with `& .MuiCard-root { width: 100% }` so cards fill grid cells. Also lock `height: theme.spacing(45)` for both base and `:hover` to neutralise the legacy height-grows-on-hover behaviour.

15. **ADR-292 NameColorHelper (`src/utils/avatarColor.ts`).** The colour of the user's display name AND the avatar background must match — they're both derived from the same seed (display name + ethAddress). `useProfileAvatar` already returns `backgroundColor`; pass it as the name colour too.

16. **File separation is non-negotiable** (per sites' CLAUDE.md). For every component:

    - `<Thing>.tsx` — render only
    - `<Thing>.types.ts` — interfaces, types, props
    - `<Thing>.helpers.ts` — constants, pure utility functions
    - `<Thing>.styled.ts` — styled components, co-located
      Anything inline that survives review gets flagged.

17. **Scoped `// eslint-disable-next-line` over block disables.** User preference: never use `/* eslint-disable */ ... /* eslint-enable */` block pairs. The block pattern is hard to track and tends to drift; single-line disables are more honest.

18. **No `Co-Authored-By:` in commits.** Decentraland-wide rule (ADR-6).

19. **Never stack a modal on another modal.** Two patterns coexist in the codebase:

    - `useOpenProfileModal()` first checks `useModalProfileNavigation()` (context). Inside a provider → delegate to the host; outside → set `?profile=<addr>` and let `ProfileModalHost` open a standalone modal.
    - `useOpenPhotoModal()` mirrors the same shape for photos via `useModalPhotoNavigation()`.
      `ProfileModal` itself supplies both `onOpenProfile` and `onOpenPhoto` so any child (PhotosTab, CreatorByLine, jump cards, etc.) can request opening a profile or photo and the host swaps content in-place with a back chevron. New cross-modal navigation should follow the same provider+hook pattern, never `Dialog` inside `Dialog`.

20. **`camera-reel-service` `currentImages` is server total, not page count.** With `limit:24`, you get 24 images per page but `currentImages` reports the entire user's snapshot count (often hundreds). Display `images.length` to match what the UI actually paints, or implement pagination first.

21. **Marketplace `minListingPrice` vs `price`.** `/v2/catalog` returns `price` = primary-market price (zero/empty when supply is sold out) and `minListingPrice` = floor of active secondary-market listings. Equipped/owned wearables typically circulate via resales, so the displayed BUY price has to fall back: `nonZeroPrice(minListingPrice) ?? nonZeroPrice(price)`. Don't gate UI affordances on `price > 0` alone.

22. **ui2 published version drifts behind the local fork.** During iteration we run sites against a `npm pack`-ed ui2 tarball with new CatalogCard slots; the npm registry version doesn't have them. Vercel fails TS on the unpublished props. Workaround until the upstream PR publishes: a local `<CatalogCard>` shim (`components/profile/CatalogCard/`) that widens the type to declare the props sites uses. The shim's `as unknown as ComponentType<>` cast means published ui2 silently ignores the props at runtime instead of crashing TS.

23. **Project-scoped instinct hashing follows the git remote, not the path.** This branch lives at `/Users/braianmellor/orca/workspaces/core-workspace/profile-migration/sites` — an Orca worktree under the `core-workspace` meta-workspace. The continuous-learning hook detects the project via `git -C <cwd> remote get-url origin`, so observations made inside `sites/` land under the `sites` project (`b4b6ea69cd98`) and NOT under `core-workspace` (`436c73927bc2`). Submodules in a meta-workspace stay isolated from each other and from the wrapper.

## Quick fixture commands

```sh
# inspect a member profile
http://localhost:5173/profile/0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd/overview

# event modal → click "By {creator}" swaps to profile in-place
http://localhost:5173/whats-on?id=ba7eabc1-8c6a-4fd6-86ad-191539909478

# /profile/me when signed in
http://localhost:5173/profile/me
```
