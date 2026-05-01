/**
 * Vercel Serverless Function for /whats-on shell
 *
 * Renders the static `dist/index.html` shell with three augmentations that the
 * Vite SPA can't produce on its own:
 *
 *   1. A `<link rel="preload" as="image" fetchpriority="high">` pointing at the
 *      Live Now LCP image. The browser starts the ~1 MB fetch during HTML
 *      parse, before the main JS bundle is even downloaded.
 *   2. An inline `<script>` that seeds `window.__dclWhatsOnPrefetch` with the
 *      already-resolved events / hot-scenes payloads. RTK Query's `queryFn`
 *      adopts these promises and skips the duplicate roundtrip.
 *   3. `<link rel="modulepreload">` hints for the lazy DappsShell + WhatsOn
 *      chunks so they start downloading in parallel with the main bundle
 *      instead of after it parses.
 *
 * Vercel's edge cache (`s-maxage=30, stale-while-revalidate=300`) keeps the
 * function cold-start cost out of the critical path for the vast majority of
 * requests — the live data we embed is short-lived enough that 30 s of
 * staleness is acceptable for this surface.
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEFAULT_EVENTS_API_URL = 'https://events.decentraland.org/api'
const DEFAULT_HOT_SCENES_URL = 'https://realm-provider-ea.decentraland.org/hot-scenes'

const EVENTS_LIST_PATH = '/events?list=live&limit=20&order=asc&world=false'
const FETCH_TIMEOUT_MS = 1500

// Hosts allowed to appear inside the LCP preload tag. Both IPFS-style and
// poster bucket URLs are valid Live Now image sources today; anything else is
// dropped silently rather than surfaced as a preload that would later 404.
const ALLOWED_IMAGE_HOSTS = new Set([
  'peer.decentraland.org',
  'peer.decentraland.zone',
  'events-assets-099ac00.decentraland.org',
  'cdn.decentraland.org'
])

// Width passed to Vercel's image optimizer (`/_vercel/image`) for the LCP
// poster. Live Now cards render at 380×176 CSS pixels; 750 covers 2× DPR
// without overshooting. Must stay in sync with `LiveNowCard.tsx` so the
// preload URL matches the `<img src>` byte-for-byte.
const LCP_IMAGE_WIDTH = 750
const LCP_IMAGE_QUALITY = 75

// Subset of the Live Now data shape we touch in this function. Keep aligned
// with `src/features/whats-on-events/events.types.ts` and the events.helpers
// module, but intentionally minimal so this serverless function doesn't pull
// in the rest of the front-end source tree.
interface LiveEvent {
  id: string
  name: string
  image: string | null
  x: number
  y: number
}

interface EventsResponse {
  data?: LiveEvent[]
}

interface HotScene {
  id: string
  name: string
  thumbnail?: string
  usersTotalCount: number
  baseCoords: [number, number]
  parcels: Array<[number, number]>
}

const INDEX_HTML: string = (() => {
  try {
    return readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf-8')
  } catch {
    return ''
  }
})()

// Vite content-hashes every chunk filename. Discover the chunks we want to
// modulepreload at cold start by scanning `dist/assets/`. Stable substrings
// keep the lookup robust across Vite's hashing.
const SUPPORTED_LOCALES = ['es', 'fr', 'ja', 'ko', 'zh'] as const
type LocaleChunk = (typeof SUPPORTED_LOCALES)[number]

const ASSET_CHUNKS: {
  dappsShell?: string
  whatsOnLayout?: string
  whatsOnHomePage?: string
  topBackground?: string
  locales: Partial<Record<LocaleChunk, string>>
} = (() => {
  try {
    const files = readdirSync(join(process.cwd(), 'dist', 'assets'))
    const findJs = (prefix: string): string | undefined => files.find(file => file.startsWith(prefix) && file.endsWith('.js'))
    const findAsset = (prefix: string, ext: string): string | undefined => files.find(file => file.startsWith(prefix) && file.endsWith(ext))
    const locales: Partial<Record<LocaleChunk, string>> = {}
    for (const locale of SUPPORTED_LOCALES) {
      const chunk = findJs(`${locale}-`)
      if (chunk) locales[locale] = chunk
    }
    const result = {
      dappsShell: findJs('DappsShell-'),
      whatsOnLayout: findJs('WhatsOnLayout-'),
      whatsOnHomePage: findJs('HomePage-'),
      topBackground: findAsset('top_background-', '.webp'),
      locales
    }
    // Surface chunk-discovery misses at cold-start so a future Vite/rollup
    // rename doesn't silently drop the modulepreload hints we rely on.
    for (const [key, value] of [
      ['DappsShell', result.dappsShell],
      ['WhatsOnLayout', result.whatsOnLayout],
      ['HomePage', result.whatsOnHomePage],
      ['top_background', result.topBackground]
    ] as const) {
      if (!value) console.warn(`[WhatsOn SSR] could not find ${key} asset in dist/assets/`)
    }
    return result
  } catch {
    return { locales: {} }
  }
})()

// Inspect the visitor's `Accept-Language` header so we can modulepreload the
// locale chunk they will actually use. Falls through to undefined for `en`
// (already bundled into the entry chunk) and unknown locales.
function pickPreferredLocale(acceptLanguage: string | undefined): LocaleChunk | undefined {
  if (!acceptLanguage) return undefined
  const tags = acceptLanguage
    .split(',')
    .map(part => part.trim().split(';')[0].toLowerCase().split('-')[0])
    .filter(Boolean)
  for (const tag of tags) {
    if ((SUPPORTED_LOCALES as ReadonlyArray<string>).includes(tag)) return tag as LocaleChunk
  }
  return undefined
}

function fetchJson<T>(url: string): Promise<T | null> {
  return fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    .then(res => (res.ok ? (res.json() as Promise<T>) : null))
    .catch(() => null)
}

function resolveApiHosts(host: string | undefined): { eventsApi: string; hotScenes: string } {
  if (host && (host.endsWith('.zone') || host.endsWith('.today'))) {
    return { eventsApi: 'https://events.decentraland.zone/api', hotScenes: DEFAULT_HOT_SCENES_URL }
  }
  return { eventsApi: DEFAULT_EVENTS_API_URL, hotScenes: DEFAULT_HOT_SCENES_URL }
}

function resolveLcpImage(eventsData: EventsResponse | null, hotScenes: HotScene[] | null): string | null {
  if (!hotScenes || hotScenes.length === 0) return null
  const sorted = [...hotScenes].sort((a, b) => (b.usersTotalCount ?? 0) - (a.usersTotalCount ?? 0))
  const liveEvents = eventsData?.data ?? []
  for (const scene of sorted) {
    for (const [px, py] of scene.parcels) {
      const matched = liveEvents.find(e => e.x === px && e.y === py && e.image)
      if (matched?.image) return matched.image
    }
    if (scene.thumbnail) return scene.thumbnail
  }
  return null
}

function isSafeImageUrl(value: string): value is string {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    return ALLOWED_IMAGE_HOSTS.has(parsed.hostname)
  } catch {
    return false
  }
}

const escapeHtmlAttr = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')

// Embed JSON inside `<script>` requires escaping `</` so the parser can't be
// tricked into closing the tag early. `<!--` and `<script` get the same
// treatment for defense in depth.
const safeJsonForScript = (value: unknown): string =>
  JSON.stringify(value).replace(/<\/(script|!--)/gi, match => `\\u003c\\u002f${match.slice(2)}`)

interface InjectionOptions {
  lcpImageUrl: string | null
  eventsUrl: string
  scenesUrl: string
  eventsData: EventsResponse | null
  scenesData: HotScene[] | null
  assetBaseUrl: string
  preferredLocale: LocaleChunk | undefined
}

function buildInjectedHead(options: InjectionOptions): string {
  const lines: string[] = []

  // The desktop top_background is the single largest painted element on the
  // /whats-on hero, so Lighthouse picks it as LCP regardless of the Live Now
  // card. It's hidden on mobile via CSS, hence the media-gated preload — phone
  // visitors don't pay the ~250 KB cost.
  if (ASSET_CHUNKS.topBackground) {
    const href = `${options.assetBaseUrl}assets/${ASSET_CHUNKS.topBackground}`
    lines.push(`<link rel="preload" as="image" href="${escapeHtmlAttr(href)}" media="(min-width: 600px)" fetchpriority="high" />`)
  }

  if (options.lcpImageUrl && isSafeImageUrl(options.lcpImageUrl)) {
    // Match the URL that LiveNowCard will render (`/_vercel/image?...`) so the
    // preload, the `<img>` src, and the HTTP cache entry collide on the same
    // resource — anything else means a duplicate ~1 MB fetch.
    const optimizedHref = `/_vercel/image?url=${encodeURIComponent(options.lcpImageUrl)}&w=${LCP_IMAGE_WIDTH}&q=${LCP_IMAGE_QUALITY}`
    lines.push(`<link rel="preload" as="image" href="${escapeHtmlAttr(optimizedHref)}" fetchpriority="high" />`)
  }

  const moduleChunks = [ASSET_CHUNKS.dappsShell, ASSET_CHUNKS.whatsOnLayout, ASSET_CHUNKS.whatsOnHomePage]
  if (options.preferredLocale) {
    const localeChunk = ASSET_CHUNKS.locales[options.preferredLocale]
    if (localeChunk) moduleChunks.push(localeChunk)
  }
  for (const chunk of moduleChunks) {
    if (!chunk) continue
    lines.push(`<link rel="modulepreload" href="${escapeHtmlAttr(`${options.assetBaseUrl}assets/${chunk}`)}" crossorigin />`)
  }

  // Embedding the resolved data directly side-steps the inline fetch fallback in
  // index.html — RTK Query's queryFn awaits these promises without dispatching
  // a fresh request, which is what makes the LCP image the only meaningful
  // network on the path.
  const payload = {
    eventsUrl: options.eventsUrl,
    scenesUrl: options.scenesUrl,
    events: options.eventsData,
    scenes: options.scenesData
  }
  lines.push(
    `<script>window.__dclWhatsOnPrefetchInline=${safeJsonForScript(payload)};` +
      '(function(p){if(!p)return;var resolved={eventsUrl:p.eventsUrl,scenesUrl:p.scenesUrl,' +
      'events:Promise.resolve(p.events),scenes:Promise.resolve(p.scenes)};' +
      'window.__dclWhatsOnPrefetch=resolved;})(window.__dclWhatsOnPrefetchInline);' +
      'delete window.__dclWhatsOnPrefetchInline;</script>'
  )

  return lines.join('\n  ')
}

function inject(html: string, options: InjectionOptions): string {
  const head = buildInjectedHead(options)
  if (!head) return html
  // Replace the existing client-side prefetch script in index.html — the server
  // already did the work, so the inline `fetch()` chain is redundant and would
  // race with the prefetch we just injected. Match the script via a stable
  // `data-whats-on-prefetch` attribute instead of a comment to avoid breakage
  // if Vite or rollup ever strips inline-script comments.
  const withoutInlineScript = html.replace(/<script[^>]*data-whats-on-prefetch[^>]*>[\s\S]*?<\/script>\s*/, '')
  return withoutInlineScript.replace('</head>', `${head}\n</head>`)
}

function resolveAssetBaseUrl(html: string): string {
  // Vite emits `<script type="module" src="<base>/assets/index-XXX.js">` so we
  // can derive the deployed CDN base from the existing markup. Falls back to
  // root-relative which works for local `vercel dev` against a preview build.
  const match = html.match(/<script[^>]+src="([^"]+)\/assets\/index-[^"]+\.js"/)
  if (match) return `${match[1]}/`
  return '/'
}

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (!INDEX_HTML) {
    // Same fallback shape as api/seo.ts — never redirect, vercel.json would
    // loop us right back to this function.
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res
      .status(200)
      .send('<!doctype html><html><head><meta charset="utf-8"></head><body><script>location.replace("/")</script></body></html>')
    return
  }

  const forwardedHost = Array.isArray(req.headers['x-forwarded-host'])
    ? req.headers['x-forwarded-host'][0]
    : req.headers['x-forwarded-host']
  const host = forwardedHost || req.headers.host || ''
  const apiHosts = resolveApiHosts(host)
  const eventsUrl = `${apiHosts.eventsApi}${EVENTS_LIST_PATH}`
  const scenesUrl = apiHosts.hotScenes

  const acceptLanguage = Array.isArray(req.headers['accept-language']) ? req.headers['accept-language'][0] : req.headers['accept-language']
  const preferredLocale = pickPreferredLocale(acceptLanguage)

  try {
    const [eventsData, scenesData] = await Promise.all([fetchJson<EventsResponse>(eventsUrl), fetchJson<HotScene[]>(scenesUrl)])

    const lcpImageUrl = resolveLcpImage(eventsData, scenesData)
    const assetBaseUrl = resolveAssetBaseUrl(INDEX_HTML)
    const html = inject(INDEX_HTML, {
      lcpImageUrl,
      eventsUrl,
      scenesUrl,
      eventsData,
      scenesData,
      assetBaseUrl,
      preferredLocale
    })

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300')
    res.setHeader('Vary', 'Accept-Encoding, Accept-Language')
    res.setHeader('X-WhatsOn-SSR', lcpImageUrl ? 'hit' : 'miss')
    res.status(200).send(html)
  } catch (error) {
    console.error('[WhatsOn SSR] failed', error)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=60')
    res.status(200).send(INDEX_HTML)
  }
}

// eslint-disable-next-line import/no-default-export
export default handler
