---
name: rtk-query-split
description: Use when adding or editing RTK Query base clients (`src/services/<name>Client.ts`) or endpoint files (`src/features/<domain>/*.client.ts`, including `*.admin.client.ts` and `*.search.client.ts`). Covers the services/features split rationale plus Pre-PR rule 17 (no direct store imports in endpoint files) and rule 18 (no internal RTK Query cache state access via `as any`). Triggers on edits to those paths or mentions of "RTK Query", "injectEndpoints", "transformResponse", "onQueryStarted", "base client", "endpoint injection", "reducerPath".
---

# rtk-query-split

This SPA splits RTK Query into two folders per backend API. The split breaks a circular dep with `src/shells/store.ts`, matches RTK Query's official "empty api + inject" pattern, and keeps the store lean.

## Layout

**Infra** — `src/services/<name>Client.ts`:

- Declares the empty base client (base URL, cache config, tag types, custom signed-fetch baseQuery when needed).
- **No endpoints.**
- Imported by `src/shells/store.ts` to register reducers and middleware.
- Existing bases: `cmsClient`, `placesClient`, `socialClient`, `cast2Client`, `storageClient`, `subgraphClient`, `marketplaceClient`, `referralClient` (the profile tabs inject `profile.*.client.ts` endpoints into the last two).
- Two legacy bases live next to their endpoints (still load via the shell): `eventsClient` (`features/events/events.client.ts`) and `adminClient` (`features/events/events.admin.client.ts`).

**Business logic** — `src/features/<api>/<api>.client.ts`:

- And siblings: `<api>.admin.client.ts`, `<api>.search.client.ts`, etc.
- Calls `<base>.injectEndpoints({ endpoints: builder => ({ ... }) })`.
- Example: `features/cms/cms.client.ts` injects `getBlogPosts`, `getBlogPost`, `getBlogCategories`, … into `cmsClient`. `features/cms/cms.search.client.ts` injects the search endpoints into the same `cmsClient`.

## Why the split

1. **Breaks a circular dep.** `store.ts` imports the base client. Endpoints in `features/cms/cms.client.ts` import `store` for one cache-read optimization (`getPostFromStore`). If the base client lived next to the endpoints, that would cycle. The split keeps the hub (`services/`) free of app-layer imports.
2. **Matches RTK Query's recommended pattern** ([code splitting](https://redux-toolkit.js.org/rtk-query/usage/code-splitting)). The "empty api + inject" idiom scales cleanly with each new dapp.
3. **Keeps the store lean.** `store.ts` doesn't need to import feature endpoint definitions just to register reducers/middleware.

## Steps — adding endpoints to an existing base

1. Create `src/features/<domain>/<domain>.client.ts` (or sibling like `<domain>.admin.client.ts`, `<domain>.search.client.ts`).
2. Call `<base>.injectEndpoints({ endpoints: builder => ({ ... }) })`.
3. Re-export the generated hooks from `src/features/<domain>/index.ts` — barrel MUST export ALL public hooks (CLAUDE.md Pre-PR rule 7).

## Steps — adding a new base client

Only when the new domain genuinely doesn't fit any existing base (`cmsClient`, `placesClient`, `socialClient`, `cast2Client`, `storageClient`, `subgraphClient`, `eventsClient`, `adminClient`).

1. Create `src/services/<name>Client.ts` with `createApi({ reducerPath: '<name>Client', baseQuery: ..., endpoints: () => ({}) })`.
2. Register reducer + middleware in `src/shells/store.ts`.
3. Add a test asserting the store builds with the expected `reducerPath` key (CLAUDE.md Pre-PR rule 6).

## Rule 17 — No direct store imports in endpoint files

Endpoint files (`features/<domain>/<domain>.client.ts`) must NOT `import { store } from '.../shells/store'` for dispatching inside `transformResponse` or `queryFn`. That creates a circular dep with `store.ts` and breaks tree-shaking guarantees.

Use RTK Query's `onQueryStarted` lifecycle instead:

```ts
getBlogPosts: builder.query({
  query: args => `posts?${args}`,
  async onQueryStarted(arg, { dispatch, queryFulfilled }) {
    try {
      const { data } = await queryFulfilled
      dispatch(postsUpserted(data.items))
    } catch {
      /* hook surfaces error */
    }
  }
})
```

A single legitimate read of `store.getState()` for cache-check optimizations is tolerated (see `features/cms/cms.client.ts:getPostFromStore`) as long as the file does NOT dispatch from within RTK Query callbacks.

## Rule 18 — No internal cache state access

NEVER reach into `state.cmsClient.queries` or similar internals via `as any` casts. The shape is undocumented and changes between `@reduxjs/toolkit` minor versions.

Read cached data through one of:

- Normalized entity-adapter selectors (preferred — `selectBlogPostById(state, id)`).
- `cmsClient.endpoints.getBlogPost.select(args)(state)`.
- Generated hooks with `selectFromResult` inside components.

If the data isn't reachable through any of the above, add an `onQueryStarted` that upserts into an entity adapter — then select from there.

## Pitfalls

- Forgetting to re-export hooks from the feature's `index.ts` → consumers do deep imports → barrel contract breaks (Pre-PR rule 7).
- Throwing at module top-level for env-var validation (`if (!CMS_BASE_URL) throw`) — crashes the entire lazy chunk load. Use a lazy getter that throws on invocation instead (CLAUDE.md Pre-PR rule 16).
- Mutating data returned by `queryFn` / `transformResponse` / `updateQueryData` — RTK Query expects immutability. Build enrichment in a `Map`, then map over an immutable copy (Pre-PR rule 22).
- Re-creating a base client per route — they're singletons. Inject endpoints, don't create duplicates.
