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

## Auth + mutations

Community mutations (join, leave, admin actions) call `signedFetch(url, identity)`. Reads are anonymous unless the endpoint requires membership context. See skill `auth-flow`.

## Cross-references

- Skill `rtk-query-split` — RTK Query architecture + rules 17 & 18.
- Skill `auth-flow` — signed mutations.
- Skill `add-route` — adding new routes under `/social/*`.
