import { act, renderHook } from '@testing-library/react'
import { useAnalytics } from '@dcl/hooks'
import { SegmentEvent } from '../modules/segment'
import { useLegacyRedirectTracking } from './useLegacyRedirectTracking'

jest.mock('@dcl/hooks', () => ({
  useAnalytics: jest.fn()
}))

const useAnalyticsMock = useAnalytics as jest.MockedFunction<typeof useAnalytics>

const baseArgs = {
  origin: 'events' as const,
  source: '/events/event?id=abc',
  destination: '/whats-on?id=abc',
  preservedParams: { id: 'abc' }
}

describe('useLegacyRedirectTracking', () => {
  let trackMock: jest.Mock

  beforeEach(() => {
    trackMock = jest.fn()
    useAnalyticsMock.mockReturnValue({
      isInitialized: true,
      page: jest.fn(),
      track: trackMock,
      identify: jest.fn()
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  describe('when analytics is initialized on mount', () => {
    it('should fire track with the events SegmentEvent for origin "events"', () => {
      const { result } = renderHook(() => useLegacyRedirectTracking(baseArgs))

      expect(trackMock).toHaveBeenCalledTimes(1)
      expect(trackMock).toHaveBeenCalledWith(
        SegmentEvent.LEGACY_EVENTS_REDIRECTED,
        expect.objectContaining({
          source: '/events/event?id=abc',
          destination: '/whats-on?id=abc',
          origin: 'events',
          preservedParams: { id: 'abc' }
        })
      )
      expect(result.current).toBe(true)
    })

    it('should fire track with the places SegmentEvent for origin "places"', () => {
      renderHook(() =>
        useLegacyRedirectTracking({ ...baseArgs, origin: 'places', source: '/places/place', destination: '/whats-on', preservedParams: {} })
      )

      expect(trackMock).toHaveBeenCalledWith(
        SegmentEvent.LEGACY_PLACES_REDIRECTED,
        expect.objectContaining({ origin: 'places', preservedParams: {} })
      )
    })

    it('should attach an ISO 8601 timestamp to the payload', () => {
      renderHook(() => useLegacyRedirectTracking(baseArgs))

      const payload = trackMock.mock.calls[0][1] as { timestamp: string }
      expect(payload.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should fire only once across stable re-renders', () => {
      const { rerender } = renderHook(props => useLegacyRedirectTracking(props), { initialProps: baseArgs })

      rerender(baseArgs)
      rerender(baseArgs)

      expect(trackMock).toHaveBeenCalledTimes(1)
    })

    it('should release ready=true even when track throws', () => {
      trackMock.mockImplementation(() => {
        throw new Error('Segment plugin failed')
      })

      const { result } = renderHook(() => useLegacyRedirectTracking(baseArgs))

      expect(result.current).toBe(true)
    })
  })

  describe('when analytics is not initialized on mount', () => {
    beforeEach(() => {
      useAnalyticsMock.mockReturnValue({
        isInitialized: false,
        page: jest.fn(),
        track: trackMock,
        identify: jest.fn()
      })
    })

    it('should not fire track and should keep ready false initially', () => {
      const { result } = renderHook(() => useLegacyRedirectTracking(baseArgs))

      expect(trackMock).not.toHaveBeenCalled()
      expect(result.current).toBe(false)
    })

    it('should release ready=true after the redirect timeout even without initialization', () => {
      jest.useFakeTimers()
      const { result } = renderHook(() => useLegacyRedirectTracking(baseArgs))

      expect(result.current).toBe(false)

      act(() => {
        jest.advanceTimersByTime(800)
      })

      expect(trackMock).not.toHaveBeenCalled()
      expect(result.current).toBe(true)
    })

    it('should fire track and release ready when analytics becomes initialized', () => {
      const { result, rerender } = renderHook(() => useLegacyRedirectTracking(baseArgs))

      expect(trackMock).not.toHaveBeenCalled()
      expect(result.current).toBe(false)

      useAnalyticsMock.mockReturnValue({
        isInitialized: true,
        page: jest.fn(),
        track: trackMock,
        identify: jest.fn()
      })
      rerender()

      expect(trackMock).toHaveBeenCalledTimes(1)
      expect(result.current).toBe(true)
    })
  })
})
