import { type Architecture, OperativeSystem } from '../types/download.types'
import { createDownloadTracker } from './downloadTracking'
import { DownloadPlace, SegmentEvent } from './segment'
import type { DownloadTrackerContext } from './downloadTracking.types'

const mockEnsureSegmentAnonymousId = jest.fn(() => 'anon-fixed')

jest.mock('./segmentAnonymousId', () => ({ ensureSegmentAnonymousId: () => mockEnsureSegmentAnonymousId() }))

jest.mock('../config/env', () => ({
  getEnv: () => 'wk-test'
}))

jest.mock('../utils/isAnalyticsExemptPath', () => ({
  isAnalyticsExemptPath: () => false
}))

const buildContext = (overrides: Partial<DownloadTrackerContext> = {}): DownloadTrackerContext => ({
  place: DownloadPlace.LANDING_HERO,
  href: 'https://gateway.decentraland.org/launcher/Install-Decentraland.exe?id=signed',
  os: OperativeSystem.WINDOWS,
  arch: 'amd64' as Architecture,
  anon_user_id: 'anon-abc',
  auth_state: 'anonymous',
  revisit: 0,
  ...overrides
})

describe('createDownloadTracker', () => {
  let mockFetch: jest.Mock
  let mockSendBeacon: jest.Mock
  let nowSpy: jest.SpyInstance
  const originalFetch = global.fetch
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originalSendBeacon = navigator.sendBeacon

  const readLastPayload = (): Record<string, unknown> => {
    const body = JSON.parse(mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1].body)
    return body.properties
  }

  const readLastBody = (): Record<string, unknown> => JSON.parse(mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1].body)

  beforeEach(() => {
    mockEnsureSegmentAnonymousId.mockReturnValue('anon-fixed')
    mockFetch = jest.fn(() => Promise.resolve({ ok: true }))
    // Force the fetch fallback so assertions read a plain-string body — jsdom's
    // Blob has no text(), and the payload is byte-identical on both transports
    // (mirrors downloadFunnelExit.spec.ts's approach).
    mockSendBeacon = jest.fn(() => false)
    ;(global as unknown as { fetch: jest.Mock }).fetch = mockFetch
    Object.defineProperty(navigator, 'sendBeacon', { value: mockSendBeacon, configurable: true, writable: true })
  })

  afterEach(() => {
    nowSpy?.mockRestore()
    jest.resetAllMocks()
    ;(global as unknown as { fetch?: typeof fetch }).fetch = originalFetch
    Object.defineProperty(navigator, 'sendBeacon', { value: originalSendBeacon, configurable: true, writable: true })
  })

  describe('when started() is called', () => {
    it('should fire DOWNLOAD_STARTED with the base context plus started_at', () => {
      nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
      const tracker = createDownloadTracker(buildContext())

      tracker.started()

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const body = readLastBody()
      expect(body).toEqual(
        expect.objectContaining({
          event: SegmentEvent.DOWNLOAD_STARTED,
          anonymousId: 'anon-fixed'
        })
      )
      expect(body.properties).toEqual({
        place: DownloadPlace.LANDING_HERO,
        href: 'https://gateway.decentraland.org/launcher/Install-Decentraland.exe?id=signed',
        os: OperativeSystem.WINDOWS,
        arch: 'amd64',
        anon_user_id: 'anon-abc',
        auth_state: 'anonymous',
        revisit: 0,
        started_at: 1_700_000_000_000,
        track_called_at: 1_700_000_000_000,
        track_delivered_at: 1_700_000_000_000,
        track_deferred: true
      })
    })

    it('should omit place from the payload when it is UNKNOWN to keep analytics cardinality clean', () => {
      const tracker = createDownloadTracker(buildContext({ place: DownloadPlace.UNKNOWN }))

      tracker.started()

      expect(readLastPayload()).not.toHaveProperty('place')
    })

    it('should omit place entirely when it is undefined', () => {
      const tracker = createDownloadTracker(buildContext({ place: undefined }))

      tracker.started()

      expect(readLastPayload()).not.toHaveProperty('place')
    })

    it('should omit anon_user_id when it is undefined so the field is not nulled in the warehouse', () => {
      const tracker = createDownloadTracker(buildContext({ anon_user_id: undefined }))

      tracker.started()

      expect(readLastPayload()).not.toHaveProperty('anon_user_id')
    })
  })

  describe('when success() is called after started()', () => {
    it('should fire DOWNLOAD_SUCCESS with filename, succeeded_at, and duration_ms relative to the started_at', () => {
      nowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(1_700_000_000_000)
        .mockReturnValueOnce(1_700_000_000_000)
        .mockReturnValueOnce(1_700_000_005_500)
        .mockReturnValueOnce(1_700_000_005_500)
      const tracker = createDownloadTracker(buildContext())

      tracker.started()
      tracker.success('Install-Decentraland.exe')

      const body = readLastBody()
      expect(body.event).toBe(SegmentEvent.DOWNLOAD_SUCCESS)
      expect(body.properties).toEqual({
        place: DownloadPlace.LANDING_HERO,
        href: 'https://gateway.decentraland.org/launcher/Install-Decentraland.exe?id=signed',
        os: OperativeSystem.WINDOWS,
        arch: 'amd64',
        anon_user_id: 'anon-abc',
        auth_state: 'anonymous',
        revisit: 0,
        filename: 'Install-Decentraland.exe',
        started_at: 1_700_000_000_000,
        succeeded_at: 1_700_000_005_500,
        duration_ms: 5_500,
        track_called_at: 1_700_000_005_500,
        track_delivered_at: 1_700_000_005_500,
        track_deferred: true
      })
    })

    it('should include bytes_transferred when provided', () => {
      const tracker = createDownloadTracker(buildContext())

      tracker.started()
      tracker.success('Install-Decentraland.exe', 4 * 1024 * 1024)

      expect(readLastPayload()).toMatchObject({ bytes_transferred: 4 * 1024 * 1024 })
    })

    it('should omit bytes_transferred when undefined (macOS / fallback paths)', () => {
      const tracker = createDownloadTracker(buildContext({ os: OperativeSystem.MACOS }))

      tracker.started()
      tracker.success('Decentraland.dmg')

      expect(readLastPayload()).not.toHaveProperty('bytes_transferred')
    })
  })

  describe('when failed() is called after started()', () => {
    it('should fire DOWNLOAD_FAILED with reason, failed_at, and duration_ms relative to started_at', () => {
      nowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(1_700_000_000_000)
        .mockReturnValueOnce(1_700_000_000_000)
        .mockReturnValueOnce(1_700_000_002_000)
        .mockReturnValueOnce(1_700_000_002_000)
      const tracker = createDownloadTracker(buildContext())

      tracker.started()
      tracker.failed('Network error: connection refused')

      const body = readLastBody()
      expect(body.event).toBe(SegmentEvent.DOWNLOAD_FAILED)
      expect(body.properties).toEqual({
        place: DownloadPlace.LANDING_HERO,
        href: 'https://gateway.decentraland.org/launcher/Install-Decentraland.exe?id=signed',
        os: OperativeSystem.WINDOWS,
        arch: 'amd64',
        anon_user_id: 'anon-abc',
        auth_state: 'anonymous',
        revisit: 0,
        reason: 'Network error: connection refused',
        started_at: 1_700_000_000_000,
        failed_at: 1_700_000_002_000,
        duration_ms: 2_000,
        track_called_at: 1_700_000_002_000,
        track_delivered_at: 1_700_000_002_000,
        track_deferred: true
      })
    })
  })

  describe('when one tracker emits multiple events', () => {
    beforeEach(() => {
      mockEnsureSegmentAnonymousId.mockReturnValueOnce('anon-tracker')
      const tracker = createDownloadTracker(buildContext())

      tracker.started()
      tracker.success('Install-Decentraland.exe')
      tracker.failed('Network error: connection refused')
    })

    it('should resolve the anonymousId once for the tracker instance', () => {
      expect(mockEnsureSegmentAnonymousId).toHaveBeenCalledTimes(1)
    })

    it('should reuse the same anonymousId for started, success, and failed', () => {
      expect(mockFetch.mock.calls.map(([, init]) => JSON.parse(init.body).anonymousId)).toEqual([
        'anon-tracker',
        'anon-tracker',
        'anon-tracker'
      ])
    })
  })

  describe('when success() is called WITHOUT a prior started() (degenerate)', () => {
    it('should still fire DOWNLOAD_SUCCESS with started_at equal to succeeded_at and duration_ms = 0', () => {
      nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_003_000)
      const tracker = createDownloadTracker(buildContext())

      tracker.success('Install-Decentraland.exe')

      expect(readLastPayload()).toMatchObject({
        started_at: 1_700_000_003_000,
        succeeded_at: 1_700_000_003_000,
        duration_ms: 0
      })
    })
  })
})
