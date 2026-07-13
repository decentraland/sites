import { ReadableStream as NodeReadableStream, TransformStream as NodeTransformStream } from 'node:stream/web'
import { downloadFileWithProgress, triggerFileDownload } from './file'

// jsdom omits the WHATWG stream globals that file.ts relies on. Node ships
// them under node:stream/web — expose them as globals so the real streaming
// path runs under test.
const globalWithStreams = globalThis as unknown as {
  ReadableStream?: unknown
  TransformStream?: unknown
}
globalWithStreams.ReadableStream ??= NodeReadableStream
globalWithStreams.TransformStream ??= NodeTransformStream

const makeStreamBody = (chunks: Uint8Array[]): ReadableStream<Uint8Array> =>
  new NodeReadableStream({
    start(controller) {
      chunks.forEach(chunk => controller.enqueue(chunk))
      controller.close()
    }
  }) as unknown as ReadableStream<Uint8Array>

type FetchOverrides = {
  ok?: boolean
  status?: number
  body?: ReadableStream<Uint8Array> | null
  headers?: Record<string, string>
}

const mockFetch = (overrides: FetchOverrides): jest.Mock => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: overrides.ok ?? true,
    status: overrides.status ?? 200,
    body: overrides.body ?? null,
    headers: { get: (name: string) => overrides.headers?.[name.toLowerCase()] ?? null }
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

describe('downloadFileWithProgress', () => {
  let createObjectURL: jest.Mock
  let revokeObjectURL: jest.Mock

  beforeEach(() => {
    // jsdom omits the object-URL API used by the blob download path.
    createObjectURL = jest.fn(() => 'blob:mock')
    revokeObjectURL = jest.fn()
    ;(URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL
    ;(URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeObjectURL
    // Run the deferred blob-URL revoke synchronously so its cleanup executes.
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the gateway echoes an X-Request-Id header', () => {
    it('should surface it as gatewayRequestId', async () => {
      mockFetch({ body: makeStreamBody([new Uint8Array([1, 2, 3])]), headers: { 'x-request-id': 'req-1', 'content-length': '3' } })

      const result = await downloadFileWithProgress('https://gw/f.exe', 'f.exe', jest.fn())

      expect(result.gatewayRequestId).toBe('req-1')
      expect(createObjectURL).toHaveBeenCalled()
    })
  })

  describe('when the response omits the X-Request-Id header (CDN-direct)', () => {
    it('should return an undefined gatewayRequestId', async () => {
      mockFetch({ body: makeStreamBody([new Uint8Array([1])]), headers: {} })

      const result = await downloadFileWithProgress('https://gw/f.exe', 'f.exe')

      expect(result.gatewayRequestId).toBeUndefined()
    })
  })

  describe('when chunks flow through the progress stream', () => {
    it('should report cumulative loaded bytes against the total', async () => {
      const onProgress = jest.fn()
      mockFetch({
        body: makeStreamBody([new Uint8Array([1, 2]), new Uint8Array([3, 4])]),
        headers: { 'content-length': '4' }
      })

      await downloadFileWithProgress('https://gw/f.exe', 'f.exe', onProgress)

      expect(onProgress).toHaveBeenCalledWith({ loaded: 2, total: 4 })
      expect(onProgress).toHaveBeenCalledWith({ loaded: 4, total: 4 })
    })
  })

  describe('when the response is not ok', () => {
    it('should throw with the status', async () => {
      mockFetch({ ok: false, status: 503, body: null })

      await expect(downloadFileWithProgress('https://gw/f.exe', 'f.exe')).rejects.toThrow('503')
    })
  })

  describe('when the response has no body', () => {
    it('should throw', async () => {
      mockFetch({ ok: true, body: null })

      await expect(downloadFileWithProgress('https://gw/f.exe', 'f.exe')).rejects.toThrow('null')
    })
  })
})

describe('triggerFileDownload', () => {
  let clickSpy: jest.SpyInstance
  let appendSpy: jest.SpyInstance

  beforeEach(() => {
    // rAF drives the deferred anchor cleanup; run it synchronously.
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    appendSpy = jest.spyOn(document.body, 'appendChild')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when the URL is same-origin', () => {
    it('should set the download attribute to the filename', () => {
      triggerFileDownload(`${window.location.origin}/installer.exe`, 'installer.exe')

      const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement
      expect(anchor.getAttribute('download')).toBe('installer.exe')
      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('when the URL is cross-origin', () => {
    it('should omit the download attribute (Chromium ignores it cross-origin without Content-Disposition)', () => {
      triggerFileDownload('https://cdn.decentraland.org/installer.exe', 'installer.exe')

      const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement
      expect(anchor.hasAttribute('download')).toBe(false)
    })
  })

  describe('when called same-origin without a filename', () => {
    it('should set an empty download attribute', () => {
      triggerFileDownload(`${window.location.origin}/installer.exe`)

      const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement
      expect(anchor.getAttribute('download')).toBe('')
    })
  })

  describe('when the link cannot be parsed as a URL', () => {
    it('should fall through and still dispatch the click without a download attribute', () => {
      triggerFileDownload('http://', 'installer.exe')

      const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement
      expect(anchor.hasAttribute('download')).toBe(false)
      expect(clickSpy).toHaveBeenCalled()
    })
  })
})
