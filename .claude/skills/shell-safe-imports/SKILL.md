---
name: shell-safe-imports
description: Use when adding or editing files under `src/shells/*` or any file imported by `src/shells/store.ts` (RTK Query base clients, feature endpoint files, listener middleware). Covers Pre-PR rule 16 — no module-top-level throws in shell-reachable code, because one bad import crashes the entire lazy `DappsShell` chunk load. Triggers on edits to `src/shells/store.ts`, `src/services/*Client.ts`, `src/features/*/*.client.ts`, or any file in the shell's import graph. Also on mentions of "top-level throw", "env var validation", "lazy chunk", "DappsShell crash", "shell-reachable", "module top-level".
---

# shell-safe-imports

The `<DappsShell />` is a lazy-loaded chunk. When a user navigates to `/events`, `/blog`, `/jump`, `/social`, `/cast`, `/storage`, or `/profile`, the chunk loads — and **every** module in its import graph evaluates synchronously.

If ANY one of those modules has a `throw` at the top level (not inside a function — at module scope), the entire lazy chunk load fails. Not just the feature that needed the validation. **All of `DappsShell`** crashes, the user sees a blank page or fallback UI for all heavy routes, even ones unrelated to the broken module.

## Rule 16

NEVER throw at module top-level in files imported by `src/shells/store.ts` or any file reachable from the lazy `DappsShell` chunk boundary.

## Pattern — lazy validation getter

For env-var validation (the common case that tempts a top-level throw), use a lazy getter that throws only on invocation:

```ts
const getCmsBaseUrl = (): string => {
  const url = getEnv('CMS_BASE_URL')
  if (!url) throw new Error('CMS_BASE_URL is required')
  return url
}

// Inside endpoint:
url: `${getCmsBaseUrl()}/entries?...`
```

The error surfaces at request time (the endpoint that needs the var), not at chunk-load time (which crashes everything).

## Anti-patterns

```ts
// 🚫 At module top-level — crashes the entire DappsShell on import
const CMS_BASE_URL = getEnv('CMS_BASE_URL')
if (!CMS_BASE_URL) throw new Error('CMS_BASE_URL is required')

// 🚫 Class field default that evaluates synchronously
class Client {
  baseUrl =
    getEnv('CMS_BASE_URL') ??
    (() => {
      throw new Error('missing')
    })()
}

// 🚫 IIFE at top-level
const baseUrl = (() => {
  const url = getEnv('CMS_BASE_URL')
  if (!url) throw new Error('CMS_BASE_URL is required')
  return url
})()
```

```ts
// ✅ Lazy getter — only throws if the endpoint that needs it is actually called
const getCmsBaseUrl = () => {
  const url = getEnv('CMS_BASE_URL')
  if (!url) throw new Error('CMS_BASE_URL is required')
  return url
}
```

## Which files are shell-reachable?

Conservatively, treat any of these as reachable:

- `src/shells/store.ts` and anything it imports directly (listener middleware, base clients).
- `src/services/*Client.ts` — all RTK Query base clients (registered in `store.ts`).
- `src/features/*/*.client.ts` and siblings (`*.admin.client.ts`, `*.search.client.ts`) — injected at store init.
- Helpers imported by any of the above (sanitizers, mappers, utility modules).

If you're unsure, assume yes. The cost of using a lazy getter when it wasn't strictly needed is zero. The cost of a top-level throw in a reachable module is a broken `DappsShell`.

## Verification

After editing any shell-reachable file:

```bash
npm run build && npm run preview
```

Then navigate to `/events` or `/blog` and confirm the route loads (not the fallback). If the route silently fails, check the console — top-level throws appear as `Failed to load resource` / chunk-load errors.

## Related

- RTK Query patterns → skill `rtk-query-split`.
- Adding a new feature to the heavy tier → skill `add-route` (heavy steps).
