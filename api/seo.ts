/**
 * Vercel Serverless Function for SEO
 *
 * This function serves pre-rendered HTML with correct meta tags for crawlers.
 *
 * Testing:
 * - GET /api/seo?path=/blog/category/post-slug&seo=true
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// =============================================================================
// Constants
// =============================================================================

// Production deployments should set CMS_BASE_URL env var; the fallback targets the staging CMS.
const CMS_BASE_URL = process.env['CMS_BASE_URL'] ?? 'https://cms-api.decentraland.org/spaces/ea2ybdmmn1kv/environments/master'

// camera-reel-service hosts metadata for /reels/:imageId. Falls back to prod for local dev.
const REEL_SERVICE_URL = process.env['REEL_SERVICE_URL'] ?? 'https://camera-reel-service.decentraland.org'

// events-api hosts metadata for /whats-on?id=<eventId>. Falls back to prod for local dev.
const EVENTS_API_URL = process.env['EVENTS_API_URL'] ?? 'https://events.decentraland.org/api'

// places-api hosts metadata for /whats-on?position=x,y and /jump/places. Falls back to prod for local dev.
const PLACES_API_URL = process.env['PLACES_API_URL'] ?? 'https://places.decentraland.org/api'

// Brand share-card lives next to the static shell so it ships from the same origin/CDN as the site.
const SHARE_IMAGE_URL = 'https://decentraland.org/decentraland-background.webp'

const DEFAULTS = {
  title: 'Decentraland Blog | Updates, Stories, and Community Moments',
  description: 'Updates from across Decentraland. Announcements, events, community moments, and everything in between.',
  image: SHARE_IMAGE_URL,
  siteName: 'Decentraland',
  twitterHandle: '@decentraland'
} as const

const WHATS_ON_DEFAULTS = {
  title: "What's On in Decentraland",
  description: 'Live events, hangouts, and places happening right now in Decentraland.',
  image: SHARE_IMAGE_URL
} as const

// Allowlist of canonical origins used to build the returned absolute URLs (canonical, og:url).
// Host headers are attacker-controlled; relying on them enables open redirects and SSRF.
const ALLOWED_ORIGINS = new Set<string>(['https://decentraland.org', 'https://decentraland.zone', 'https://decentraland.today'])
const DEFAULT_ORIGIN = 'https://decentraland.org'

// Read the static HTML shell from disk once at cold start instead of looping back over HTTP.
// Falls back to an empty string if the build output is not available (e.g. local `vercel dev`
// before `vite build`); in that case the function will return a redirect.
const INDEX_HTML: string = (() => {
  try {
    return readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf-8')
  } catch {
    return ''
  }
})()

// =============================================================================
// Escaping helpers
// =============================================================================

// Some CMS entries were authored with pre-encoded HTML entities (e.g. "Q&amp;A"
// stored literally). Decoding BEFORE escapeHTML prevents double-encoding
// (`Q&amp;amp;A`) in meta tags. `&amp;` is decoded last so that double-encoded
// markup (`&amp;lt;`) resolves to `&lt;` rather than `<`, preserving safety.
// Numeric/hex references (&#60;, &#x3C;) are intentionally NOT decoded.
// SYNC: identical logic in src/shared/blog/utils/string.ts:decodeHtmlEntities — keep in sync.
const decodeHTMLEntities = (value: string): string =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')

const escapeHTML = (value: string): string =>
  decodeHTMLEntities(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')

// Only allow http(s) URLs; anything else (javascript:, data:, etc.) is dropped.
const safeUrl = (value: string, fallback: string): string => {
  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
  } catch {
    // fallthrough
  }
  return fallback
}

// =============================================================================
// Types
// =============================================================================

interface SEOData {
  title: string
  description: string
  imageUrl: string
  author?: string
  publishedDate?: string
  category?: string
}

interface RouteInfo {
  type: 'blog' | 'post' | 'category' | 'author' | 'search' | 'reels' | 'whats-on' | 'unknown'
  categorySlug?: string
  postSlug?: string
  authorSlug?: string
  imageId?: string
}

interface CMSLink {
  sys: { type: string; linkType: string; id: string }
}

interface CMSEntry {
  sys: { id: string; type: string }
  fields?: Record<string, unknown>
}

interface CMSListResponse {
  items: CMSEntry[]
  total: number
}

// =============================================================================
// CMS Helpers
// =============================================================================

const fetchJSON = async <T>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    return response.ok ? ((await response.json()) as T) : null
  } catch {
    return null
  }
}

const resolveAssetUrl = async (assetLink: CMSLink): Promise<string | null> => {
  const data = await fetchJSON<{ fields?: { file?: { url?: string } } }>(`${CMS_BASE_URL}/assets/${assetLink.sys.id}`)
  const url = data?.fields?.file?.url
  return url ? (url.startsWith('//') ? `https:${url}` : url) : null
}

const resolveEntryField = async (entryLink: CMSLink, field: string): Promise<string | undefined> => {
  const entry = await fetchJSON<CMSEntry>(`${CMS_BASE_URL}/entries/${entryLink.sys.id}`)
  return entry?.fields?.[field] as string | undefined
}

const resolveImage = async (fields: Record<string, unknown>): Promise<string> => {
  if (fields.image && typeof fields.image === 'object') {
    const resolved = await resolveAssetUrl(fields.image as CMSLink)
    if (resolved) return resolved
  }
  return DEFAULTS.image
}

// =============================================================================
// Data Fetchers
// =============================================================================

const findEntryBySlug = async (endpoint: string, slug: string): Promise<CMSEntry | null> => {
  const data = await fetchJSON<CMSListResponse>(`${CMS_BASE_URL}${endpoint}?fields.slug=${encodeURIComponent(slug)}&limit=1`)
  return data?.items[0] ?? null
}

const fetchBlogPost = async (postSlug: string): Promise<SEOData | null> => {
  // Filter server-side by slug instead of downloading up to 200 entries and `.find()`ing locally.
  const data = await fetchJSON<CMSListResponse>(`${CMS_BASE_URL}/blog/posts?fields.slug=${encodeURIComponent(postSlug)}&limit=1`)
  const entry = data?.items[0]
  if (!entry?.fields) return null

  const fields = entry.fields
  const [imageUrl, author, category] = await Promise.all([
    resolveImage(fields),
    fields.author ? resolveEntryField(fields.author as CMSLink, 'title') : undefined,
    fields.category ? resolveEntryField(fields.category as CMSLink, 'title') : undefined
  ])

  return {
    title: (fields.title as string) || DEFAULTS.title,
    description: (fields.description as string) || DEFAULTS.description,
    imageUrl,
    author,
    category,
    publishedDate: fields.publishedDate as string
  }
}

const fetchCategory = async (categorySlug: string): Promise<SEOData | null> => {
  const entry = await findEntryBySlug('/blog/categories', categorySlug)
  if (!entry?.fields) return null

  const fields = entry.fields
  return {
    title: (fields.title as string) || DEFAULTS.title,
    description: (fields.description as string) || DEFAULTS.description,
    imageUrl: await resolveImage(fields)
  }
}

const fetchAuthor = async (authorSlug: string): Promise<SEOData | null> => {
  const entry = await findEntryBySlug('/blog/authors', authorSlug)
  if (!entry?.fields) return null

  const fields = entry.fields
  const title = fields.title as string
  return {
    title: title ? `Posts by ${title}` : DEFAULTS.title,
    description: (fields.description as string) || DEFAULTS.description,
    imageUrl: await resolveImage(fields)
  }
}

const fetchDefaultSEO = async (): Promise<SEOData | null> => {
  const data = await fetchJSON<CMSListResponse>(`${CMS_BASE_URL}/blog/posts?limit=1`)
  if (!data?.items[0]?.fields) return null

  const fields = data.items[0].fields
  return {
    title: DEFAULTS.title,
    description: (fields.description as string) || DEFAULTS.description,
    imageUrl: await resolveImage(fields)
  }
}

// Event IDs are UUIDs from events.decentraland.org. Constrain to that
// charset before interpolating into the upstream URL to prevent SSRF / path traversal.
const EVENT_ID_REGEX = /^[a-fA-F0-9-]{8,64}$/

// Position is "x,y" with optional negative signs (e.g. "0,0", "-12,150").
const POSITION_REGEX = /^(-?\d{1,4}),(-?\d{1,4})$/

interface EventApiEntry {
  name?: string
  description?: string | null
  image?: string | null
  // eslint-disable-next-line @typescript-eslint/naming-convention
  scene_name?: string | null
}

interface EventApiResponse {
  ok: boolean
  data?: EventApiEntry
}

const fetchEventSEO = async (eventId: string): Promise<SEOData | null> => {
  if (!EVENT_ID_REGEX.test(eventId)) return null
  const data = await fetchJSON<EventApiResponse>(`${EVENTS_API_URL}/events/${encodeURIComponent(eventId)}`)
  if (!data?.ok || !data.data) return null
  const { name, description, image } = data.data
  const sceneName = data.data.scene_name
  const title = name?.trim() || WHATS_ON_DEFAULTS.title
  const sceneSuffix = sceneName?.trim() ? ` at ${sceneName.trim()}` : ''
  // Validate image URL here so the per-route fallback (whats-on, not blog) is preserved.
  // generateHTML's safeUrl uses DEFAULTS.image as last resort, which is the blog landscape.
  const imageUrl = image && /^https?:\/\//.test(image) ? image : WHATS_ON_DEFAULTS.image
  return {
    title: `${title}${sceneSuffix}`,
    description: description?.trim() || WHATS_ON_DEFAULTS.description,
    imageUrl
  }
}

interface PlaceApiEntry {
  title?: string | null
  description?: string | null
  image?: string | null
}

interface PlaceApiResponse {
  ok: boolean
  data?: PlaceApiEntry[]
}

const fetchPlaceSEO = async (position: string): Promise<SEOData | null> => {
  if (!POSITION_REGEX.test(position)) return null
  const data = await fetchJSON<PlaceApiResponse>(`${PLACES_API_URL}/places?positions=${encodeURIComponent(position)}`)
  const entry = data?.ok ? data.data?.[0] : null
  if (!entry) return null
  const title = entry.title?.trim() || `Explore (${position}) in Decentraland`
  const description = entry.description?.trim() || `Discover what's happening at coordinates ${position} in Decentraland.`
  const imageUrl = entry.image && /^https?:\/\//.test(entry.image) ? entry.image : WHATS_ON_DEFAULTS.image
  return { title, description, imageUrl }
}

const fetchWhatsOnSEO = async (eventId: string | null, position: string | null): Promise<SEOData> => {
  if (eventId) {
    const event = await fetchEventSEO(eventId)
    if (event) return event
  }
  if (position) {
    const place = await fetchPlaceSEO(position)
    if (place) return place
    if (POSITION_REGEX.test(position)) {
      return {
        title: `Explore (${position}) in Decentraland`,
        description: `Discover what's happening at coordinates ${position} in Decentraland.`,
        imageUrl: WHATS_ON_DEFAULTS.image
      }
    }
  }
  return {
    title: WHATS_ON_DEFAULTS.title,
    description: WHATS_ON_DEFAULTS.description,
    imageUrl: WHATS_ON_DEFAULTS.image
  }
}

interface ReelMetadataResponse {
  url: string
  thumbnailUrl: string
  metadata: {
    visiblePeople: Array<{ userName: string }>
    scene: { name: string }
  }
}

// Image IDs from camera-reel-service are short alphanumeric tokens. Constrain to that
// charset before interpolating into the upstream URL to avoid SSRF / path traversal.
const REEL_IMAGE_ID_REGEX = /^[A-Za-z0-9_-]{1,64}$/

const fetchReelImageSEO = async (imageId: string): Promise<SEOData | null> => {
  if (!REEL_IMAGE_ID_REGEX.test(imageId)) return null
  const data = await fetchJSON<ReelMetadataResponse>(`${REEL_SERVICE_URL}/api/images/${imageId}/metadata`)
  if (!data) return null
  const userName = data.metadata.visiblePeople[0]?.userName ?? 'Someone'
  const sceneName = data.metadata.scene.name || 'Decentraland'
  return {
    title: `${userName} took this photo in ${sceneName}`,
    description: `A photo taken in Decentraland by ${userName} at ${sceneName}.`,
    imageUrl: data.url
  }
}

// =============================================================================
// Route Parsing
// =============================================================================

const ROUTE_PATTERNS: Array<{ pattern: RegExp; handler: (match: RegExpMatchArray) => RouteInfo }> = [
  { pattern: /^\/blog\/author\/([^/]+)$/, handler: m => ({ type: 'author', authorSlug: m[1] }) },
  { pattern: /^\/blog\/search$/, handler: () => ({ type: 'search' }) },
  { pattern: /^\/blog\/([^/]+)\/([^/]+)$/, handler: m => ({ type: 'post', categorySlug: m[1], postSlug: m[2] }) },
  { pattern: /^\/blog\/([^/]+)$/, handler: m => ({ type: 'category', categorySlug: m[1] }) },
  { pattern: /^\/blog\/?$/, handler: () => ({ type: 'blog' }) },
  { pattern: /^\/reels\/([^/]+)$/, handler: m => ({ type: 'reels', imageId: m[1] }) },
  // /whats-on, /jump/events and /jump/places all deep-link via query params (?id=, ?position=)
  // rather than path segments. A single 'whats-on' route type handles all three by dispatching
  // on the query params; the path patterns just gate which paths reach the handler.
  { pattern: /^\/whats-on(\/.*)?$/, handler: () => ({ type: 'whats-on' }) },
  { pattern: /^\/jump\/events(\/.*)?$/, handler: () => ({ type: 'whats-on' }) },
  { pattern: /^\/jump\/places(\/.*)?$/, handler: () => ({ type: 'whats-on' }) }
]

const parseRoute = (pathname: string): RouteInfo => {
  const path = pathname.replace(/\/$/, '') || '/blog'
  for (const { pattern, handler } of ROUTE_PATTERNS) {
    const match = path.match(pattern)
    if (match) return handler(match)
  }
  return { type: 'unknown' }
}

const ALLOWED_ROOT_PATHS = ['/blog', '/reels', '/whats-on', '/jump'] as const

// =============================================================================
// SEO Data Resolution
// =============================================================================

interface SEOQueryParams {
  searchQuery: string | null
  eventId: string | null
  position: string | null
}

const fetchSEOData = async (pathname: string, params: SEOQueryParams): Promise<SEOData | null> => {
  const route = parseRoute(pathname)

  switch (route.type) {
    case 'post':
      return fetchBlogPost(route.postSlug!)
    case 'category':
      return fetchCategory(route.categorySlug!)
    case 'author':
      return fetchAuthor(route.authorSlug!)
    case 'search':
      return {
        title: params.searchQuery ? `Search: ${params.searchQuery}` : 'Search',
        description: params.searchQuery
          ? `Search results for "${params.searchQuery}" in Decentraland Blog`
          : 'Search the Decentraland Blog',
        imageUrl: DEFAULTS.image
      }
    case 'reels':
      return fetchReelImageSEO(route.imageId!)
    case 'whats-on':
      return fetchWhatsOnSEO(params.eventId, params.position)
    default:
      return fetchDefaultSEO()
  }
}

// =============================================================================
// HTML Generation
// =============================================================================

const replaceMetaTag = (html: string, pattern: RegExp, replacement: string): string => html.replace(pattern, replacement)

const generateHTML = (data: SEOData | null, originalHTML: string, url: string): string => {
  // Escape every interpolated value to prevent reflected/stored XSS via CMS fields or query strings.
  const rawTitle = data?.title ? `${data.title} | ${DEFAULTS.siteName}` : DEFAULTS.title
  const rawDescription = data?.description || DEFAULTS.description
  const rawImageUrl = safeUrl(data?.imageUrl || DEFAULTS.image, DEFAULTS.image)

  const title = escapeHTML(rawTitle)
  const description = escapeHTML(rawDescription)
  const imageUrl = escapeHTML(rawImageUrl)
  const safeCanonicalUrl = escapeHTML(url)
  const ogType = data?.author ? 'article' : 'website'
  // Large card whenever a route resolved data (we always carry an image — CMS, events, places, or
  // the brand fallback). Drop to summary for the unknown-route case so the brand icon doesn't crop.
  const twitterCard = data ? 'summary_large_image' : 'summary'
  const siteName = escapeHTML(DEFAULTS.siteName)
  const twitterHandle = escapeHTML(DEFAULTS.twitterHandle)

  let html = originalHTML

  // Basic meta tags
  html = replaceMetaTag(html, /<title>.*?<\/title>/i, `<title>${title}</title>`)
  html = replaceMetaTag(html, /<meta name="description" content="[^"]*"[^>]*>/i, `<meta name="description" content="${description}">`)
  html = replaceMetaTag(html, /<link rel="canonical" href="[^"]*"[^>]*>/i, `<link rel="canonical" href="${safeCanonicalUrl}">`)

  // Open Graph
  html = replaceMetaTag(html, /<meta property="og:title" content="[^"]*"[^>]*>/i, `<meta property="og:title" content="${title}">`)
  html = replaceMetaTag(
    html,
    /<meta property="og:description" content="[^"]*"[^>]*>/i,
    `<meta property="og:description" content="${description}">`
  )
  html = replaceMetaTag(html, /<meta property="og:image" content="[^"]*"[^>]*>/i, `<meta property="og:image" content="${imageUrl}">`)
  html = replaceMetaTag(html, /<meta property="og:url" content="[^"]*"[^>]*>/i, `<meta property="og:url" content="${safeCanonicalUrl}">`)
  html = replaceMetaTag(html, /<meta property="og:type" content="[^"]*"[^>]*>/i, `<meta property="og:type" content="${ogType}">`)
  html = replaceMetaTag(
    html,
    /<meta property="og:site_name" content="[^"]*"[^>]*>/i,
    `<meta property="og:site_name" content="${siteName}">`
  )

  // Twitter Card
  html = replaceMetaTag(html, /<meta name="twitter:title" content="[^"]*"[^>]*>/i, `<meta name="twitter:title" content="${title}">`)
  html = replaceMetaTag(
    html,
    /<meta name="twitter:description" content="[^"]*"[^>]*>/i,
    `<meta name="twitter:description" content="${description}">`
  )
  html = replaceMetaTag(html, /<meta name="twitter:image" content="[^"]*"[^>]*>/i, `<meta name="twitter:image" content="${imageUrl}">`)
  html = replaceMetaTag(html, /<meta name="twitter:card" content="[^"]*"[^>]*>/i, `<meta name="twitter:card" content="${twitterCard}">`)
  html = replaceMetaTag(html, /<meta name="twitter:site" content="[^"]*"[^>]*>/i, `<meta name="twitter:site" content="${twitterHandle}">`)
  html = replaceMetaTag(
    html,
    /<meta name="twitter:creator" content="[^"]*"[^>]*>/i,
    `<meta name="twitter:creator" content="${twitterHandle}">`
  )

  // Article meta (for posts)
  if (data?.author && data?.publishedDate) {
    const author = escapeHTML(data.author)
    const publishedDate = escapeHTML(data.publishedDate)
    const category = data.category ? escapeHTML(data.category) : ''
    const articleMeta = `
    <meta property="article:author" content="${author}">
    <meta property="article:published_time" content="${publishedDate}">
    ${category ? `<meta property="article:section" content="${category}">` : ''}
  </head>`
    html = html.replace('</head>', articleMeta)
  }

  // Preload hint for the hero image so the browser discovers it during HTML parse.
  // We intentionally do NOT inject an <img> into #root: `createRoot().render()` wipes
  // children, which would cause a flash + potential CLS regression.
  if (rawImageUrl) {
    html = html.replace('</head>', `<link rel="preload" as="image" href="${imageUrl}" fetchpriority="high" />\n</head>`)
  }

  return html
}

// =============================================================================
// Request Handler
// =============================================================================

// Only accept paths under one of the allowed roots (currently /blog or /reels) and reject
// any traversal or protocol separators. Prevents `?path=//evil.com` style open redirects.
const sanitizePath = (raw: unknown): string => {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return '/blog'
  try {
    const parsed = new URL(value, 'https://localhost')
    const pathname = parsed.pathname
    const isAllowed = ALLOWED_ROOT_PATHS.some(root => pathname === root || pathname.startsWith(`${root}/`))
    if (!isAllowed) return '/blog'
    if (pathname.includes('..') || pathname.includes('//') || pathname.includes('\\')) return '/blog'
    return pathname
  } catch {
    return '/blog'
  }
}

const firstQueryValue = (raw: unknown): string | null => {
  if (Array.isArray(raw)) return typeof raw[0] === 'string' ? raw[0] : null
  return typeof raw === 'string' ? raw : null
}

const resolveOrigin = (req: VercelRequest): string => {
  const forwardedHost = req.headers['x-forwarded-host']
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host
  if (typeof host !== 'string' || !host) return DEFAULT_ORIGIN
  const candidate = `https://${host}`
  return ALLOWED_ORIGINS.has(candidate) ? candidate : DEFAULT_ORIGIN
}

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const requestPath = sanitizePath(req.query.path)
  const searchQuery = firstQueryValue(req.query.q)
  const eventId = firstQueryValue(req.query.id)
  const position = firstQueryValue(req.query.position)

  const origin = resolveOrigin(req)
  // Preserve id / position in the canonical URL so social cards and search
  // engines link back to the deep-linked event/parcel rather than the
  // generic listing page. Applies to /whats-on and /jump/{events,places}.
  const canonicalQuery = new URLSearchParams()
  const preservesQuery = requestPath.startsWith('/whats-on') || requestPath.startsWith('/jump/')
  if (preservesQuery) {
    if (eventId && EVENT_ID_REGEX.test(eventId)) canonicalQuery.set('id', eventId)
    else if (position && POSITION_REGEX.test(position)) canonicalQuery.set('position', position)
  }
  const queryString = canonicalQuery.toString()
  const actualUrl = `${origin}${requestPath}${queryString ? `?${queryString}` : ''}`

  // Security headers applied regardless of the response path.
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (!INDEX_HTML) {
    // Build output unavailable. Cannot redirect to actualUrl because vercel.json rewrites
    // /blog/* back to this function, which would create an infinite redirect loop.
    // Serve a minimal page that client-side redirects to home instead.
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res
      .status(200)
      .send('<!doctype html><html><head><meta charset="utf-8"></head><body><script>location.replace("/")</script></body></html>')
    return
  }

  try {
    const seoData = await fetchSEOData(requestPath, { searchQuery, eventId, position })

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    // Shorter stale window: timely blog announcements should not be served up to 24h stale.
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=14400')
    res.setHeader('Vary', 'Accept-Encoding')
    res.setHeader('X-SEO-Function', 'active')
    res.status(200).send(generateHTML(seoData, INDEX_HTML, actualUrl))
  } catch (error) {
    // CMS unreachable — serve INDEX_HTML with default meta tags rather than redirecting
    // to actualUrl (which would loop back to this function via vercel.json rewrite).
    console.error('[SEO Function] Error:', error)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=60')
    res.status(200).send(generateHTML(null, INDEX_HTML, actualUrl))
  }
}

// eslint-disable-next-line import/no-default-export
export default handler
