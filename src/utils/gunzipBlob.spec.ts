import * as nodeStreamWeb from 'node:stream/web'
import { gzipSync } from 'node:zlib'
import { gunzipBlob } from './gunzipBlob'

const globalWithStreams = globalThis as unknown as { DecompressionStream?: unknown }

describe('when gunzipping a gzip blob', () => {
  let original: string
  let gzipped: Blob

  beforeEach(async () => {
    globalWithStreams.DecompressionStream = (nodeStreamWeb as unknown as { DecompressionStream: unknown }).DecompressionStream
    original = '{"world":[{"key":"k","value":1}],"players":[]}'
    gzipped = await new Response(Uint8Array.from(gzipSync(original))).blob()
  })

  afterEach(() => {
    delete globalWithStreams.DecompressionStream
    jest.resetAllMocks()
  })

  it('should resolve to a blob holding the original text', async () => {
    expect(await (await gunzipBlob(gzipped)).text()).toBe(original)
  })
})
