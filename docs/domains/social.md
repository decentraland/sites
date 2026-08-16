# social

Communities feature. Mounted under `<DappsShell />` (heavy route).

## Routes

`/social/communities/:id`, plus `/social/*` catch-all not-found.

## Key paths

| Path                                             | Purpose                                                                                  |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `src/pages/social/`                              | Page components for the social area (community detail, not-found).                       |
| `src/components/social/`                         | Social-specific UI components (community cards, member lists, action buttons).           |
| `src/features/communities/communities.client.ts` | RTK Query endpoints + helpers for `/social/communities/*`. Injected into `socialClient`. |
| `src/services/socialClient.ts`                   | RTK Query base for social/communities (`decentraland-social` API).                       |

## API versions

Community **reads** use the social-service `/v2` endpoints (`/v2/communities/:id`, `/v2/communities`, `/v2/communities/:id/members`, `/v2/members/:address/requests`) — including the communities list `features/discover` injects into `socialClient`. These are address-only: they never carry Catalyst profile data, so `ownerName` and the members' `name` / `profilePictureUrl` / `hasClaimedName` are resolved client-side —
`useProfiles` (one batched `POST /lambdas/profiles` per members page) for the member list, `useProfileAvatar` for the owner row. `friendshipStatus` still comes from the API; it's derived from the social graph, not a profile.

Everything without a `/v2` counterpart stays on `/v1`: the writes (join, create/cancel request) and `/v1/members/:address/communities` (profile Communities tab). `/v1` is not deprecated upstream.

## Auth + mutations

Community mutations (join, leave, admin actions) call `signedFetch(url, identity)`. Reads are anonymous unless the endpoint requires membership context. See skill `auth-flow`.

## Cross-references

- Skill `rtk-query-split` — RTK Query architecture + rules 17 & 18.
- Skill `auth-flow` — signed mutations.
- Skill `add-route` — adding new routes under `/social/*`.
