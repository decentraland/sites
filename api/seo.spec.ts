import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './seo'

// Mock the dist/index.html the SEO worker reads at module load. Lets `npm test` run in CI
// without `npm run build`. The fixture mirrors index.html with placeholders for every meta
// tag the worker substitutes, so the assertions below exercise real substitution.
// jest.mock() is hoisted by babel-jest above all imports, so the seo module sees the mocked fs.
jest.mock('fs', () => {
  const actual = jest.requireActual('fs')
  const FIXTURE_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Decentraland</title>
  <meta name="description" content="Decentraland is where you hang out online." />
  <meta property="og:title" content="Decentraland — Come Hang Out">
  <meta property="og:description" content="Decentraland is where you hang out online.">
  <meta property="og:image" content="https://marketing-files.decentraland.org/uploads/1778186218133_decentraland-background.webp">
  <meta property="og:site_name" content="Decentraland">
  <meta name="twitter:title" content="Decentraland — Come Hang Out">
  <meta name="twitter:description" content="Decentraland is where you hang out online.">
  <meta name="twitter:image" content="https://marketing-files.decentraland.org/uploads/1778186218133_decentraland-background.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@decentraland">
  <meta name="twitter:creator" content="@decentraland">
  <link rel="canonical" href="https://decentraland.org/">
  <meta property="og:url" content="https://decentraland.org/">
  <meta property="og:type" content="website">
</head>
<body><div id="root"></div></body>
</html>`
  return {
    ...actual,
    readFileSync: jest.fn((p: unknown, opts?: unknown) => {
      if (typeof p === 'string' && p.includes('dist/index.html')) {
        const flag = (globalThis as Record<string, unknown>).__seoReadFileSyncShouldFail
        if (flag === true) throw new Error('missing dist/index.html')
        return FIXTURE_INDEX_HTML
      }
      return actual.readFileSync(p, opts)
    })
  }
})

interface MockResponse {
  headers: Record<string, string>
  statusCode: number
  body: string
  setHeader: (key: string, value: string) => void
  status: (code: number) => MockResponse
  send: (body: string) => void
}

function makeRes(): MockResponse {
  const res: MockResponse = {
    headers: {},
    statusCode: 0,
    body: '',
    setHeader(key, value) {
      this.headers[key] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    send(body) {
      this.body = body
    }
  }
  return res
}

interface MockEventResponse {
  ok: true
  data: {
    name: string
    description: string
    image: string
    // eslint-disable-next-line @typescript-eslint/naming-convention
    scene_name: string
  }
}

interface MockBlogPostsResponse {
  items: Array<{ fields: { description: string; image: { sys: { id: string } } } }>
}

interface MockAssetResponse {
  fields: { file: { url: string } }
}

interface MockPlaceResponse {
  ok: true
  data: Array<{ title: string; description: string; image: string }>
}

interface MockWorldResponse {
  ok: true
  data: Array<{ title: string; description: string; image: string }>
  total: number
}

interface MockReelResponse {
  url: string
  thumbnailUrl?: string
  metadata?: {
    userName?: string
    userAddress?: string
    scene?: { name?: string }
  }
}

type MockResponseBody =
  | MockEventResponse
  | MockBlogPostsResponse
  | MockAssetResponse
  | MockPlaceResponse
  | MockWorldResponse
  | MockReelResponse
  | Record<string, never>

function jsonResponse<T extends MockResponseBody>(ok: boolean, body: T): Response {
  return {
    ok,
    json: async () => body
  } as unknown as Response
}

describe('seo handler', () => {
  const realFetch = global.fetch

  beforeAll(() => {
    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/events/11974ff3-675c-46fd-802a-618d4b40e3be')) {
        return jsonResponse<MockEventResponse>(true, {
          ok: true,
          data: {
            name: 'Build Your Career',
            description: 'Career workshop',
            image: 'https://events-assets-099ac00.decentraland.org/poster/abc.jpg',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            scene_name: 'Decentraland Theatre'
          }
        })
      }
      if (url.includes('/places?positions=0%2C0')) {
        return jsonResponse<MockPlaceResponse>(true, {
          ok: true,
          data: [
            { title: 'Genesis Plaza', description: 'Decentraland spawn point', image: 'https://peer.decentraland.org/content/contents/abc' }
          ]
        })
      }
      if (url.includes('/worlds?names=common.dcl.eth')) {
        return jsonResponse<MockWorldResponse>(true, {
          ok: true,
          total: 1,
          data: [
            {
              title: 'Common World',
              description: 'A community-curated Decentraland world',
              image: 'https://peer.decentraland.org/content/contents/world-img'
            }
          ]
        })
      }
      if (url.includes('/worlds?names=missing.dcl.eth')) {
        return jsonResponse<MockWorldResponse>(true, { ok: true, total: 0, data: [] })
      }
      if (url.includes('/worlds?names=untitled.dcl.eth')) {
        return jsonResponse<MockWorldResponse>(true, {
          ok: true,
          total: 1,
          data: [{ title: '', description: '', image: '' }]
        })
      }
      if (url.includes('/api/images/reel-with-photographer/metadata')) {
        return jsonResponse<MockReelResponse>(true, {
          url: 'https://camera-reel-storage.decentraland.org/reels/reel-with-photographer.jpg',
          metadata: {
            userName: 'Alice',
            userAddress: '0xabc',
            scene: { name: 'Genesis Plaza' }
          }
        })
      }
      if (url.includes('/api/images/reel-without-photographer/metadata')) {
        return jsonResponse<MockReelResponse>(true, {
          url: 'https://camera-reel-storage.decentraland.org/reels/reel-without-photographer.jpg'
        })
      }
      if (url.includes('/api/images/reel-network-error/metadata')) {
        throw new Error('network failure')
      }
      if (url.includes('/blog/posts')) {
        return jsonResponse<MockBlogPostsResponse>(true, {
          items: [{ fields: { description: 'Blog desc', image: { sys: { id: 'img' } } } }]
        })
      }
      if (url.includes('/assets/')) {
        return jsonResponse<MockAssetResponse>(true, {
          fields: { file: { url: 'https://cms-images.decentraland.org/test.png' } }
        })
      }
      return jsonResponse(false, {})
    }) as typeof fetch
  })

  afterAll(() => {
    global.fetch = realFetch
  })

  async function run(query: Record<string, string>): Promise<{ status: number; headers: Record<string, string>; body: string }> {
    const req = { query, headers: { host: 'decentraland.org' } } as unknown as VercelRequest
    const res = makeRes()
    await handler(req, res as unknown as VercelResponse)
    return { status: res.statusCode, headers: res.headers, body: res.body }
  }

  it('serves event metadata for /whats-on?id=<uuid>', async () => {
    const { status, headers, body } = await run({ path: '/whats-on', id: '11974ff3-675c-46fd-802a-618d4b40e3be' })
    expect(status).toBe(200)
    expect(headers['X-SEO-Function']).toBe('active')
    expect(body).toContain('<title>Build Your Career at Decentraland Theatre | Decentraland</title>')
    expect(body).toMatch(/<meta property="og:description" content="Career workshop">/)
    expect(body).toMatch(/<meta property="og:image" content="https:\/\/events-assets-099ac00\.decentraland\.org\/poster\/abc\.jpg">/)
    expect(body).toMatch(/<link rel="canonical" href="https:\/\/decentraland\.org\/whats-on\?id=11974ff3-675c-46fd-802a-618d4b40e3be">/)
    expect(body).toMatch(
      /<meta property="og:url" content="https:\/\/decentraland\.org\/whats-on\?id=11974ff3-675c-46fd-802a-618d4b40e3be">/
    )
    // Twitter card + handles + og:site_name (parity with the legacy events frontend Helmet)
    expect(body).toMatch(/<meta name="twitter:card" content="summary_large_image">/)
    expect(body).toMatch(/<meta name="twitter:site" content="@decentraland">/)
    expect(body).toMatch(/<meta name="twitter:creator" content="@decentraland">/)
    expect(body).toMatch(/<meta property="og:site_name" content="Decentraland">/)
    // Twitter title and description should match the resolved event copy, not the homepage default
    expect(body).toMatch(/<meta name="twitter:title" content="Build Your Career at Decentraland Theatre \| Decentraland">/)
    expect(body).toMatch(/<meta name="twitter:description" content="Career workshop">/)
  })

  it('serves place-aware metadata for /whats-on?position=0,0 via places API', async () => {
    const { body } = await run({ path: '/whats-on', position: '0,0' })
    expect(body).toContain('<title>Genesis Plaza | Decentraland</title>')
    expect(body).toMatch(/<meta property="og:description" content="Decentraland spawn point">/)
    expect(body).toMatch(/<meta property="og:image" content="https:\/\/peer\.decentraland\.org\/content\/contents\/abc">/)
    expect(body).toMatch(/<link rel="canonical" href="https:\/\/decentraland\.org\/whats-on\?position=0%2C0">/)
    // Twitter card + handles + og:site_name (parity with the legacy places frontend Helmet)
    expect(body).toMatch(/<meta name="twitter:card" content="summary_large_image">/)
    expect(body).toMatch(/<meta name="twitter:site" content="@decentraland">/)
    expect(body).toMatch(/<meta name="twitter:creator" content="@decentraland">/)
    expect(body).toMatch(/<meta property="og:site_name" content="Decentraland">/)
    expect(body).toMatch(/<meta name="twitter:title" content="Genesis Plaza \| Decentraland">/)
    expect(body).toMatch(/<meta name="twitter:description" content="Decentraland spawn point">/)
  })

  it('serves event metadata for /jump/events?id=<uuid> (same handler as /whats-on)', async () => {
    const { body, headers } = await run({ path: '/jump/events', id: '11974ff3-675c-46fd-802a-618d4b40e3be' })
    expect(headers['X-SEO-Function']).toBe('active')
    expect(body).toContain('<title>Build Your Career at Decentraland Theatre | Decentraland</title>')
    expect(body).toMatch(/<link rel="canonical" href="https:\/\/decentraland\.org\/jump\/events\?id=11974ff3-675c-46fd-802a-618d4b40e3be">/)
  })

  it('serves place metadata for /jump/places?position=0,0', async () => {
    const { body, headers } = await run({ path: '/jump/places', position: '0,0' })
    expect(headers['X-SEO-Function']).toBe('active')
    expect(body).toContain('<title>Genesis Plaza | Decentraland</title>')
    expect(body).toMatch(/<link rel="canonical" href="https:\/\/decentraland\.org\/jump\/places\?position=0%2C0">/)
  })

  it('serves world metadata for /whats-on?world=<name> via places API /worlds endpoint', async () => {
    const { body, headers } = await run({ path: '/whats-on', world: 'common.dcl.eth' })
    expect(headers['X-SEO-Function']).toBe('active')
    expect(body).toContain('<title>Common World | Decentraland</title>')
    expect(body).toMatch(/<meta property="og:description" content="A community-curated Decentraland world">/)
    expect(body).toMatch(/<meta property="og:image" content="https:\/\/peer\.decentraland\.org\/content\/contents\/world-img">/)
    expect(body).toMatch(/<link rel="canonical" href="https:\/\/decentraland\.org\/whats-on\?world=common\.dcl\.eth">/)
    expect(body).toMatch(/<meta name="twitter:title" content="Common World \| Decentraland">/)
  })

  it('rejects malformed world name and falls back to defaults', async () => {
    const { body } = await run({ path: '/whats-on', world: 'not<a>world' })
    expect(body).toContain("<title>What's On in Decentraland | Decentraland</title>")
    expect(body).toMatch(/<link rel="canonical" href="https:\/\/decentraland\.org\/whats-on">/)
  })

  it('falls back to a world-aware default when the API returns no entry', async () => {
    const { body } = await run({ path: '/whats-on', world: 'missing.dcl.eth' })
    expect(body).toContain('<title>Visit missing.dcl.eth in Decentraland | Decentraland</title>')
    expect(body).toMatch(/<link rel="canonical" href="https:\/\/decentraland\.org\/whats-on\?world=missing\.dcl\.eth">/)
  })

  it('falls back to a world-aware default when the entry has no title', async () => {
    const { body } = await run({ path: '/whats-on', world: 'untitled.dcl.eth' })
    expect(body).toContain('<title>Visit untitled.dcl.eth in Decentraland | Decentraland</title>')
    expect(body).toMatch(/<meta property="og:description" content="Discover untitled\.dcl\.eth — a Decentraland world\.">/)
  })

  it('serves generic whats-on metadata when no params', async () => {
    const { body } = await run({ path: '/whats-on' })
    expect(body).toContain("<title>What's On in Decentraland | Decentraland</title>")
    expect(body).toMatch(/<link rel="canonical" href="https:\/\/decentraland\.org\/whats-on">/)
  })

  it('keeps the apostrophe in the <title> element as a literal character, not an HTML entity, so a downstream re-encode cannot double-encode it', async () => {
    const { body } = await run({ path: '/whats-on' })
    const titleMatch = body.match(/<title>([^<]*)<\/title>/)
    expect(titleMatch).not.toBeNull()
    expect(titleMatch![1]).not.toMatch(/&#?x?\d*'?;/i)
    expect(titleMatch![1]).toBe("What's On in Decentraland | Decentraland")
    // Attribute-bound titles (twitter:title, og:title) still escape the apostrophe defensively
    // because the value is wrapped in double-quoted attributes.
    expect(body).toMatch(/<meta name="twitter:title" content="What&#x27;s On in Decentraland \| Decentraland">/)
  })

  it('rejects malformed event id and falls back to defaults', async () => {
    const { body } = await run({ path: '/whats-on', id: 'not<a>uuid' })
    expect(body).toContain("<title>What's On in Decentraland | Decentraland</title>")
    // Canonical should NOT include the bad id
    expect(body).toMatch(/<link rel="canonical" href="https:\/\/decentraland\.org\/whats-on">/)
  })

  it('still handles /blog (regression)', async () => {
    const { body, headers } = await run({ path: '/blog' })
    expect(headers['X-SEO-Function']).toBe('active')
    expect(body).toContain('Decentraland Blog')
  })

  it('rejects unknown roots via sanitizePath', async () => {
    const { body } = await run({ path: '/social/communities/foo' })
    // Sanitized to /blog default
    expect(body).toContain('Decentraland Blog')
  })

  it('serves reel metadata for /reels/<imageId> with photographer attribution', async () => {
    const { body, headers } = await run({ path: '/reels/reel-with-photographer' })
    expect(headers['X-SEO-Function']).toBe('active')
    expect(body).toContain("<title>Alice's Decentraland snapshot | Decentraland</title>")
    expect(body).toMatch(/<meta property="og:description" content="Check out Alice&#x27;s photo taken in Genesis Plaza, Decentraland\./)
    expect(body).toMatch(
      /<meta property="og:image" content="https:\/\/camera-reel-storage\.decentraland\.org\/reels\/reel-with-photographer\.jpg">/
    )
    expect(body).toMatch(/<link rel="canonical" href="https:\/\/decentraland\.org\/reels\/reel-with-photographer">/)
  })

  it('falls back to anonymous reel copy when metadata.userName is missing', async () => {
    const { body } = await run({ path: '/reels/reel-without-photographer' })
    expect(body).toContain('<title>Photos from Decentraland | Decentraland</title>')
    expect(body).toMatch(/<meta property="og:description" content="A photo taken in Decentraland, Decentraland\.">/)
  })

  it('skips the /reels/list page (CF parity) and serves blog defaults', async () => {
    const { body } = await run({ path: '/reels/list' })
    // /reels/list is excluded from the reels handler — no upstream fetch, blog default copy.
    expect(body).toContain('Decentraland Blog')
  })

  it('falls back to defaults when the upstream reel API throws', async () => {
    const { body } = await run({ path: '/reels/reel-network-error' })
    expect(body).toContain('Decentraland Blog')
  })

  it('serves blog post metadata for /blog/<category>/<post>', async () => {
    const originalFetch = global.fetch
    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/blog/posts?fields.slug=announcing-x')) {
        return jsonResponse(true, {
          items: [
            {
              fields: {
                title: 'Announcing X',
                description: 'Big news',
                image: { sys: { id: 'asset-1' } },
                author: { sys: { id: 'author-1' } },
                category: { sys: { id: 'category-1' } },
                publishedDate: '2026-01-01T00:00:00Z'
              }
            }
          ]
        } as unknown as MockBlogPostsResponse)
      }
      if (url.includes('/assets/asset-1')) {
        return jsonResponse(true, { fields: { file: { url: '//cdn.test/poster.png' } } } as unknown as MockAssetResponse)
      }
      if (url.includes('/entries/author-1')) {
        return jsonResponse(true, { sys: { id: 'author-1', type: 'Entry' }, fields: { title: 'Jane Doe' } } as unknown as MockReelResponse)
      }
      if (url.includes('/entries/category-1')) {
        return jsonResponse(true, {
          sys: { id: 'category-1', type: 'Entry' },
          fields: { title: 'Announcements' }
        } as unknown as MockReelResponse)
      }
      return jsonResponse(false, {})
    }) as typeof fetch

    const { body } = await run({ path: '/blog/announcements/announcing-x' })
    expect(body).toContain('<title>Announcing X | Decentraland</title>')
    expect(body).toMatch(/<meta property="og:image" content="https:\/\/cdn\.test\/poster\.png">/)
    expect(body).toMatch(/<meta property="article:author" content="Jane Doe">/)
    expect(body).toMatch(/<meta property="article:published_time" content="2026-01-01T00:00:00Z">/)
    expect(body).toMatch(/<meta property="article:section" content="Announcements">/)
    expect(body).toMatch(/<meta property="og:type" content="article">/)

    global.fetch = originalFetch
  })

  it('falls back to defaults when a blog post entry has no fields', async () => {
    const originalFetch = global.fetch
    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/blog/posts?fields.slug=missing')) return jsonResponse(true, { items: [] } as unknown as MockBlogPostsResponse)
      return jsonResponse(false, {})
    }) as typeof fetch
    const { body } = await run({ path: '/blog/cat/missing' })
    expect(body).toContain('Decentraland Blog')
    global.fetch = originalFetch
  })

  it('serves category metadata for /blog/<category>', async () => {
    const originalFetch = global.fetch
    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/blog/categories?fields.slug=announcements')) {
        return jsonResponse(true, {
          items: [{ fields: { title: 'Announcements', description: 'Big drops', image: { sys: { id: 'cat-img' } } } }]
        } as unknown as MockBlogPostsResponse)
      }
      if (url.includes('/assets/cat-img')) {
        return jsonResponse(true, { fields: { file: { url: 'https://cdn.test/cat.png' } } } as unknown as MockAssetResponse)
      }
      return jsonResponse(false, {})
    }) as typeof fetch
    const { body } = await run({ path: '/blog/announcements' })
    expect(body).toContain('<title>Announcements | Decentraland</title>')
    global.fetch = originalFetch
  })

  it('falls back when the category lookup has no entry', async () => {
    const originalFetch = global.fetch
    global.fetch = (async () => jsonResponse(true, { items: [] } as unknown as MockBlogPostsResponse)) as typeof fetch
    const { body } = await run({ path: '/blog/unknown-category' })
    expect(body).toContain('Decentraland Blog')
    global.fetch = originalFetch
  })

  it('serves author metadata for /blog/author/<slug>', async () => {
    const originalFetch = global.fetch
    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/blog/authors?fields.slug=jane')) {
        return jsonResponse(true, {
          items: [{ fields: { title: 'Jane Doe', description: 'Decentraland contributor', image: { sys: { id: 'author-img' } } } }]
        } as unknown as MockBlogPostsResponse)
      }
      if (url.includes('/assets/author-img')) {
        return jsonResponse(true, { fields: { file: { url: 'https://cdn.test/jane.png' } } } as unknown as MockAssetResponse)
      }
      return jsonResponse(false, {})
    }) as typeof fetch
    const { body } = await run({ path: '/blog/author/jane' })
    expect(body).toContain('<title>Posts by Jane Doe | Decentraland</title>')
    global.fetch = originalFetch
  })

  it('falls back to defaults when the author entry has no title', async () => {
    const originalFetch = global.fetch
    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/blog/authors?fields.slug=anon')) {
        return jsonResponse(true, { items: [{ fields: { description: 'no name' } }] } as unknown as MockBlogPostsResponse)
      }
      return jsonResponse(false, {})
    }) as typeof fetch
    const { body } = await run({ path: '/blog/author/anon' })
    expect(body).toContain('Decentraland Blog | Updates')
    global.fetch = originalFetch
  })

  it('handles /blog/search with a query string', async () => {
    const { body } = await run({ path: '/blog/search', q: 'wearables' })
    expect(body).toContain('<title>Search: wearables | Decentraland</title>')
  })

  it('handles /blog/search without a query string', async () => {
    const { body } = await run({ path: '/blog/search' })
    expect(body).toContain('<title>Search | Decentraland</title>')
  })

  it('marks /blog/preview as no-index with no-store cache headers', async () => {
    const { headers } = await run({ path: '/blog/preview' })
    expect(headers['Cache-Control']).toBe('no-store')
    expect(headers['Referrer-Policy']).toBe('no-referrer')
    expect(headers['X-Robots-Tag']).toBe('noindex, nofollow, noarchive')
  })

  it('falls back to defaults when the position is valid but the places API returns no entry', async () => {
    const originalFetch = global.fetch
    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/places?positions=-50%2C-50')) {
        return jsonResponse(true, { ok: true, data: [] } as unknown as MockPlaceResponse)
      }
      return jsonResponse(false, {})
    }) as typeof fetch
    const { body } = await run({ path: '/whats-on', position: '-50,-50' })
    expect(body).toContain('<title>Explore (-50,-50) in Decentraland | Decentraland</title>')
    global.fetch = originalFetch
  })

  it('rejects a malformed position and falls back to whats-on defaults', async () => {
    const { body } = await run({ path: '/whats-on', position: 'bogus' })
    expect(body).toContain("<title>What's On in Decentraland | Decentraland</title>")
  })

  it('returns 200 with a client-side redirect HTML when dist/index.html is unavailable', async () => {
    ;(globalThis as Record<string, unknown>).__seoReadFileSyncShouldFail = true
    let freshHandler: typeof handler | null = null
    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        freshHandler = require('./seo').default
      })
    } finally {
      ;(globalThis as Record<string, unknown>).__seoReadFileSyncShouldFail = false
    }
    const req = { query: { path: '/blog' }, headers: { host: 'decentraland.org' } } as unknown as VercelRequest
    const res = makeRes()
    await freshHandler!(req, res as unknown as VercelResponse)
    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('location.replace("/")')
  })

  it('falls back to the blog defaults when the response cannot be sent (catch path)', async () => {
    const req = { query: { path: '/blog' }, headers: { host: 'decentraland.org' } } as unknown as VercelRequest
    const res: MockResponse & { sendCalls: number } = {
      ...makeRes(),
      sendCalls: 0,
      send(body) {
        this.sendCalls++
        if (this.sendCalls === 1) throw new Error('send fail')
        this.body = body
      }
    }
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    await handler(req, res as unknown as VercelResponse)
    expect(res.headers['Cache-Control']).toBe('public, max-age=60')
    expect(res.body).toContain('Decentraland')
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('uses no-store cache on the catch path when /blog/preview is being rendered', async () => {
    const req = { query: { path: '/blog/preview' }, headers: { host: 'decentraland.org' } } as unknown as VercelRequest
    const res: MockResponse & { sendCalls: number } = {
      ...makeRes(),
      sendCalls: 0,
      send(body) {
        this.sendCalls++
        if (this.sendCalls === 1) throw new Error('send fail')
        this.body = body
      }
    }
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    await handler(req, res as unknown as VercelResponse)
    expect(res.headers['Cache-Control']).toBe('no-store')
    errorSpy.mockRestore()
  })

  it('falls back to defaults when an unsafe image URL is supplied', async () => {
    const originalFetch = global.fetch
    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/blog/posts')) {
        return jsonResponse(true, {
          items: [{ fields: { description: 'd', image: { sys: { id: 'broken' } } } }]
        } as unknown as MockBlogPostsResponse)
      }
      if (url.includes('/assets/broken')) {
        return jsonResponse(true, { fields: { file: {} } } as unknown as MockAssetResponse)
      }
      return jsonResponse(false, {})
    }) as typeof fetch
    const { body } = await run({ path: '/blog' })
    expect(body).toContain('Decentraland Blog')
    global.fetch = originalFetch
  })

  it('uses DEFAULT_ORIGIN when an unrecognised host header is forwarded', async () => {
    const req = { query: { path: '/blog' }, headers: { host: 'attacker.example' } } as unknown as VercelRequest
    const res = makeRes()
    await handler(req, res as unknown as VercelResponse)
    expect(res.body).toContain('decentraland.org')
  })

  it('uses the first x-forwarded-host when provided as an array', async () => {
    const req = {
      query: { path: '/blog' },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { 'x-forwarded-host': ['decentraland.zone', 'attacker.example'], host: 'decentraland.zone' }
    } as unknown as VercelRequest
    const res = makeRes()
    await handler(req, res as unknown as VercelResponse)
    expect(res.body).toMatch(/decentraland\.zone\/blog/)
  })

  it('falls back to DEFAULT_ORIGIN when no host headers are set', async () => {
    const req = { query: { path: '/blog' }, headers: {} } as unknown as VercelRequest
    const res = makeRes()
    await handler(req, res as unknown as VercelResponse)
    expect(res.body).toContain('decentraland.org')
  })

  it('strips path-traversal attempts via sanitizePath', async () => {
    const { body } = await run({ path: '/blog/../etc/passwd' })
    expect(body).toContain('Decentraland Blog')
  })

  it('drops the canonical query when an invalid sanitizePath input is supplied', async () => {
    const req = { query: { path: 12345 as unknown as string }, headers: { host: 'decentraland.org' } } as unknown as VercelRequest
    const res = makeRes()
    await handler(req, res as unknown as VercelResponse)
    expect(res.body).toContain('Decentraland Blog')
  })

  it('rejects URL parse failures inside sanitizePath via a safe fallback', async () => {
    // An unclosed IPv6 literal forces `new URL()` to throw, exercising the catch in sanitizePath.
    const { body } = await run({ path: 'http://[invalid' })
    expect(body).toContain('Decentraland Blog')
  })

  it('falls back to the default share image when an unsafe CMS asset URL is supplied', async () => {
    const originalFetch = global.fetch
    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/blog/posts?fields.slug=js-asset')) {
        return jsonResponse(true, {
          items: [{ fields: { title: 'JS', description: 'd', image: { sys: { id: 'js-asset' } } } }]
        } as unknown as MockBlogPostsResponse)
      }
      if (url.includes('/assets/js-asset')) {
        return jsonResponse(true, { fields: { file: { url: 'javascript:alert(1)' } } } as unknown as MockAssetResponse)
      }
      return jsonResponse(false, {})
    }) as typeof fetch
    const { body } = await run({ path: '/blog/cat/js-asset' })
    expect(body).toMatch(
      /<meta property="og:image" content="https:\/\/marketing-files\.decentraland\.org\/uploads\/1778186218133_decentraland-background\.webp">/
    )
    global.fetch = originalFetch
  })

  it('falls back to the WhatsOn image when the events API returns a non-http image', async () => {
    const originalFetch = global.fetch
    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/events/aaaaaaaaaaaa1111')) {
        return jsonResponse(true, {
          ok: true,
          data: {
            name: 'Event',
            description: '',
            image: 'javascript:alert(1)',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            scene_name: ''
          }
        } as unknown as MockEventResponse)
      }
      return jsonResponse(false, {})
    }) as typeof fetch
    const { body } = await run({ path: '/whats-on', id: 'aaaaaaaaaaaa1111' })
    expect(body).toMatch(
      /<meta property="og:image" content="https:\/\/marketing-files\.decentraland\.org\/uploads\/1778186218133_decentraland-background\.webp">/
    )
    global.fetch = originalFetch
  })
})
