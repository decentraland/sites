import { SEGMENT_TRACK_URL, enqueueDownloadBeacon, flushDownloadBeacons, generateDownloadEventId } from './downloadBeacon'
import type { DownloadBeaconEvent } from './downloadBeacon.types'
// Imported once (NOT via resetModules): the module attaches module-level
// `pagehide` / visibility listeners to the persistent jsdom window, so
// re-requiring would accumulate stale listeners that fire on later tests.

let mockWriteKey: string
let mockExempt: boolean
let visibilityListener: ((visible: boolean) => void) | undefined
const mockUnsubscribe = jest.fn()

jest.mock('../config/env', () => ({
  getEnv: () => mockWriteKey
}))

jest.mock('../utils/isAnalyticsExemptPath', () => ({
  isAnalyticsExemptPath: () => mockExempt
}))

jest.mock('../utils/documentVisibility', () => ({
  // Captured once, on the first enqueue across the whole file.
  subscribeVisibility: (listener: (visible: boolean) => void) => {
    visibilityListener = listener
    return mockUnsubscribe
  }
}))

const sampleEvent = (overrides: Partial<DownloadBeaconEvent> = {}): DownloadBeaconEvent => ({
  event: 'download_started',
  properties: { os: 'Windows', download_event_id: 'evt-1' },
  anonymousId: 'anon-1',
  eventId: 'evt-1',
  ...overrides
})

describe('downloadBeacon', () => {
  let mockFetch: jest.Mock
  let mockSendBeacon: jest.Mock
  const originalFetch = global.fetch
  // Snapshotted only to restore via defineProperty, never invoked here.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originalSendBeacon = navigator.sendBeacon

  beforeEach(() => {
    mockWriteKey = 'wk-test'
    mockExempt = false

    mockFetch = jest.fn(() => Promise.resolve({ ok: true }))
    mockSendBeacon = jest.fn(() => true)
    ;(global as unknown as { fetch: jest.Mock }).fetch = mockFetch
    Object.defineProperty(navigator, 'sendBeacon', { value: mockSendBeacon, configurable: true, writable: true })

    // Drain anything a prior test left queued (e.g. the "becomes visible"
    // case enqueues without flushing) so per-test call counts start clean.
    flushDownloadBeacons()
    mockFetch.mockClear()
    mockSendBeacon.mockClear()
  })

  afterEach(() => {
    // Restore process-level globals so the deleted/replaced fetch and
    // sendBeacon can't leak into other test files in the same worker.
    ;(global as unknown as { fetch?: typeof fetch }).fetch = originalFetch
    Object.defineProperty(navigator, 'sendBeacon', { value: originalSendBeacon, configurable: true, writable: true })
  })

  describe('generateDownloadEventId', () => {
    it('should mint unique ids', () => {
      const a = generateDownloadEventId()
      const b = generateDownloadEventId()
      expect(a).toEqual(expect.any(String))
      expect(a).not.toEqual(b)
    })

    it('should use crypto.randomUUID when available', () => {
      const cryptoRef = globalThis.crypto as unknown as { randomUUID?: () => string }
      const original = cryptoRef.randomUUID
      cryptoRef.randomUUID = () => 'uuid-from-crypto'
      try {
        expect(generateDownloadEventId()).toBe('uuid-from-crypto')
      } finally {
        if (original) cryptoRef.randomUUID = original
        else delete cryptoRef.randomUUID
      }
    })
  })

  describe('flushDownloadBeacons', () => {
    it('should be a no-op when nothing is queued', () => {
      flushDownloadBeacons()
      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockSendBeacon).not.toHaveBeenCalled()
    })

    it('should transmit queued events via fetch keepalive', () => {
      enqueueDownloadBeacon(sampleEvent())
      flushDownloadBeacons()

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, init] = mockFetch.mock.calls[0]
      expect(url).toBe(SEGMENT_TRACK_URL)
      expect(init).toEqual(expect.objectContaining({ method: 'POST', keepalive: true }))

      const body = JSON.parse(init.body)
      expect(body).toEqual(
        expect.objectContaining({
          writeKey: 'wk-test',
          event: 'download_started',
          anonymousId: 'anon-1',
          messageId: 'evt-1'
        })
      )
      expect(body.properties.delivery_transport).toBe('beacon')
      expect(body.properties.download_event_id).toBe('evt-1')
    })

    it('should drain the queue so a second flush sends nothing', () => {
      enqueueDownloadBeacon(sampleEvent())
      flushDownloadBeacons()
      mockFetch.mockClear()

      flushDownloadBeacons()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should fall back to anonymousId from eventId when none is provided', () => {
      enqueueDownloadBeacon(sampleEvent({ anonymousId: undefined, eventId: 'fallback-id' }))
      flushDownloadBeacons()

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.anonymousId).toBe('fallback-id')
    })

    it('should fall back to sendBeacon when fetch is unavailable', () => {
      delete (global as unknown as { fetch?: unknown }).fetch

      enqueueDownloadBeacon(sampleEvent())
      flushDownloadBeacons()

      expect(mockSendBeacon).toHaveBeenCalledTimes(1)
      const [url, blob] = mockSendBeacon.mock.calls[0]
      expect(url).toBe(SEGMENT_TRACK_URL)
      expect(blob).toBeInstanceOf(Blob)
      expect((blob as Blob).type).toBe('text/plain')
    })

    it('should swallow a rejected fetch so the failure never surfaces', async () => {
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('network down')))
      enqueueDownloadBeacon(sampleEvent())

      expect(() => flushDownloadBeacons()).not.toThrow()
      // Let the rejected promise's .catch handler run.
      await Promise.resolve()
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should drain but not transmit when there is no write key', () => {
      mockExempt = true // forces getWriteKey() to return ''

      enqueueDownloadBeacon(sampleEvent())
      flushDownloadBeacons()
      expect(mockFetch).not.toHaveBeenCalled()

      // Queue was drained, so flipping the key back and flushing sends nothing.
      mockExempt = false
      flushDownloadBeacons()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('listeners', () => {
    it('should flush when the page becomes hidden', () => {
      enqueueDownloadBeacon(sampleEvent())
      expect(visibilityListener).toBeDefined()

      visibilityListener?.(false)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should not flush when the page becomes visible', () => {
      enqueueDownloadBeacon(sampleEvent())
      visibilityListener?.(true)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should flush on the pagehide event', () => {
      enqueueDownloadBeacon(sampleEvent())
      window.dispatchEvent(new Event('pagehide'))
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should drain every queued event on a single hide', () => {
      enqueueDownloadBeacon(sampleEvent())
      enqueueDownloadBeacon(sampleEvent({ eventId: 'evt-2' }))
      visibilityListener?.(false)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
