import { act, renderHook } from '@testing-library/react'
import { SegmentEvent } from '../modules/segment'
import { useDownloadEventTrack } from './useDownloadEventTrack'

let mockDeferredTrack: jest.Mock
const mockEnqueueDownloadBeacon = jest.fn()
let eventIdCounter: number

jest.mock('./useDeferredTrack', () => ({
  useDeferredTrack: () => mockDeferredTrack
}))

jest.mock('../modules/downloadBeacon', () => ({
  enqueueDownloadBeacon: (...args: unknown[]) => mockEnqueueDownloadBeacon(...args),
  generateDownloadEventId: () => `event-id-${eventIdCounter++}`
}))

describe('useDownloadEventTrack', () => {
  beforeEach(() => {
    mockDeferredTrack = jest.fn()
    eventIdCounter = 0
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when an event is tracked', () => {
    it('should fire the analytics.js path with the download_event_id appended', () => {
      const { result } = renderHook(() => useDownloadEventTrack())

      act(() => {
        result.current(SegmentEvent.DOWNLOAD_STARTED, { os: 'Windows', anon_user_id: 'anon-1' })
      })

      expect(mockDeferredTrack).toHaveBeenCalledWith(
        SegmentEvent.DOWNLOAD_STARTED,
        expect.objectContaining({
          os: 'Windows',

          anon_user_id: 'anon-1',

          download_event_id: 'event-id-0'
        })
      )
    })

    it('should enqueue a beacon with the same event id, properties and anonymousId', () => {
      const { result } = renderHook(() => useDownloadEventTrack())

      act(() => {
        result.current(SegmentEvent.DOWNLOAD_SUCCESS, { os: 'macOS', anon_user_id: 'anon-2' })
      })

      expect(mockEnqueueDownloadBeacon).toHaveBeenCalledWith({
        event: SegmentEvent.DOWNLOAD_SUCCESS,
        properties: expect.objectContaining({
          os: 'macOS',

          anon_user_id: 'anon-2',

          download_event_id: 'event-id-0'
        }),
        anonymousId: 'anon-2',
        eventId: 'event-id-0'
      })
    })

    it('should pass undefined anonymousId when anon_user_id is absent', () => {
      const { result } = renderHook(() => useDownloadEventTrack())

      act(() => {
        result.current(SegmentEvent.DOWNLOAD_FAILED, { os: 'Windows' })
      })

      expect(mockEnqueueDownloadBeacon).toHaveBeenCalledWith(expect.objectContaining({ anonymousId: undefined }))
    })

    it('should mint a distinct event id per call', () => {
      const { result } = renderHook(() => useDownloadEventTrack())

      act(() => {
        result.current(SegmentEvent.DOWNLOAD_STARTED, {})
        result.current(SegmentEvent.DOWNLOAD_SUCCESS, {})
      })

      const ids = mockEnqueueDownloadBeacon.mock.calls.map(([item]) => (item as { eventId: string }).eventId)
      expect(ids).toEqual(['event-id-0', 'event-id-1'])
    })
  })
})
