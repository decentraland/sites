# Pre-PR rules — extended detail (19-25)

Companion to `CLAUDE.md` "Pre-PR review". Each rule below has a one-liner in `CLAUDE.md`; the full rationale + code patterns live here so the main file stays under 40k chars.

## 19. XSS — sanitize CMS/search HTML before React innerHTML injection

- Every React innerHTML injection (the `dangerously` + `SetInnerHTML` prop) whose content originates from Contentful, the cms-server full-text search response, or any external/user-supplied source MUST run through DOMPurify with a strict tag allowlist.
- One `sanitizeX.ts` helper per source with a scoped allowlist — do NOT build a generic global sanitizer that tries to cover every case:
  ```ts
  // src/components/blog/Search/sanitizeHighlight.ts
  const sanitizeHighlight = (value: string): string => DOMPurify.sanitize(value, { ALLOWED_TAGS: ['em', 'mark'], ALLOWED_ATTR: [] })
  ```
- The cms-server search response wraps matches in `<em>` (the `highlightedTitle` / `highlightedDescription` fields exposed by `features/search/search.client.ts`), but the match TEXT came from the CMS — if an author injected a script tag into a title, unsanitized render would execute it.

## 20. URL validation — parse + allowlist, never `includes()`

- For embed renderers and any hostname check, NEVER use `uri.includes('youtube.com')` or `endsWith('instagram.com')`. Both are trivially bypassable (`https://evil.com/youtube.com/...`, `https://evil-instagram.com/...`).
- Parse with `new URL()` and compare `hostname` against a `Set` allowlist. Validate any extracted ID with a regex before interpolating into iframe `src`:

  ```ts
  const YOUTUBE_HOSTS = new Set(['www.youtube.com', 'youtube.com', 'youtu.be'])
  const YOUTUBE_ID_REGEX = /^[\w-]{1,20}$/

  const parseUrl = (uri: string): URL | null => {
    try {
      return new URL(uri)
    } catch {
      return null
    }
  }

  const getYouTubeVideoId = (uri: string): string | null => {
    const url = parseUrl(uri)
    if (!url || !YOUTUBE_HOSTS.has(url.hostname)) return null
    const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : (url.searchParams.get('v') ?? '')
    return YOUTUBE_ID_REGEX.test(id) ? id : null
  }
  ```

## 21. `package-lock.json` after rebase conflicts

- NEVER use `npm install --package-lock-only` to regenerate the lock after a rebase conflict. That flag only resolves optional dependencies for the current host (macOS arm64 in most dev environments), dropping `@rollup/rollup-linux-*`, `@esbuild/linux-*`, `@unrs/resolver-binding-linux-*`, and `@napi-rs/*` bindings. CI running `npm ci` on `linux-x64` will then fail with "Missing: <pkg> from lock file".
- Correct sequence after a lock conflict:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  git add package-lock.json
  ```
- The new lock will be larger (+3-5k lines typical) because it now lists all platform binaries.

## 22. Immutable data in RTK Query cache

- Never mutate objects that have entered RTK Query's cache (returned by `queryFn`, `transformResponse`, or fetched via `updateQueryData`). RTK Query expects immutable references — mutations cause silent corruption with structural sharing.
- Build enrichment results as a separate `Map`, then produce NEW objects via spread:

  ```ts
  // BAD — mutates in place
  cards.forEach(card => {
    card.creatorAddress = deployerMap.get(card.coordinates)
  })

  // GOOD — new object per card
  const enriched = cards.map(card => {
    const deployedBy = deployerMap.get(card.coordinates)
    return deployedBy && !card.creatorAddress ? { ...card, creatorAddress: deployedBy } : card
  })
  ```

## 23. Page tracking — never call `usePageTracking(pathname)` for routes whose `<title>` is set by Helmet

- `usePageTracking(pathname)` from `@dcl/hooks` fires `analytics.page(pathname)` synchronously on route change. Segment auto-fills `properties.title` from `document.title` at that exact moment. For SPA navigations into a `/blog/*` (or any route that resolves its title async via Helmet + RTK Query), the title race lands the _previous_ route's title in the event — Metabase charts that filter by title silently drop the visit.
- `Layout` skips its route-level `page()` call when `pathname === '/blog' || pathname.startsWith('/blog/')` for that reason. New blog routes MUST call `useBlogPageTracking({ name, properties })` from `src/hooks/useBlogPageTracking.ts`, gated on the resolved title:
  ```ts
  useBlogPageTracking({
    name: post?.title,
    properties: post ? { title: post.title, slug: post.slug, category: post.category.title } : undefined
  })
  ```
- The hook is initialized-aware (skips while `useAnalytics().isInitialized` is false, i.e. while `DeferredAnalyticsProvider` waits for idle) and only fires once per (name, properties) tuple.
- If you add a non-blog route that ALSO sets its title via Helmet + async data, follow the same pattern: extend `Layout`'s skip list and call `useBlogPageTracking` (or a sibling hook) from the page so the event fires after the title resolves.

## 24. React component props — destructure inside the body when there are more than 3 props

- Up to 3 props: parameter-list destructuring is fine and reads well.
- 4 or more props: take `props` as a single argument and destructure inside the body. Keeps the function signature scannable, makes diffs cleaner when adding/removing props, and avoids the multi-line parameter block that grows every time a prop is added.

  ```tsx
  // BAD — long inline destructuring in the parameter list
  function CommunityInfoComponent({
    community,
    isLoggedIn,
    address,
    isPerformingCommunityAction,
    isMember,
    canViewContent,
    hasPendingRequest = false,
    isLoadingMemberRequests = false,
    onJoin,
    onRequestToJoin,
    onCancelRequest
  }: CommunityInfoProps) {
    // ...
  }

  // GOOD — single-arg signature, destructure inside the body
  function CommunityInfoComponent(props: CommunityInfoProps) {
    const {
      community,
      isLoggedIn,
      address,
      isPerformingCommunityAction,
      isMember,
      canViewContent,
      hasPendingRequest = false,
      isLoadingMemberRequests = false,
      onJoin,
      onRequestToJoin,
      onCancelRequest
    } = props
    // ...
  }
  ```

- Same rule applies to hooks, helpers, and any function that takes a single options object: ≤3 keys → inline destructure; ≥4 → destructure in the body.
- Defaults (`hasPendingRequest = false`) move with their key into the body destructure — do not split defaults between the signature and the body.

## 25. No inline `sx` with hardcoded values — move styles to `*.styled.ts`

- Inline `sx={{ ... }}` is only allowed for a SINGLE dynamic value that genuinely depends on runtime state (e.g. `sx={{ display: isOpen ? 'block' : 'none' }}` when the styled component cannot accept the prop). Even then, prefer extending the styled component with a forwarded prop.
- Hardcoded dimensions, colors, spacing, or layout values inside `sx` are a bug — they bypass the design system, the theme, and the `*.styled.ts` co-location convention. They also make diffs noisy and grep-resistant.

  ```tsx
  // BAD — three hardcoded values inline
  <Button sx={{ maxWidth: '175px', minWidth: 'auto', height: '40px' }}>Join</Button>

  // BAD — hardcoded color in sx
  <Box sx={{ backgroundColor: '#1f1e22', padding: '12px 16px' }}>...</Box>

  // GOOD — co-located styled component using theme tokens
  // Component.styled.ts
  export const JoinButton = styled(Button)(({ theme }) => ({
    maxWidth: 175,
    minWidth: 'auto',
    height: 40,
    padding: theme.spacing(1.5, 2)
  }))

  // Component.tsx
  <JoinButton>Join</JoinButton>
  ```

- A styled component already exists for this surface? Extend it with a `shouldForwardProp`-protected prop instead of bolting on `sx`. Two callsites with two different `sx` blobs is the start of drift — fold both into a variant prop.
- The `<Box sx={{...}}>` shape is the most common offender because `Box` exists primarily to host `sx`. Prefer `styled(Box)(...)` with a meaningful name (`Container`, `Row`, `EmptyState`) so the component reads as intent, not as a div with inline CSS.
