import { type Architecture, OperativeSystem } from '../types/download.types'
import { createDownloadTracker } from './downloadTracking'
import { DownloadPlace, SegmentEvent } from './segment'
import type { DownloadTrackFn, DownloadTrackerContext } from './downloadTracking.types'

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
  let track: jest.MockedFunction<DownloadTrackFn>
  let nowSpy: jest.SpyInstance

  beforeEach(() => {
    track = jest.fn()
  })

  afterEach(() => {
    nowSpy?.mockRestore()
    jest.resetAllMocks()
  })

  describe('when started() is called', () => {
    it('should fire DOWNLOAD_STARTED with the base context plus started_at', () => {
      nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
      const tracker = createDownloadTracker(track, buildContext())

      tracker.started()

      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith(SegmentEvent.DOWNLOAD_STARTED, {
        place: DownloadPlace.LANDING_HERO,
        href: 'https://gateway.decentraland.org/launcher/Install-Decentraland.exe?id=signed',
        os: OperativeSystem.WINDOWS,
        arch: 'amd64',
        anon_user_id: 'anon-abc',
        auth_state: 'anonymous',
        revisit: 0,
        started_at: 1_700_000_000_000
      })
    })

    it('should omit place from the payload when it is UNKNOWN to keep analytics cardinality clean', () => {
      const tracker = createDownloadTracker(track, buildContext({ place: DownloadPlace.UNKNOWN }))

      tracker.started()

      const payload = track.mock.calls[0][1]
      expect(payload).not.toHaveProperty('place')
    })

    it('should omit place entirely when it is undefined', () => {
      const tracker = createDownloadTracker(track, buildContext({ place: undefined }))

      tracker.started()

      const payload = track.mock.calls[0][1]
      expect(payload).not.toHaveProperty('place')
    })

    it('should omit anon_user_id when it is undefined so the field is not nulled in the warehouse', () => {
      const tracker = createDownloadTracker(track, buildContext({ anon_user_id: undefined }))

      tracker.started()

      const payload = track.mock.calls[0][1]
      expect(payload).not.toHaveProperty('anon_user_id')
    })
  })

  describe('when success() is called after started()', () => {
    it('should fire DOWNLOAD_SUCCESS with filename, succeeded_at, and duration_ms relative to the started_at', () => {
      nowSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(1_700_000_000_000).mockReturnValueOnce(1_700_000_005_500)
      const tracker = createDownloadTracker(track, buildContext())

      tracker.started()
      tracker.success('Install-Decentraland.exe')

      expect(track).toHaveBeenLastCalledWith(SegmentEvent.DOWNLOAD_SUCCESS, {
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
        duration_ms: 5_500
      })
    })

    it('should include bytes_transferred when provided', () => {
      const tracker = createDownloadTracker(track, buildContext())

      tracker.started()
      tracker.success('Install-Decentraland.exe', 4 * 1024 * 1024)

      expect(track.mock.calls[1][1]).toMatchObject({ bytes_transferred: 4 * 1024 * 1024 })
    })

    it('should omit bytes_transferred when undefined (macOS / fallback paths)', () => {
      const tracker = createDownloadTracker(track, buildContext({ os: OperativeSystem.MACOS }))

      tracker.started()
      tracker.success('Decentraland.dmg')

      expect(track.mock.calls[1][1]).not.toHaveProperty('bytes_transferred')
    })
  })

  describe('when failed() is called after started()', () => {
    it('should fire DOWNLOAD_FAILED with reason, failed_at, and duration_ms relative to started_at', () => {
      nowSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(1_700_000_000_000).mockReturnValueOnce(1_700_000_002_000)
      const tracker = createDownloadTracker(track, buildContext())

      tracker.started()
      tracker.failed('Network error: connection refused')

      expect(track).toHaveBeenLastCalledWith(SegmentEvent.DOWNLOAD_FAILED, {
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
        duration_ms: 2_000
      })
    })
  })

  describe('when success() is called WITHOUT a prior started() (degenerate)', () => {
    it('should still fire DOWNLOAD_SUCCESS with started_at equal to succeeded_at and duration_ms = 0', () => {
      nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_003_000)
      const tracker = createDownloadTracker(track, buildContext())

      tracker.success('Install-Decentraland.exe')

      expect(track.mock.calls[0][1]).toMatchObject({
        started_at: 1_700_000_003_000,
        succeeded_at: 1_700_000_003_000,
        duration_ms: 0
      })
    })
  })
})
