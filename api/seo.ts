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

// events-api hosts metadata for /events?id=<eventId>. Falls back to prod for local dev.
const EVENTS_API_URL = process.env['EVENTS_API_URL'] ?? 'https://events.decentraland.org/api'

// places-api hosts metadata for /events?position=x,y and /jump/places. Falls back to prod for local dev.
const PLACES_API_URL = process.env['PLACES_API_URL'] ?? 'https://places.decentraland.org/api'

// Brand share-card hosted on the marketing CDN so it stays editable without a sites redeploy.
const SHARE_IMAGE_URL = 'https://marketing-files.decentraland.org/uploads/1778186218133_decentraland-background.webp'

const DEFAULTS = {
  title: 'Decentraland Blog | Updates, Stories, and Community Moments',
  description: 'Updates from across Decentraland. Announcements, events, community moments, and everything in between.',
  image: SHARE_IMAGE_URL,
  siteName: 'Decentraland',
  twitterHandle: '@decentraland'
} as const

const EVENTS_DEFAULTS = {
  title: 'Events in Decentraland',
  description: 'Live events and places happening right now in Decentraland.',
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

// Escape ONLY what's required inside element text content (RCDATA for <title>):
// `<` and `&`. Apostrophes and quotes need no escaping here because we're not inside
// an attribute value. This still matters for every title that carries an apostrophe —
// reel and blog post titles come straight from user and CMS content.
// The incident that produced it: using the full `escapeHTML` for <title> turned "What's On" into
// `<title>What&#x27;s On…</title>` which then got double-encoded somewhere in our
// edge pipeline (the live response carried `<title>What&amp;#39;s On…</title>` —
// browsers parse <title> in RCDATA mode where character refs are decoded once, so
// the user saw the literal text `What&#39;s On…` in the browser tab). Producing a
// literal apostrophe here removes the entity entirely and makes the title robust
// against any downstream re-encoding.
const escapeHTMLTextContent = (value: string): string => decodeHTMLEntities(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')

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
  bodyHtml?: string
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

// World names are ENS / DCL Names (e.g. "common.dcl.eth", "myworld.eth"). Lowercase
// alphanumerics, hyphens and dots, ending in ".eth". Bound length to keep upstream
// URLs sane and reject ambient junk before encodeURIComponent.
const WORLD_NAME_REGEX = /^[a-z0-9-]+(?:\.[a-z0-9-]+){1,4}\.eth$/i

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
  const title = name?.trim() || EVENTS_DEFAULTS.title
  const sceneSuffix = sceneName?.trim() ? ` at ${sceneName.trim()}` : ''
  // Validate image URL here so the per-route fallback (whats-on, not blog) is preserved.
  // generateHTML's safeUrl uses DEFAULTS.image as last resort, which is the blog landscape.
  const imageUrl = image && /^https?:\/\//.test(image) ? image : EVENTS_DEFAULTS.image
  return {
    title: `${title}${sceneSuffix}`,
    description: description?.trim() || EVENTS_DEFAULTS.description,
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
  const imageUrl = entry.image && /^https?:\/\//.test(entry.image) ? entry.image : EVENTS_DEFAULTS.image
  return { title, description, imageUrl }
}

const fetchWorldSEO = async (worldName: string): Promise<SEOData | null> => {
  if (!WORLD_NAME_REGEX.test(worldName)) return null
  const data = await fetchJSON<PlaceApiResponse>(`${PLACES_API_URL}/worlds?names=${encodeURIComponent(worldName)}&offset=0&limit=1`)
  const entry = data?.ok ? data.data?.[0] : null
  if (!entry) return null
  const title = entry.title?.trim() || `Visit ${worldName} in Decentraland`
  const description = entry.description?.trim() || `Discover ${worldName} — a Decentraland world.`
  const imageUrl = entry.image && /^https?:\/\//.test(entry.image) ? entry.image : EVENTS_DEFAULTS.image
  return { title, description, imageUrl }
}

const fetchWhatsOnSEO = async (eventId: string | null, position: string | null, worldName: string | null): Promise<SEOData> => {
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
        imageUrl: EVENTS_DEFAULTS.image
      }
    }
  }
  if (worldName) {
    const world = await fetchWorldSEO(worldName)
    if (world) return world
    if (WORLD_NAME_REGEX.test(worldName)) {
      return {
        title: `Visit ${worldName} in Decentraland`,
        description: `Discover ${worldName} — a Decentraland world.`,
        imageUrl: EVENTS_DEFAULTS.image
      }
    }
  }
  return {
    title: EVENTS_DEFAULTS.title,
    description: EVENTS_DEFAULTS.description,
    imageUrl: EVENTS_DEFAULTS.image
  }
}

interface ReelMetadataResponse {
  url: string
  thumbnailUrl?: string
  metadata?: {
    userName?: string
    userAddress?: string
    scene?: { name?: string }
  }
}

// Image IDs from camera-reel-service are short alphanumeric tokens. Constrain to that
// charset before interpolating into the upstream URL to avoid SSRF / path traversal.
const REEL_IMAGE_ID_REGEX = /^[A-Za-z0-9_-]{1,64}$/

const REELS_DEFAULT_TITLE = 'Photos from Decentraland'

const fetchReelImageSEO = async (imageId: string): Promise<SEOData | null> => {
  if (!REEL_IMAGE_ID_REGEX.test(imageId)) return null
  const data = await fetchJSON<ReelMetadataResponse>(`${REEL_SERVICE_URL}/api/images/${encodeURIComponent(imageId)}/metadata`)
  if (!data?.url) return null
  // Photographer is metadata.userName; visiblePeople is who appears IN the photo and may be empty.
  const userName = data.metadata?.userName?.trim()
  const sceneName = data.metadata?.scene?.name?.trim() || 'Decentraland'
  return {
    title: userName ? `${userName}'s Decentraland snapshot` : REELS_DEFAULT_TITLE,
    description: userName
      ? `Check out ${userName}'s photo taken in ${sceneName}, Decentraland. Comment on who was there and what they were wearing, or jump to the spot directly so you don't miss out!`
      : `A photo taken in ${sceneName}, Decentraland.`,
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
  // Skip /reels/list — it's a list page, not an image deep-link. The CF Worker has
  // the same exclusion in OpenGraphReelsRoute.test().
  { pattern: /^\/reels\/(?!list(?:\/|$))([^/]+)$/, handler: m => ({ type: 'reels', imageId: m[1] }) },
  // /events, /jump/events and /jump/places all deep-link via query params (?id=, ?position=)
  // rather than path segments. A single 'whats-on' route type handles all three by dispatching
  // on the query params; the path patterns just gate which paths reach the handler.
  { pattern: /^\/events(\/.*)?$/, handler: () => ({ type: 'whats-on' }) },
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

const ALLOWED_ROOT_PATHS = ['/blog', '/reels', '/events', '/jump', '/content', '/terms', '/privacy'] as const

// =============================================================================
// Legal page static content
// Pre-rendered body HTML so non-JS clients (AI agents, crawlers) can read the
// policy text. React replaces #root when JS loads; browser users see the full
// styled SPA. Keep in sync with the corresponding src/pages/* components.
// Production equivalent: sites-deployer worker's OpenGraphStaticPageRoute.
// =============================================================================

const CONTENT_POLICY_BODY_HTML = `<article>
<h1>Content Policy</h1>
<section id="definitions">
<h2>1. Definitions</h2>
<p>&quot;Content&quot; shall mean any work of authorship, creative works, graphics, images, textures, photos, logos, video, audio, text and interactive features, including without limitation NFTs, submitted by the Users of Decentraland.</p>
<p>&quot;Intellectual Property Rights&quot; shall mean rights in, arising out of, or associated with intellectual property in any jurisdiction, including without limitation rights in or arising out of, or associated with (1) copyrights, mask work rights, and other rights in published and unpublished works of authorship, including without limitation computer programs, databases, graphics, user interfaces, and similar works; (2) patents, design rights, and other rights in inventions and discoveries, including without limitation articles of manufacture, business methods, compositions of matter, improvements, machines, methods, and processes; (3) trademarks, service marks, trade dress and other logos and similar indications of origin of, or association with, a group, business, good, product, or service; (4) trade secrets and other information that is not generally known or readily ascertainable by third parties through proper means, whether tangible or intangible, including without limitation algorithms, customer lists, ideas, designs, formulas, know-how, source code, methods, processes, programs, prototypes, systems, and techniques; (5) a person&apos;s name, voice, signature, photograph, or likeness, including without limitation rights of personality, privacy, and publicity; (6) attribution and integrity and other so-called moral rights of an author; (7) internet domain names; (8) data and databases; and (9) similar proprietary rights arising under the laws of any jurisdiction.</p>
<p>&quot;NFT&quot; means non-fungible token, including, LAND, Wearables and any other kind of NFTs available in Decentraland. All NFTs must comply with this Content Policy in accordance with section 12.4 of the Terms of Use.</p>
</section>
<section id="prohibited-content">
<h2>2. Prohibited Content</h2>
<p>All Content uploaded, posted, created, displayed, transmitted or made available by the User through the Services must not include:</p>
<p>2.1. Content involving illegality, such as piracy, criminal activity, terrorism, obscenity, child pornography, gambling (subject to Section 3 below), and illegal drug use.</p>
<p>2.2. Content infringing third party Intellectual Property Rights.</p>
<p>2.3. Cruel or hateful Content that could harm, harass, promote or condone violence against, or that is primarily intended to incite hatred of, animals, or individuals or groups based on race or ethnic origin, religion, nationality, disability, gender, age, veteran status, or sexual orientation/gender identity.</p>
<p>2.4. Content that is libelous, false, inaccurate, misleading, or invades another person&apos;s privacy.</p>
<p>2.5. Content that breaches the Privacy Policy or applicable data privacy laws.</p>
<p>2.6. Content that promotes or could be construed as primarily intended to evade the limitations above.</p>
</section>
<section id="gambling">
<h2>3. Gambling</h2>
<p>If your Content involves gambling, the following shall apply: (i) if you reside in a jurisdiction which requires a license for online gambling, you must obtain such license prior to making your Content available; (ii) you must be in full compliance with the regulations of your country of residence; (iii) you must geo-block your Content for IPs from jurisdictions where online gambling is banned (including, without limitation, the United States of America, South Korea and China) and (iv) you must include in the terms and conditions of use of your Content (if any) a release from liability in favor of the Foundation and the DAO to the fullest extent allowed by applicable law vis a vis you and the users of your Content.</p>
</section>
<section id="breaches-of-this-policy">
<h2>4. Breaches of this Policy</h2>
<p>Any Content in infringement of Section 2, may be blocked and upon blocking shall not be available to other users of the Services. Moreover, infringing Content may result in suspension of the Account, court orders, civil actions, injunctions, criminal prosecutions and other legal consequences brought by the Foundation, the DAO or third parties against the creator, distributor and/or user of said infringing Content. The User&apos;s Account may also be terminated in accordance with Section 15 of the Terms of Use.</p>
</section>
<section id="age-restricted-content">
<h2>5. Restricted Content</h2>
<p>Any Content which qualifies as (i) intensely violent or graphic, (ii) gambling or (iii) sexually explicit, shall only be available to people aged 18 or older. If you upload, post, create, display, transmit or make available such Content on the Tools, you must provide sufficient warning as to this restriction. Failure to do so may result in termination of your Account pursuant to Section 15 of the Terms.</p>
</section>
<section id="user-representations-and-warranties">
<h2>6. User Representations and Warranties</h2>
<p>You represent and warrant that at any time you submit Content, you are at least the age of majority in the jurisdiction in which you reside and are the parent or legal guardian, or have all proper consents from the parent or legal guardian, of any minor who contributed to any Content you submit, and that, as to that Content, (a) you are the sole author and owner of the Intellectual Property Rights to such Content, or you have a lawful right to submit the Content, all without any obligation to obtain consent of any third party and without creating any obligation or liability for the Foundation; (b) the Content is accurate; (c) the Content does not and will not infringe any Intellectual Property Right of any third party; and (d) the User Content will not violate the Terms or this Content Policy, or cause injury or harm to any person.</p>
<p>You expressly acknowledge and accept that the Content you submit will be accessible to and viewable by other users and waive any claim with regards to the Foundation, its directors, officers, employees and affiliates in connection with said third party access. You can withdraw your Content at any time you wish.</p>
<p>Please remember that the Content that you submit will be accessible to and viewable by other users. Except as may be required to register and/or maintain your Account, do not submit personally identifiable information (e.g. first and last name together, password, phone number, address, credit or debit card number, medical information, e-mail address, or other contact information) on the Tools.</p>
<p>By submitting, posting or displaying content, and or through Decentraland Platform, the Services and/or the Marketplace, you grant us a worldwide, non-exclusive, royalty-free perpetual, irrevocable, transferable right and license (with the right to sublicense) to use, copy, reproduce, process, adapt, modify, publish, transmit, display, develop, improve, distribute such Content, promote Decentraland, activities, Events, in any and all media or distribution methods (now known or later developed). You further grant Decentraland, the DAO and/or the Foundation, the right to use your name and trademarks, if any, in connection with our use of your Content available at the Platform and/or the Marketplace, from time to time.</p>
</section>
<section id="storage">
<h2>7. Storage</h2>
<p>You acknowledge that due to the decentralized nature of Decentraland and of the blockchain technology, all Content and information submitted by you is not stored in a centralized server, but in several decentralized nodes (the &quot;Nodes&quot;). Thus, the Foundation or the DAO are not liable for any loss of content or information.</p>
<p>The Nodes recognize and accept that in the event of any court order relating to the blocking, suspension or deletion of any Content, they will abide by any such court order.</p>
</section>
<section id="limitations-to-liability">
<h2>8. Limitations to Liability</h2>
<p>The Foundation, its officers, employees, and the DAO are not responsible or liable for the Content, conduct, or services of users or third parties. The Foundation, its officers, employees and the DAO do not control or endorse the Content of communications between users or users&apos; interactions with each other or the Tools.</p>
<p>You acknowledge that you will be exposed to various aspects of the Services involving the conduct, Content, and services of users, and that the Foundation does not control and is not responsible or liable for the quality, safety, legality, truthfulness or accuracy of any such user conduct, Content or user services. You acknowledge that Decentraland does not guarantee the accuracy of information submitted by any user of the Services, nor any identity information about any user. Your interactions with other users and your use of Content are entirely at your own risk. The Foundation has no obligation to become involved in any dispute that you may have or claim to have with one or more users of the Services, or in any manner in any resolution thereof.</p>
<p>THE TOOLS MAY CONTAIN LINKS TO OR OTHERWISE ALLOW CONNECTIONS TO THIRD-PARTY WEBSITES, SERVERS, AND ONLINE SERVICES OR ENVIRONMENTS THAT ARE NOT OWNED OR CONTROLLED BY THE FOUNDATION. DECENTRALAND, ITS OFFICERS, EMPLOYEES AND THE DAO ARE NOT RESPONSIBLE OR LIABLE FOR THE CONTENT, POLICIES OR PRACTICES OF ANY THIRD-PARTY WEBSITES, SERVERS OR ONLINE SERVICES OR ENVIRONMENTS. Please consult any applicable terms of use and privacy policies provided by the third party for such websites, servers or online services or environments.</p>
<p>You acknowledge that the Content of the Services is provided or made available to you under license from independent Content Providers, including other users of the Services (&quot;Content Providers&quot;). You acknowledge and agree that except as expressly provided in this Agreement, the Intellectual Property Rights of other Content Providers in their respective Content are not licensed to you by your mere use of the Services. You must obtain from the applicable Content Providers any necessary license rights in Content that you desire to use or access.</p>
<p>You copy and use Content at your own risk. You are solely responsible and liable for your use, reproduction, distribution, modification, display, or performance of any Content in violation of any Intellectual Property Rights. You agree that Decentraland will have no liability for, and you agree to defend, indemnify, and hold Decentraland harmless from, any claims, losses or damages arising out of or in connection with your use, reproduction, distribution, modification, display, or performance of any Content.</p>
</section>
<section id="changes-to-this-policy">
<h2>9. Changes to this Policy</h2>
<p>The Foundation and/or the DAO may change this Content Policy from time to time. All users have the obligation to be aware of the updated versions of this Policy.</p>
</section>
</article>`

interface LegalPageData {
  title: string
  description: string
  bodyHtml: string
}

const LEGAL_PAGES: Partial<Record<string, LegalPageData>> = {
  '/content': {
    title: 'Content Policy',
    description:
      'The Decentraland Content Policy defines what content is permitted on the platform, including rules on prohibited content, gambling, age-restricted material, and user responsibilities.',
    bodyHtml: CONTENT_POLICY_BODY_HTML
  },
  '/terms': {
    title: 'Terms of Use',
    description: "Decentraland's Terms of Use govern your access to and use of the Decentraland platform, services, and marketplace.",
    bodyHtml: ''
  },
  '/privacy': {
    title: 'Privacy Policy',
    description: "Decentraland's Privacy Policy explains how the Foundation collects, uses, and protects your personal information.",
    bodyHtml: ''
  }
}

// =============================================================================
// SEO Data Resolution
// =============================================================================

interface SEOQueryParams {
  searchQuery: string | null
  eventId: string | null
  position: string | null
  worldName: string | null
}

const fetchLegalPageData = (pathname: string): SEOData | null => {
  const page = LEGAL_PAGES[pathname]
  if (!page) return null
  return {
    title: page.title,
    description: page.description,
    imageUrl: DEFAULTS.image,
    bodyHtml: page.bodyHtml
  }
}

const fetchSEOData = async (pathname: string, params: SEOQueryParams): Promise<SEOData | null> => {
  const legalData = fetchLegalPageData(pathname)
  if (legalData) return legalData

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
      return fetchWhatsOnSEO(params.eventId, params.position, params.worldName)
    default:
      return fetchDefaultSEO()
  }
}

// =============================================================================
// HTML Generation
// =============================================================================

// Use a function replacement so `$&`, `$1`, `$$` etc. inside an API-returned title
// don't get expanded into the matched substring — that would break out of the
// `content="..."` attribute boundary even after escapeHTML.
const replaceMetaTag = (html: string, pattern: RegExp, replacement: string): string => html.replace(pattern, () => replacement)

const generateHTML = (data: SEOData | null, originalHTML: string, url: string): string => {
  // Escape every interpolated value to prevent reflected/stored XSS via CMS fields or query strings.
  const rawTitle = data?.title ? `${data.title} | ${DEFAULTS.siteName}` : DEFAULTS.title
  const rawDescription = data?.description || DEFAULTS.description
  const rawImageUrl = safeUrl(data?.imageUrl || DEFAULTS.image, DEFAULTS.image)

  const title = escapeHTML(rawTitle)
  const titleTextContent = escapeHTMLTextContent(rawTitle)
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
  html = replaceMetaTag(html, /<title>.*?<\/title>/i, `<title>${titleTextContent}</title>`)
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

  // For pages that supply static body text (legal pages), inject it inside #root between
  // the HERO_SHELL markers. React's createRoot().render() replaces this on JS load so
  // browser users see the fully styled SPA; non-JS clients (AI agents, crawlers) read
  // the pre-rendered text. bodyHtml is hardcoded in this file and never sourced from
  // user input, so no escaping is needed.
  if (data?.bodyHtml) {
    html = html.replace(
      '<!-- HERO_SHELL_START --><!-- HERO_SHELL_END -->',
      `<!-- HERO_SHELL_START -->${data.bodyHtml}<!-- HERO_SHELL_END -->`
    )
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
  const worldName = firstQueryValue(req.query.world)

  const origin = resolveOrigin(req)
  // Preserve id / position / world in the canonical URL so social cards and search
  // engines link back to the deep-linked event/parcel/world rather than the
  // generic listing page. Applies to /events and /jump/{events,places}.
  const canonicalQuery = new URLSearchParams()
  const preservesQuery = requestPath.startsWith('/events') || requestPath.startsWith('/jump/')
  if (preservesQuery) {
    if (eventId && EVENT_ID_REGEX.test(eventId)) canonicalQuery.set('id', eventId)
    else if (position && POSITION_REGEX.test(position)) canonicalQuery.set('position', position)
    else if (worldName && WORLD_NAME_REGEX.test(worldName)) canonicalQuery.set('world', worldName)
  }
  const queryString = canonicalQuery.toString()
  const actualUrl = `${origin}${requestPath}${queryString ? `?${queryString}` : ''}`

  // Preview pages accept an unauthenticated token in the query string; treat them
  // as private content: no edge cache, no Referer leak, no search indexing.
  // Exact match is safe — Vercel normalizes trailing slashes (`/blog/preview/`) upstream
  // of this function, so `requestPath` is always the canonical form.
  const isPreviewPath = requestPath === '/blog/preview'

  // Security headers applied regardless of the response path.
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', isPreviewPath ? 'no-referrer' : 'strict-origin-when-cross-origin')
  if (isPreviewPath) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }

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
    const seoData = await fetchSEOData(requestPath, { searchQuery, eventId, position, worldName })

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    // Shorter stale window: timely blog announcements should not be served up to 24h stale.
    res.setHeader('Cache-Control', isPreviewPath ? 'no-store' : 'public, max-age=3600, stale-while-revalidate=14400')
    res.setHeader('Vary', 'Accept-Encoding')
    res.setHeader('X-SEO-Function', 'active')
    res.status(200).send(generateHTML(seoData, INDEX_HTML, actualUrl))
  } catch (error) {
    // CMS unreachable — serve INDEX_HTML with default meta tags rather than redirecting
    // to actualUrl (which would loop back to this function via vercel.json rewrite).
    console.error('[SEO Function] Error:', error)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', isPreviewPath ? 'no-store' : 'public, max-age=60')
    res.status(200).send(generateHTML(null, INDEX_HTML, actualUrl))
  }
}

// eslint-disable-next-line import/no-default-export
export default handler
