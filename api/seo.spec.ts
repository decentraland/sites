import fs from 'fs'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './seo'

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

type MockResponseBody = MockEventResponse | MockBlogPostsResponse | MockAssetResponse | Record<string, never>

function jsonResponse<T extends MockResponseBody>(ok: boolean, body: T): Response {
  return {
    ok,
    json: async () => body
  } as unknown as Response
}

describe('seo handler', () => {
  const realFetch = global.fetch

  beforeAll(() => {
    if (!fs.existsSync(`${process.cwd()}/dist/index.html`)) {
      throw new Error('dist/index.html missing — run `npm run build` before `npm test`')
    }

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
  })

  it('serves position-aware metadata for /whats-on?position=0,0', async () => {
    const { body } = await run({ path: '/whats-on', position: '0,0' })
    expect(body).toContain('<title>Explore (0,0) in Decentraland | Decentraland</title>')
    expect(body).toMatch(/<link rel="canonical" href="https:\/\/decentraland\.org\/whats-on\?position=0%2C0">/)
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
})
