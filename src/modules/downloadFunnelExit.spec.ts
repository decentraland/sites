import { sendDownloadFunnelExit } from './downloadFunnelExit'
import { SEGMENT_TRACK_URL } from './segmentConfig'
import type { DownloadFunnelExitData } from './downloadFunnelExit.types'

let mockWriteKey: string
let mockExempt: boolean

jest.mock('../config/env', () => ({
  getEnv: () => mockWriteKey
}))

jest.mock('../utils/isAnalyticsExemptPath', () => ({
  isAnalyticsExemptPath: () => mockExempt
}))

const sampleData = (overrides: Partial<DownloadFunnelExitData> = {}): DownloadFunnelExitData => ({
  os: 'Windows',
  arch: 'amd64',
  place: 'landing-hero',
  anonUserId: 'anon-1',
  startedFired: true,
  successFired: false,
  failedFired: false,
  msOnPage: 1234,
  revisit: 0,
  authState: 'anonymous',
  ...overrides
})

describe('downloadFunnelExit', () => {
  let mockFetch: jest.Mock
  let mockSendBeacon: jest.Mock
  const originalFetch = global.fetch
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originalSendBeacon = navigator.sendBeacon

  beforeEach(() => {
    mockWriteKey = 'wk-test'
    mockExempt = false
    mockFetch = jest.fn(() => Promise.resolve({ ok: true }))
    mockSendBeacon = jest.fn(() => true)
    ;(global as unknown as { fetch: jest.Mock }).fetch = mockFetch
    Object.defineProperty(navigator, 'sendBeacon', { value: mockSendBeacon, configurable: true, writable: true })
  })

  afterEach(() => {
    jest.resetAllMocks()
    ;(global as unknown as { fetch?: typeof fetch }).fetch = originalFetch
    Object.defineProperty(navigator, 'sendBeacon', { value: originalSendBeacon, configurable: true, writable: true })
  })

  it('should send the download_funnel_exit event via sendBeacon with the funnel snapshot', () => {
    sendDownloadFunnelExit(sampleData({ successFired: true }))

    expect(mockSendBeacon).toHaveBeenCalledTimes(1)
    const [url, blob] = mockSendBeacon.mock.calls[0]
    expect(url).toBe(SEGMENT_TRACK_URL)
    expect(blob).toBeInstanceOf(Blob)
    expect((blob as Blob).type).toBe('text/plain')
  })

  it('should not call fetch when sendBeacon accepts the payload', () => {
    sendDownloadFunnelExit(sampleData())
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should encode the event name, flags and identity in the body', () => {
    // Read the body via the fetch fallback (a plain string) — jsdom's Blob has
    // no text(); the payload is byte-identical on both transports.
    mockSendBeacon.mockReturnValue(false)
    sendDownloadFunnelExit(sampleData({ startedFired: true, successFired: true, failedFired: false }))

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)

    expect(body).toEqual(
      expect.objectContaining({
        writeKey: 'wk-test',
        event: 'download_funnel_exit',
        anonymousId: 'anon-1'
      })
    )
    expect(body.properties).toEqual(
      expect.objectContaining({
        os: 'Windows',
        arch: 'amd64',
        place: 'landing-hero',
        download_started_fired: true,
        download_success_fired: true,
        download_failed_fired: false,
        ms_on_page: 1234,
        revisit: 0,
        auth_state: 'anonymous',
        anon_user_id: 'anon-1'
      })
    )
  })

  it('should fall back to fetch keepalive when sendBeacon rejects the payload', () => {
    mockSendBeacon.mockReturnValue(false)
    sendDownloadFunnelExit(sampleData())

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe(SEGMENT_TRACK_URL)
    expect(init).toEqual(expect.objectContaining({ method: 'POST', keepalive: true, mode: 'cors', credentials: 'omit' }))
  })

  it('should send the fetch fallback as a CORS-simple text/plain request (no preflight)', () => {
    // An application/json content-type would make the fallback a non-simple
    // request and trigger an OPTIONS preflight that drops it on unload — the
    // exact cohort this diagnostic exists to capture. Lock it to text/plain.
    mockSendBeacon.mockReturnValue(false)
    sendDownloadFunnelExit(sampleData())

    const init = mockFetch.mock.calls[0][1]
    expect(init.headers).toEqual({ 'Content-Type': 'text/plain' })
  })

  it('should fall back to fetch when sendBeacon is unavailable', () => {
    Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true, writable: true })
    sendDownloadFunnelExit(sampleData())
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should swallow a rejected fetch fallback', async () => {
    mockSendBeacon.mockReturnValue(false)
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('network down')))

    expect(() => sendDownloadFunnelExit(sampleData())).not.toThrow()
    await Promise.resolve()
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should mint a fallback anonymousId and omit anon_user_id when none is provided', () => {
    mockSendBeacon.mockReturnValue(false)
    sendDownloadFunnelExit(sampleData({ anonUserId: undefined }))

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)

    expect(typeof body.anonymousId).toBe('string')
    expect(body.anonymousId.length).toBeGreaterThan(0)
    expect(body.properties.anon_user_id).toBeUndefined()
  })

  it('should mint the fallback anonymousId from crypto.randomUUID when available', () => {
    const cryptoObj = globalThis.crypto as { randomUUID?: () => string }
    const originalRandomUUID = cryptoObj.randomUUID
    Object.defineProperty(cryptoObj, 'randomUUID', {
      value: () => 'uuid-from-crypto',
      configurable: true,
      writable: true
    })

    try {
      mockSendBeacon.mockReturnValue(false)
      sendDownloadFunnelExit(sampleData({ anonUserId: undefined }))

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.anonymousId).toBe('uuid-from-crypto')
    } finally {
      Object.defineProperty(cryptoObj, 'randomUUID', {
        value: originalRandomUUID,
        configurable: true,
        writable: true
      })
    }
  })

  it('should mint a UUID fallback anonymousId when crypto.randomUUID is unavailable', () => {
    const cryptoObj = globalThis.crypto as { randomUUID?: () => string }
    const originalRandomUUID = cryptoObj.randomUUID
    Object.defineProperty(cryptoObj, 'randomUUID', { value: undefined, configurable: true, writable: true })

    try {
      mockSendBeacon.mockReturnValue(false)
      sendDownloadFunnelExit(sampleData({ anonUserId: undefined }))

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.anonymousId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    } finally {
      Object.defineProperty(cryptoObj, 'randomUUID', {
        value: originalRandomUUID,
        configurable: true,
        writable: true
      })
    }
  })

  it('should transmit on an analytics-exempt path (conversion beacons bypass the exempt gate)', () => {
    mockExempt = true
    sendDownloadFunnelExit(sampleData())
    expect(mockSendBeacon).toHaveBeenCalledWith(SEGMENT_TRACK_URL, expect.any(Blob))
  })

  it('should not transmit when no write key is configured', () => {
    mockWriteKey = ''
    sendDownloadFunnelExit(sampleData())
    expect(mockSendBeacon).not.toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should include click_id when the exit data carries one', () => {
    mockSendBeacon.mockReturnValue(false)
    sendDownloadFunnelExit(sampleData({ clickId: 'click-abc' }))

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.properties).toEqual(expect.objectContaining({ click_id: 'click-abc' }))
  })

  it('should omit click_id when the exit data does not carry one', () => {
    mockSendBeacon.mockReturnValue(false)
    sendDownloadFunnelExit(sampleData())

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.properties).not.toHaveProperty('click_id')
  })
})
