# Feature Architecture

`src/features` is grouped by product domain first and backend endpoint boundaries second.

## Domains

- `content/blog`: CMS-backed blog post, category, author, normalized post cache, and infinite blog pagination code.
- `content/search`: CMS-backed blog search endpoints and search result types.
- `experiences/discovery`: landing page live cards built from Events API live events, hot-scenes, Catalyst deployments, and profile enrichment.
- `experiences/events`: Events API reads, event creation, event editing, poster uploads, attendee mutations, live-now cards, upcoming cards, world names, and event-owned community lookups.
- `experiences/events/admin`: Events API admin profile settings, admin permission updates, pending event list, approve, and reject mutations.
- `experiences/jump`: places/events deep-link endpoints and scene deployer metadata lookups.
- `media/cast`: cast streamer/watcher token endpoints, presentation upload endpoints, LiveKit contexts, chat context, and cast helpers.
- `media/reels`: camera reel metadata fetches, profile face enrichment, wearable enrichment, and reel URL helpers.
- `platform/notifications`: page notification integration.
- `safety/report`: report form types and report submission payload helpers.
- `social/communities`: Social API communities, members, requests, and community event mapping.
- `social/profile`: Catalyst profile cache hooks shared by pages and cards.
- `world/storage`: storage admin endpoints, world scenes, subgraph-backed land/rental/name endpoints, and storage context helpers.

## Import Rules

App code should import from grouped paths such as `features/experiences/events`, `features/social/communities`, or `features/world/storage`.

Legacy paths under `features/events`, `features/whats-on-events`, `features/whats-on/admin`, `features/jump`, `features/blog`, `features/search`, `features/communities`, `features/profile`, `features/cast2`, `features/reels`, `features/storage`, `features/report`, and `features/notifications` are compatibility shims only.

Do not place new implementation code in legacy shim folders.

Do not rename RTK Query clients or `reducerPath` values during folder refactors.
