import { renderHook } from '@testing-library/react'
import { useMobileMediaQuery } from 'decentraland-ui2'
import { SectionViewedTrack, SegmentEvent } from '../modules/segment'
import { useDeferredTrack } from './useDeferredTrack'
import { useSectionViewedTracking } from './useSectionViewedTracking'

jest.mock('decentraland-ui2', () => ({
  useMobileMediaQuery: jest.fn()
}))

jest.mock('./useDeferredTrack', () => ({
  useDeferredTrack: jest.fn()
}))

const mockUseMobileMediaQuery = jest.mocked(useMobileMediaQuery)
const mockUseDeferredTrack = jest.mocked(useDeferredTrack)
const track = jest.fn()

describe('useSectionViewedTracking', () => {
  beforeEach(() => {
    mockUseDeferredTrack.mockReturnValue(track)
    mockUseMobileMediaQuery.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the section is not in view', () => {
    it('should not fire the event', () => {
      renderHook(() => useSectionViewedTracking(SectionViewedTrack.CREATORS_WHY, false))

      expect(track).not.toHaveBeenCalled()
    })
  })

  describe('when the section comes into view', () => {
    it('should fire Section Viewed once with the section and desktop mobile flag', () => {
      const { rerender } = renderHook(({ inView }) => useSectionViewedTracking(SectionViewedTrack.CREATORS_WHY, inView), {
        initialProps: { inView: false }
      })

      rerender({ inView: true })

      const expected = {
        section_viewed: 'Creators Why',
        mobile: false
      }
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith(SegmentEvent.SECTION_VIEWED, expected)
    })

    it('should not fire again on subsequent renders once already tracked', () => {
      const { rerender } = renderHook(({ inView }) => useSectionViewedTracking(SectionViewedTrack.CREATORS_WHY, inView), {
        initialProps: { inView: false }
      })

      rerender({ inView: true })
      rerender({ inView: true })

      expect(track).toHaveBeenCalledTimes(1)
    })

    it('should report mobile true on a mobile viewport', () => {
      mockUseMobileMediaQuery.mockReturnValue(true)
      const { rerender } = renderHook(({ inView }) => useSectionViewedTracking(SectionViewedTrack.CREATORS_WHY, inView), {
        initialProps: { inView: false }
      })

      rerender({ inView: true })

      expect(track).toHaveBeenCalledWith(SegmentEvent.SECTION_VIEWED, expect.objectContaining({ mobile: true }))
    })
  })

  describe('when no place is provided', () => {
    it('should never fire even when in view', () => {
      const { rerender } = renderHook(({ inView }) => useSectionViewedTracking(undefined, inView), {
        initialProps: { inView: false }
      })

      rerender({ inView: true })

      expect(track).not.toHaveBeenCalled()
    })
  })
})
