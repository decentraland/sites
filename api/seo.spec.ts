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
      if (typeof p === 'string' && p.includes('dist/index.html')) return FIXTURE_INDEX_HTML
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
    expect(body).toContain('<title>What&#x27;s On in Decentraland | Decentraland</title>')
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
    expect(body).toContain('<title>What&#x27;s On in Decentraland | Decentraland</title>')
    expect(body).toMatch(/<link rel="canonical" href="https:\/\/decentraland\.org\/whats-on">/)
  })

  it('rejects malformed event id and falls back to defaults', async () => {
    const { body } = await run({ path: '/whats-on', id: 'not<a>uuid' })
    expect(body).toContain('<title>What&#x27;s On in Decentraland | Decentraland</title>')
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
    expect(body).toContain('<title>Alice&#x27;s Decentraland snapshot | Decentraland</title>')
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
})
