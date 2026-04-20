import { renderHook } from '@testing-library/react'
import { useGetExploreDataQuery } from './events.client'

const mockUnsubscribe = jest.fn()
let capturedVisibilityListener: ((visible: boolean) => void) | null = null
let visibility = true

jest.mock('../../utils/documentVisibility', () => ({
  isDocumentVisible: () => visibility,
  subscribeVisibility: (listener: (visible: boolean) => void) => {
    capturedVisibilityListener = listener
    return mockUnsubscribe
  }
}))

jest.mock('../../config/env', () => ({
  getEnv: (key: string) => {
    if (key === 'EVENTS_API_URL') return 'https://events.test/api'
    if (key === 'HOT_SCENES_URL') return 'https://realm.test/hot-scenes'
    return undefined
  }
}))

jest.mock('./events.helpers', () => ({
  buildExploreCards: jest.fn(() => [])
}))

function okResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(payload)
  } as unknown as Response
}

describe('events.client', () => {
  let fetchMock: jest.Mock<Promise<Response>, [RequestInfo | URL, RequestInit?]>

  beforeEach(() => {
    jest.useFakeTimers()
    visibility = true
    capturedVisibilityListener = null
    mockUnsubscribe.mockReset()
    fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
    fetchMock.mockImplementation(() => Promise.resolve(okResponse({ data: [] })))
    global.fetch = fetchMock as unknown as typeof global.fetch
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  describe('when the first consumer mounts', () => {
    it('should register a visibility listener', () => {
      const { unmount } = renderHook(() => useGetExploreDataQuery())

      expect(capturedVisibilityListener).not.toBeNull()

      unmount()
    })
  })

  describe('when the last consumer unmounts', () => {
    it('should release the visibility subscription', () => {
      const { unmount } = renderHook(() => useGetExploreDataQuery())

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the tab starts hidden', () => {
    beforeEach(() => {
      visibility = false
    })

    it('should not schedule the poll interval', () => {
      const { unmount } = renderHook(() => useGetExploreDataQuery())

      expect(jest.getTimerCount()).toBe(0)

      unmount()
    })

    describe('and visibility returns', () => {
      it('should schedule the poll interval', () => {
        const { unmount } = renderHook(() => useGetExploreDataQuery())

        visibility = true
        capturedVisibilityListener?.(true)

        expect(jest.getTimerCount()).toBeGreaterThan(0)

        unmount()
      })
    })
  })

  describe('when multiple consumers are mounted', () => {
    describe('and only one of them unmounts', () => {
      it('should keep the visibility subscription alive', () => {
        const first = renderHook(() => useGetExploreDataQuery())
        const second = renderHook(() => useGetExploreDataQuery())

        first.unmount()

        expect(mockUnsubscribe).not.toHaveBeenCalled()

        second.unmount()
      })
    })

    describe('and the last one unmounts', () => {
      it('should release the visibility subscription', () => {
        const first = renderHook(() => useGetExploreDataQuery())
        const second = renderHook(() => useGetExploreDataQuery())

        first.unmount()
        second.unmount()

        expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
      })
    })
  })
})
