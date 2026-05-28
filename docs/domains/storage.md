# storage

Scene + player storage browser. Absorbed from `storage-service-site`. Mounted under `<DappsShell />` (heavy route). Uses two RTK Query base clients: the storage service API and a Graph subgraph for on-chain ownership lookups.

## Routes

`/storage`, `/storage/select`, `/storage/env`, `/storage/scene`, `/storage/players`, `/storage/players/:address`. Plus `/storage/*` not-found.

## Key paths

| Path                                     | Purpose                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/pages/storage/`                     | Page components for the storage area (scene browser, player browser, env selector, not-found).          |
| `src/components/storage/`                | Storage-specific UI components (scene grid, player tiles, ownership badges).                            |
| `src/features/storage/storage.client.ts` | RTK Query endpoints for scene / players / assets queries. Injects into `storageClient`.                 |
| `src/features/storage/assets.client.ts`  | RTK Query endpoints for on-chain ownership lookups (The Graph subgraph). Injects into `subgraphClient`. |
| `src/services/storageClient.ts`          | RTK Query base for storage-service-site (scene + player metadata).                                      |
| `src/services/subgraphClient.ts`         | RTK Query base for The Graph subgraph queries used by `/storage/*` ownership checks.                    |

## Auth + mutations

Mutations (upload scene, manage player data) call `signedFetch(url, identity)`. Reads against the public scene catalog are anonymous. See skill `auth-flow`.

## Two base clients

This is one of the few areas with two distinct base clients (`storageClient` for the service, `subgraphClient` for The Graph) because they're genuinely different domains. Adding a third would require strong justification — see skill `rtk-query-split` step "Adding a new base client".

## Cross-references

- Skill `rtk-query-split` — RTK Query architecture + rules 17 & 18.
- Skill `auth-flow` — signed mutations.
- Skill `add-route` — adding new routes under `/storage/*`.
