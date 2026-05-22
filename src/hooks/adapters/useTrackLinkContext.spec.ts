import { act, renderHook } from '@testing-library/react'
import { SegmentEvent } from '../../modules/segment'
import { useTrackClick } from './useTrackLinkContext'

let mockTrack: jest.Mock
let mockIsInitialized: boolean

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ isInitialized: mockIsInitialized, track: mockTrack })
}))

const buildClickEvent = (attrs: Record<string, string>): React.MouseEvent<HTMLElement> => {
  const element = document.createElement('button')
  Object.entries(attrs).forEach(([name, value]) => {
    element.setAttribute(name, value)
  })
  // Only `currentTarget` is read inside the hook; everything else can be omitted.
  return { currentTarget: element } as unknown as React.MouseEvent<HTMLElement>
}

describe('useTrackClick', () => {
  beforeEach(() => {
    mockTrack = jest.fn()
    mockIsInitialized = true
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when Segment is initialized and the element has data-place + data-event', () => {
    it('should fire SegmentEvent.CLICK with place and the event-as-subtype in the payload', () => {
      const { result } = renderHook(() => useTrackClick())

      act(() => {
        result.current(buildClickEvent({ 'data-place': 'Landing Hero', 'data-event': SegmentEvent.DOWNLOAD }))
      })

      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.CLICK, { place: 'Landing Hero', event: SegmentEvent.DOWNLOAD })
    })
  })

  describe('when data-event repeats the event name (Click)', () => {
    it('should strip the redundant event key from the payload', () => {
      const { result } = renderHook(() => useTrackClick())

      act(() => {
        result.current(buildClickEvent({ 'data-place': 'Landing Explore', 'data-event': SegmentEvent.CLICK }))
      })

      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.CLICK, { place: 'Landing Explore' })
    })
  })

  describe('when the element has additional data-* attributes', () => {
    it('should camelCase multi-segment keys and forward every value into the payload', () => {
      const { result } = renderHook(() => useTrackClick())

      act(() => {
        result.current(
          buildClickEvent({
            'data-place': 'Landing Explore',
            'data-event': SegmentEvent.CLICK,
            'data-card': 'recurring-events',
            'data-section': 'view_all',
            'data-os-arch': 'amd64'
          })
        )
      })

      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.CLICK, {
        place: 'Landing Explore',
        card: 'recurring-events',
        section: 'view_all',
        osArch: 'amd64'
      })
    })
  })

  describe('when a data-* attribute has an empty string value', () => {
    it('should skip the key so the warehouse does not receive empty-string noise', () => {
      const { result } = renderHook(() => useTrackClick())

      act(() => {
        result.current(
          buildClickEvent({
            'data-place': 'Referrer Invite First Hero',
            'data-event': SegmentEvent.CLICK,
            'data-title': '',
            'data-subtitle': ''
          })
        )
      })

      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.CLICK, { place: 'Referrer Invite First Hero' })
    })
  })

  describe('when Segment is NOT initialized at click time', () => {
    beforeEach(() => {
      mockIsInitialized = false
    })

    it('should NOT silent-drop the click and instead queue it for later delivery', () => {
      const { result, rerender } = renderHook(() => useTrackClick())

      act(() => {
        result.current(buildClickEvent({ 'data-place': 'Landing Hero', 'data-event': SegmentEvent.DOWNLOAD }))
      })

      // While analytics is still loading, the underlying track is not called yet.
      expect(mockTrack).not.toHaveBeenCalled()

      mockIsInitialized = true
      rerender()

      expect(mockTrack).toHaveBeenCalledTimes(1)
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.CLICK, { place: 'Landing Hero', event: SegmentEvent.DOWNLOAD })
    })
  })

  describe('when the element has no data-event attribute at all', () => {
    it('should still fire SegmentEvent.CLICK with only the place key', () => {
      const { result } = renderHook(() => useTrackClick())

      act(() => {
        result.current(buildClickEvent({ 'data-place': 'Landing Hero' }))
      })

      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.CLICK, { place: 'Landing Hero' })
    })
  })
})
