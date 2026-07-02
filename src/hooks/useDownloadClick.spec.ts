import { act, renderHook } from '@testing-library/react'
import { SegmentEvent } from '../modules/segment'
import { ensureSegmentAnonymousId } from '../modules/segmentAnonymousId'
import { postSegmentEvent } from '../modules/segmentBeacon'
import { useDownloadClick } from './useDownloadClick'

let mockTrack: jest.Mock
let mockIsInitialized: boolean

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ isInitialized: mockIsInitialized, track: mockTrack })
}))

jest.mock('../modules/segmentAnonymousId', () => ({
  ensureSegmentAnonymousId: jest.fn()
}))

jest.mock('../modules/segmentBeacon', () => ({
  postSegmentEvent: jest.fn()
}))

const buildClickEvent = (attrs: Record<string, string>): React.MouseEvent<HTMLElement> => {
  const element = document.createElement('a')
  Object.entries(attrs).forEach(([name, value]) => {
    element.setAttribute(name, value)
  })
  return { currentTarget: element } as unknown as React.MouseEvent<HTMLElement>
}

describe('when tracking a download click', () => {
  beforeEach(() => {
    mockTrack = jest.fn()
    mockIsInitialized = true
    ;(ensureSegmentAnonymousId as jest.Mock).mockReturnValue('33333333-3333-4333-8333-333333333333')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and Segment is initialized', () => {
    beforeEach(() => {
      mockIsInitialized = true
    })

    it('should track a Click event through analytics-next', () => {
      const { result } = renderHook(() => useDownloadClick())

      act(() => {
        result.current(buildClickEvent({ 'data-event': SegmentEvent.DOWNLOAD, 'data-place': 'Landing Hero' }))
      })

      expect(mockTrack).toHaveBeenCalledWith(
        SegmentEvent.CLICK,
        expect.objectContaining({ event: SegmentEvent.DOWNLOAD, place: 'Landing Hero', track_deferred: false })
      )
    })

    it('should not post a beacon', () => {
      const { result } = renderHook(() => useDownloadClick())

      act(() => {
        result.current(buildClickEvent({ 'data-event': SegmentEvent.DOWNLOAD, 'data-place': 'Landing Hero' }))
      })

      expect(postSegmentEvent).not.toHaveBeenCalled()
    })
  })

  describe('and Segment is cold', () => {
    beforeEach(() => {
      mockIsInitialized = false
    })

    it('should post an unload-safe Click beacon with a stable anonymous id', () => {
      const { result } = renderHook(() => useDownloadClick())

      act(() => {
        result.current(buildClickEvent({ 'data-event': SegmentEvent.DOWNLOAD, 'data-place': 'Landing Hero' }))
      })

      expect(postSegmentEvent).toHaveBeenCalledWith(
        SegmentEvent.CLICK,
        expect.objectContaining({
          event: SegmentEvent.DOWNLOAD,
          place: 'Landing Hero',
          track_deferred: true,
          track_called_at: expect.any(Number),
          track_delivered_at: expect.any(Number)
        }),
        '33333333-3333-4333-8333-333333333333'
      )
    })

    it('should not enqueue a normal analytics track call', () => {
      const { result } = renderHook(() => useDownloadClick())

      act(() => {
        result.current(buildClickEvent({ 'data-event': SegmentEvent.DOWNLOAD, 'data-place': 'Landing Hero' }))
      })

      expect(mockTrack).not.toHaveBeenCalled()
    })
  })

  describe('and the URL carries partner campaign params', () => {
    beforeEach(() => {
      mockIsInitialized = false
      window.history.pushState({}, '', '/download?utm_source=shefi&utm_campaign=partner-launch')
    })

    afterEach(() => {
      window.history.pushState({}, '', '/')
    })

    it('should merge the campaign params into the beacon payload for partner attribution', () => {
      const { result } = renderHook(() => useDownloadClick())

      act(() => {
        result.current(buildClickEvent({ 'data-event': SegmentEvent.DOWNLOAD, 'data-place': 'download-page' }))
      })

      expect(postSegmentEvent).toHaveBeenCalledWith(
        SegmentEvent.CLICK,
        expect.objectContaining({ utm_source: 'shefi', utm_campaign: 'partner-launch', place: 'download-page' }),
        expect.any(String)
      )
    })

    it('should merge the campaign params through the initialized analytics-next path too', () => {
      mockIsInitialized = true
      const { result } = renderHook(() => useDownloadClick())

      act(() => {
        result.current(buildClickEvent({ 'data-event': SegmentEvent.DOWNLOAD, 'data-place': 'download-page' }))
      })

      expect(mockTrack).toHaveBeenCalledWith(
        SegmentEvent.CLICK,
        expect.objectContaining({ utm_source: 'shefi', utm_campaign: 'partner-launch' })
      )
    })

    it('should keep a camelCased data-* attribute distinct from the URL campaign param', () => {
      // `readDataAttributes` camelCases dashed names (`data-utm-source` →
      // `utmSource`), so a data-* UTM attribute never clobbers the snake_case
      // `utm_source` collected from the URL — both keys coexist in the payload.
      const { result } = renderHook(() => useDownloadClick())

      act(() => {
        result.current(buildClickEvent({ 'data-event': SegmentEvent.DOWNLOAD, 'data-utm-source': 'component-value' }))
      })

      expect((postSegmentEvent as jest.Mock).mock.calls[0][1]).toMatchObject({ utmSource: 'component-value', utm_source: 'shefi' })
    })
  })

  describe('and the CTA declares a download target', () => {
    beforeEach(() => {
      mockIsInitialized = false
    })

    it('should rename the camelCased downloadTarget to the snake_case download_target dimension (beacon path)', () => {
      const { result } = renderHook(() => useDownloadClick())

      act(() => {
        result.current(buildClickEvent({ 'data-event': SegmentEvent.DOWNLOAD, 'data-download-target': 'app_store', 'data-os': 'iOS' }))
      })

      const payload = (postSegmentEvent as jest.Mock).mock.calls[0][1]
      expect(payload).toMatchObject({ download_target: 'app_store', os: 'iOS' })
      expect(payload).not.toHaveProperty('downloadTarget')
    })

    it('should carry download_target through the initialized analytics-next path too', () => {
      mockIsInitialized = true
      const { result } = renderHook(() => useDownloadClick())

      act(() => {
        result.current(buildClickEvent({ 'data-event': SegmentEvent.DOWNLOAD, 'data-download-target': 'desktop_installer' }))
      })

      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.CLICK, expect.objectContaining({ download_target: 'desktop_installer' }))
    })
  })

  describe('and data-event repeats the Segment event name', () => {
    beforeEach(() => {
      mockIsInitialized = false
    })

    it('should strip the redundant payload key', () => {
      const { result } = renderHook(() => useDownloadClick())

      act(() => {
        result.current(buildClickEvent({ 'data-event': SegmentEvent.CLICK, 'data-place': 'Landing Hero' }))
      })

      expect(postSegmentEvent).toHaveBeenCalledWith(
        SegmentEvent.CLICK,
        expect.objectContaining({
          place: 'Landing Hero',
          track_deferred: true
        }),
        expect.any(String)
      )
      expect((postSegmentEvent as jest.Mock).mock.calls[0][1]).not.toHaveProperty('event')
    })
  })
})
