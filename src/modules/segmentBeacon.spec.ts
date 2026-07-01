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
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'sendBeacon', { value: originalSendBeacon, configurable: true, writable: true })
    Object.defineProperty(global, 'fetch', { value: originalFetch, configurable: true, writable: true })
    jest.resetAllMocks()
  })

  it('should post a text/plain payload with the event identity and properties', async () => {
    postSegmentEvent(SegmentEvent.CLICK, { place: 'Landing Hero', event: SegmentEvent.DOWNLOAD }, 'anon-1')

    expect(mockSendBeacon).toHaveBeenCalledWith(SEGMENT_TRACK_URL, expect.any(Blob))
    const [, blob] = mockSendBeacon.mock.calls[0] as [string, Blob]
    expect(blob.type).toBe('text/plain')
    await expect(readBlobText(blob).then(JSON.parse)).resolves.toEqual({
      writeKey: 'test-key',
      event: SegmentEvent.CLICK,
      anonymousId: 'anon-1',
      properties: { place: 'Landing Hero', event: SegmentEvent.DOWNLOAD }
    })
  })

  it('should not post when the write key is unavailable', () => {
    ;(getSegmentWriteKey as jest.Mock).mockReturnValue('')

    postSegmentEvent(SegmentEvent.CLICK, { place: 'Landing Hero' }, 'anon-1')

    expect(mockSendBeacon).not.toHaveBeenCalled()
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
