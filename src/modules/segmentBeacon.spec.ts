import { SegmentEvent } from './segment'
import { postSegmentEvent } from './segmentBeacon'
import { SEGMENT_TRACK_URL, getSegmentWriteKey } from './segmentConfig'

jest.mock('./segmentConfig', () => ({
  SEGMENT_TRACK_URL: 'https://api.segment.io/v1/track',
  getSegmentWriteKey: jest.fn()
}))

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

describe('when posting a Segment event via beacon', () => {
  let mockSendBeacon: jest.Mock
  let mockFetch: jest.Mock
  let originalSendBeacon: typeof navigator.sendBeacon
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    mockSendBeacon = jest.fn(() => true)
    mockFetch = jest.fn(() => Promise.resolve({ ok: true }))
    // eslint-disable-next-line @typescript-eslint/unbound-method
    originalSendBeacon = navigator.sendBeacon
    originalFetch = global.fetch
    ;(getSegmentWriteKey as jest.Mock).mockReturnValue('test-key')
    Object.defineProperty(navigator, 'sendBeacon', { value: mockSendBeacon, configurable: true, writable: true })
    Object.defineProperty(global, 'fetch', { value: mockFetch, configurable: true, writable: true })
    Object.defineProperty(document, 'referrer', { value: 'https://decentraland.org/', configurable: true })
    document.title = 'Decentraland Download'
    window.history.replaceState({}, '', '/download?source=landing')
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'sendBeacon', { value: originalSendBeacon, configurable: true, writable: true })
    Object.defineProperty(global, 'fetch', { value: originalFetch, configurable: true, writable: true })
    localStorage.clear()
    jest.resetAllMocks()
  })

  it('should post a text/plain payload with the Segment track envelope and page context', async () => {
    postSegmentEvent(SegmentEvent.CLICK, { place: 'Landing Hero', event: SegmentEvent.DOWNLOAD }, 'anon-1')

    expect(mockSendBeacon).toHaveBeenCalledWith(SEGMENT_TRACK_URL, expect.any(Blob))
    const [, blob] = mockSendBeacon.mock.calls[0] as [string, Blob]
    expect(blob.type).toBe('text/plain')
    const body = JSON.parse(await readBlobText(blob))
    expect(body).toEqual({
      writeKey: 'test-key',
      event: SegmentEvent.CLICK,
      anonymousId: 'anon-1',
      integrations: {},
      properties: { place: 'Landing Hero', event: SegmentEvent.DOWNLOAD },
      messageId: expect.stringMatching(/^dcl-sites-beacon-/),
      timestamp: expect.any(String),
      sentAt: body.timestamp,
      context: {
        page: {
          url: window.location.href,
          path: '/download',
          search: '?source=landing',
          referrer: 'https://decentraland.org/',
          title: 'Decentraland Download'
        },
        userAgent: navigator.userAgent,
        locale: navigator.language,
        timezone: expect.any(String),
        library: {
          name: 'dcl-sites-beacon',
          version: '1.0.0'
        }
      }
    })
    // The /v1/track endpoint infers the message type; the SDK does not send it
    // on this transport, so neither do we.
    expect(body).not.toHaveProperty('type')
  })

  it('should omit userId when the visitor is anonymous', async () => {
    postSegmentEvent(SegmentEvent.CLICK, { place: 'Landing Hero' }, 'anon-1')

    const [, blob] = mockSendBeacon.mock.calls[0] as [string, Blob]
    const body = JSON.parse(await readBlobText(blob))
    expect(body).not.toHaveProperty('userId')
  })

  it('should attach the identified wallet as userId from ajs_user_id', async () => {
    localStorage.setItem('ajs_user_id', JSON.stringify('0x1234567890123456789012345678901234567890'))

    postSegmentEvent(SegmentEvent.DOWNLOAD_STARTED, { place: 'landing-hero' }, 'anon-1')

    const [, blob] = mockSendBeacon.mock.calls[0] as [string, Blob]
    const body = JSON.parse(await readBlobText(blob))
    expect(body.userId).toBe('0x1234567890123456789012345678901234567890')
  })

  it('should attach the low-entropy userAgentData when the browser exposes it', async () => {
    const uaData = { brands: [{ brand: 'Chromium', version: '150' }], mobile: false, platform: 'macOS' }
    const nav = navigator as Navigator & { userAgentData?: typeof uaData }
    const original = nav.userAgentData
    Object.defineProperty(navigator, 'userAgentData', { value: uaData, configurable: true, writable: true })

    try {
      postSegmentEvent(SegmentEvent.CLICK, { place: 'Landing Hero' }, 'anon-1')

      const [, blob] = mockSendBeacon.mock.calls[0] as [string, Blob]
      const body = JSON.parse(await readBlobText(blob))
      expect(body.context.userAgentData).toEqual(uaData)
    } finally {
      Object.defineProperty(navigator, 'userAgentData', { value: original, configurable: true, writable: true })
    }
  })

  it('should omit timezone when the runtime cannot resolve it', async () => {
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('no Intl')
    })

    postSegmentEvent(SegmentEvent.CLICK, { place: 'Landing Hero' }, 'anon-1')

    const [, blob] = mockSendBeacon.mock.calls[0] as [string, Blob]
    const body = JSON.parse(await readBlobText(blob))
    expect(body.context).not.toHaveProperty('timezone')
  })

  it('should not post when the write key is unavailable', () => {
    ;(getSegmentWriteKey as jest.Mock).mockReturnValue('')

    postSegmentEvent(SegmentEvent.CLICK, { place: 'Landing Hero' }, 'anon-1')

    expect(mockSendBeacon).not.toHaveBeenCalled()
  })

  it('should resolve the write key bypassing the analytics-exempt-path gate', () => {
    postSegmentEvent(SegmentEvent.CLICK, { place: 'Landing Hero' }, 'anon-1')

    expect(getSegmentWriteKey).toHaveBeenCalledWith({ bypassExemptPathGate: true })
  })

  it('should fall back to fetch keepalive when sendBeacon rejects the payload', () => {
    mockSendBeacon.mockReturnValue(false)

    postSegmentEvent(SegmentEvent.CLICK, { place: 'Landing Hero' }, 'anon-1')

    expect(mockFetch).toHaveBeenCalledWith(
      SEGMENT_TRACK_URL,
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'text/plain' }
      })
    )
  })

  it('should fall back to fetch keepalive when sendBeacon is unavailable', () => {
    Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true, writable: true })

    postSegmentEvent(SegmentEvent.CLICK, { place: 'Landing Hero' }, 'anon-1')

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should swallow a fetch rejection during unload', async () => {
    mockSendBeacon.mockReturnValue(false)
    mockFetch.mockImplementation(() => Promise.reject(new Error('network')))

    expect(() => postSegmentEvent(SegmentEvent.CLICK, { place: 'Landing Hero' }, 'anon-1')).not.toThrow()

    // Flush microtasks so the `.catch` handler runs and is counted as covered.
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should swallow a synchronous fetch throw during unload', () => {
    mockSendBeacon.mockReturnValue(false)
    mockFetch.mockImplementation(() => {
      throw new Error('sync fetch boom')
    })

    expect(() => postSegmentEvent(SegmentEvent.CLICK, { place: 'Landing Hero' }, 'anon-1')).not.toThrow()
  })
})
