import { OperativeSystem } from '../types/download.types'
import { sendDownloadFunnelExit } from './downloadFunnelExit'
import { createDownloadTracker } from './downloadTracking'
import { resolveGatewayAnonUserId } from './downloadWithIdentity'
import { UUID_V1_5_RE } from './segmentAnonymousId.helpers'

jest.mock('@dcl/hooks', () => ({
  getAnalytics: () => ({ instance: { user: () => ({ anonymousId: () => 'custom-sdk-id' }) } })
}))
// CDN and installer retrieval are outside this identity/event integration.
jest.mock('./url', () => ({}))
jest.mock('../config/env', () => ({ getEnv: (key: string) => (key === 'SEGMENT_KEY' ? 'test-key' : '') }))
jest.mock('../utils/isAnalyticsExemptPath', () => ({ isAnalyticsExemptPath: () => false }))

interface CapturedEvent {
  event: string
  anonymousId: string
  properties: { anon_user_id?: string }
}

describe('when a custom SDK identity downloads through the gateway and leaves', () => {
  let originalFetch: typeof fetch
  let originalSendBeacon: typeof navigator.sendBeacon
  let mockFetch: jest.Mock
  let attributionId: string | undefined
  let events: CapturedEvent[]

  beforeEach(() => {
    localStorage.clear()
    document.cookie = 'ajs_anonymous_id=; path=/; max-age=0'
    originalFetch = global.fetch
    // eslint-disable-next-line @typescript-eslint/unbound-method
    originalSendBeacon = navigator.sendBeacon
    mockFetch = jest.fn().mockResolvedValue({ ok: true })
    global.fetch = mockFetch
    Object.defineProperty(navigator, 'sendBeacon', { value: () => false, configurable: true })
    attributionId = resolveGatewayAnonUserId(undefined, { position: '10,20' })
    createDownloadTracker({
      href: 'https://gateway.example/installer',
      os: OperativeSystem.WINDOWS,
      arch: 'amd64',
      anon_user_id: attributionId,
      auth_state: 'anonymous',
      revisit: 0
    }).started()
    sendDownloadFunnelExit({
      os: 'Windows',
      arch: 'amd64',
      place: 'landing-hero',
      anonUserId: attributionId,
      startedFired: true,
      successFired: false,
      failedFired: false,
      msOnPage: 10,
      revisit: 0,
      authState: 'anonymous'
    })
    events = mockFetch.mock.calls.map(([, init]: [string, RequestInit]) => JSON.parse(String(init.body)) as CapturedEvent)
  })

  afterEach(() => {
    global.fetch = originalFetch
    Object.defineProperty(navigator, 'sendBeacon', { value: originalSendBeacon, configurable: true })
    localStorage.clear()
    document.cookie = 'ajs_anonymous_id=; path=/; max-age=0'
    jest.restoreAllMocks()
  })

  it('should retain the custom Segment identity in both event envelopes', () => {
    expect(events.map(event => [event.event, event.anonymousId])).toEqual([
      ['download_started', 'custom-sdk-id'],
      ['download_funnel_exit', 'custom-sdk-id']
    ])
    expect(localStorage.getItem('ajs_anonymous_id')).toBe(JSON.stringify('custom-sdk-id'))
  })

  it('should reuse one supported gateway UUID as attribution on both events and retries', () => {
    expect(attributionId).toMatch(UUID_V1_5_RE)
    expect(events.map(event => event.properties.anon_user_id)).toEqual([attributionId, attributionId])
    expect(resolveGatewayAnonUserId(undefined, { realm: 'world.dcl.eth' })).toBe(attributionId)
  })
})
