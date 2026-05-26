import { act, renderHook } from '@testing-library/react'
import { SegmentEvent } from '../modules/segment'
import { useDeferredTrack } from './useDeferredTrack'

let mockTrack: jest.Mock
let mockIsInitialized: boolean

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ isInitialized: mockIsInitialized, track: mockTrack })
}))

describe('useDeferredTrack', () => {
  beforeEach(() => {
    mockTrack = jest.fn()
    mockIsInitialized = true
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when Segment is initialized at mount', () => {
    it('should fire calls synchronously without queueing', () => {
      const { result } = renderHook(() => useDeferredTrack())

      act(() => {
        result.current(SegmentEvent.DOWNLOAD_STARTED, { foo: 'bar' })
      })

      expect(mockTrack).toHaveBeenCalledTimes(1)
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.DOWNLOAD_STARTED, expect.objectContaining({ foo: 'bar', track_deferred: false }))
    })

    it('should attach track_called_at and track_delivered_at observability fields', () => {
      const { result } = renderHook(() => useDeferredTrack())

      act(() => {
        result.current(SegmentEvent.DOWNLOAD_STARTED, { foo: 'bar' })
      })

      const payload = mockTrack.mock.calls[0][1]
      expect(payload).toHaveProperty('track_called_at', expect.any(Number))
      expect(payload).toHaveProperty('track_delivered_at', expect.any(Number))
    })
  })

  describe('when Segment is NOT initialized at mount', () => {
    beforeEach(() => {
      mockIsInitialized = false
    })

    it('should not fire the call immediately', () => {
      const { result } = renderHook(() => useDeferredTrack())

      act(() => {
        result.current(SegmentEvent.DOWNLOAD_STARTED, { foo: 'bar' })
      })

      expect(mockTrack).not.toHaveBeenCalled()
    })

    it('should drain queued calls when isInitialized flips to true and mark them as deferred', () => {
      const { result, rerender } = renderHook(() => useDeferredTrack())

      act(() => {
        result.current(SegmentEvent.DOWNLOAD_STARTED, { foo: 'bar' })
        result.current(SegmentEvent.DOWNLOAD_SUCCESS, { filename: 'X.exe' })
      })

      expect(mockTrack).not.toHaveBeenCalled()

      mockIsInitialized = true
      rerender()

      expect(mockTrack).toHaveBeenCalledTimes(2)
      expect(mockTrack).toHaveBeenNthCalledWith(
        1,
        SegmentEvent.DOWNLOAD_STARTED,
        expect.objectContaining({ foo: 'bar', track_deferred: true })
      )
      expect(mockTrack).toHaveBeenNthCalledWith(
        2,
        SegmentEvent.DOWNLOAD_SUCCESS,
        expect.objectContaining({ filename: 'X.exe', track_deferred: true })
      )
    })

    it('should drain the queue in enqueue order so _STARTED always precedes _SUCCESS / _FAILED', () => {
      const { result, rerender } = renderHook(() => useDeferredTrack())

      act(() => {
        result.current(SegmentEvent.DOWNLOAD_STARTED, { n: 1 })
        result.current(SegmentEvent.DOWNLOAD_STARTED, { n: 2 })
        result.current(SegmentEvent.DOWNLOAD_SUCCESS, { n: 3 })
      })

      mockIsInitialized = true
      rerender()

      expect(mockTrack.mock.calls.map(([, payload]) => (payload as { n: number }).n)).toEqual([1, 2, 3])
    })

    it('should fire new calls synchronously once Segment has initialized (queue is empty)', () => {
      const { result, rerender } = renderHook(() => useDeferredTrack())

      mockIsInitialized = true
      rerender()

      act(() => {
        result.current(SegmentEvent.DOWNLOAD_SUCCESS, { foo: 'after-init' })
      })

      expect(mockTrack).toHaveBeenCalledTimes(1)
      expect(mockTrack).toHaveBeenCalledWith(
        SegmentEvent.DOWNLOAD_SUCCESS,
        expect.objectContaining({ foo: 'after-init', track_deferred: false })
      )
    })
  })
})
