---
name: avatar-background-color
description: Use when adding or editing any avatar surface (AvatarFace, custom avatar styled components, EventCard avatar slot, navbar avatar). Enforces the deterministic background color from ADR-292's NameColorHelper so avatars render the same hue here as in the unity-explorer. Triggers on "avatar", "AvatarFace", "AvatarImage", "creator avatar", "profile picture", or edits to files matching `**/avatar*` or any styled component in `**/*.styled.ts` whose name contains `Avatar`.
---

# avatar-background-color

Every avatar surface in this repo paints a deterministic background derived from the user's display name, mirroring `decentraland/unity-explorer`'s `NameColorHelper.GetNameColor` (referenced from ADR-292's avatar rendering pipeline). Same algorithm in browser and in-world = visually consistent identity.

## The algorithm (do not re-implement, import the helpers)

`src/utils/avatarColor.ts`:

- `getDisplayName({ name, hasClaimedName, ethAddress })` — strips non-alphanumeric Unicode, appends `#<last4 of address>` for unclaimed names, mirroring `Profile.CompactInfo.GenerateAndValidateName`.
- `getAvatarBackgroundColor(displayName)` — FNV-1a 32-bit hash → hue → HSV(hue, 0.75, 1) → `#rrggbb`.

The hooks that already wire this up:

- `useProfileAvatar(address)` returns `backgroundColor: string`.
- `useCreatorAvatar(address, name)` and `useCreatorProfile(address, userName)` propagate it; the latter overrides it with the Foundation brand violet (`#9d76e3`) when `isDclFoundationCreator(userName)` matches.

Never re-derive the color in a component — always pull from the hook (when one of the avatar hooks already runs) or call `getAvatarBackgroundColor(getDisplayName(...))` once at the parent level.

## Application patterns

### 1. Direct `<AvatarFace />` from `decentraland-ui2`

`AvatarFace`'s prop type does **not** expose `sx` or a background prop, so passing `sx={{ backgroundColor }}` is a TypeScript error. Wrap it in a styled container that targets `& .MuiAvatar-root` (see `src/components/Home/CatchTheVibe/CatchTheVibe.styled.ts:UserInfo`):

```ts
const UserInfo = styled(Box, { shouldForwardProp: prop => prop !== '$avatarBackgroundColor' })<{ $avatarBackgroundColor?: string }>(
  ({ $avatarBackgroundColor }) => ({
    ...($avatarBackgroundColor && {
      '&& .MuiAvatar-root': { backgroundColor: $avatarBackgroundColor }
    })
  })
)
```

`&&` doubles class specificity so it overrides ui2's themed `secondary.light` default.

### 2. `<EventCard avatar={...} />` (avatar inherited from ui2)

`EventCard` renders `AvatarFace` internally — same `& .MuiAvatar-root` override at the wrapper level. See `src/components/Home/WhatsOn/WhatsOn.styled.ts:CardWrapper`. If the wrapper already hides the avatar (e.g. `LiveCardWrapper` sets `display: none` on the avatar slot) skip the override entirely.

### 3. Custom styled `<img>` / `<div>` avatars (Navbar, AdminPermissionsModal, jump Card, LiveNowCard)

Forward the color via styled-component prop or inline `style={{ backgroundColor }}`. Pattern: filter the prop with `shouldForwardProp` so it doesn't leak to the DOM:

```ts
const CreatorAvatar = styled('img', { shouldForwardProp: prop => prop !== 'avatarBackgroundColor' })<{ avatarBackgroundColor?: string }>(
  ({ avatarBackgroundColor }) => ({
    backgroundColor: avatarBackgroundColor ?? '#f0f0f0' /* sensible fallback for the placeholder */
  })
)
```

For sites that already pass other style props through (e.g. `LandingNavbar`'s `AvatarButton`), inline `style={{ backgroundColor: avatarBackgroundColor }}` is fine and avoids touching the styled-component signature.

## Inputs by call site

| Site                     | How to source the color                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Has `useProfileAvatar`   | Destructure `{ backgroundColor }`.                                                                                                                   |
| Has `useCreatorAvatar`   | Destructure `{ backgroundColor }`. Override to `#9d76e3` when `card.isGenesisPlaza` is true.                                                         |
| Has `useCreatorProfile`  | Destructure `{ backgroundColor }` — Foundation override is already applied inside the hook.                                                          |
| Static profile data only | Compute inline with `getAvatarBackgroundColor(getDisplayName({ name, hasClaimedName, ethAddress }))`. Wrap in `useMemo` keyed on those three fields. |
| No profile fetched yet   | Call `useProfileAvatar(address, { skip: !address })` at the parent. Cheap — query is cached.                                                         |

## Tests to add when introducing a new avatar surface

- A spec that mocks the hook to return a known `backgroundColor` and asserts the styled DOM applies it.
- For Foundation-overridden surfaces, assert `#9d76e3` paints when `isGenesisPlaza` / `isDclFoundationCreator` matches.

## Don't

- **Don't** re-introduce `getCreatorColor(address)`. The legacy djb2-based helper was removed because its hue was derived from the address only — Unity uses the display name (`Validated#xxxx` or claimed-name) so the colors didn't match between surfaces.
- **Don't** hardcode the Foundation override hex; import `DCL_FOUNDATION_BACKGROUND_COLOR` from `src/utils/avatarColor.ts`. The navbar's loading shimmer (`#FF4BED`) is the only pre-existing palette literal allowed for an avatar surface, and only on the loading-state class.
- **Don't** call `getAvatarBackgroundColor` on a raw username without first running `getDisplayName(...)` — Unity validates and suffixes before hashing, so skipping that step diverges on every name with whitespace, punctuation, or no claimed name.

## References

- ADR-292: <https://adr.decentraland.org/adr/ADR-292> — describes the explorer rendering pipeline; the algorithm itself is in `unity-explorer/Explorer/Assets/DCL/Infrastructure/Utility/NameColorHelper.cs` and the display-name validation in `Profile.CompactInfo.GenerateAndValidateName` (same repo).
- Helper + spec: `src/utils/avatarColor.ts`, `src/utils/avatarColor.spec.ts`.
