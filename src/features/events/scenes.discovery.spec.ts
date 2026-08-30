import { act, renderHook } from '@testing-library/react'
import { useGetHotScenesQuery } from './scenes.discovery'

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

const envMock = jest.fn<string | undefined, [string]>()
jest.mock('../../config/env', () => ({
  getEnv: (key: string) => envMock(key)
}))

const scenesPayload = [
  {
    id: 'scene-1',
    name: 'Busy Scene',
    baseCoords: [2, 2],
    usersTotalCount: 12,
    parcels: [[2, 2]],
    thumbnail: 'https://img.test/busy.png'
  }
]

function okResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(payload)
  } as unknown as Response
}

async function flushAll() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('scenes.discovery', () => {
  let fetchMock: jest.Mock<Promise<Response>, [RequestInfo | URL, RequestInit?]>

  beforeEach(() => {
    visibility = true
    capturedVisibilityListener = null
    mockUnsubscribe.mockReset()
    envMock.mockReset().mockImplementation((key: string) => (key === 'HOT_SCENES_URL' ? 'https://realm.test/hot-scenes' : undefined))
    fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
    fetchMock.mockResolvedValue(okResponse(scenesPayload))
    global.fetch = fetchMock as unknown as typeof global.fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the feed responds with scenes', () => {
    it('should expose them and stop loading', async () => {
      const { result, unmount } = renderHook(() => useGetHotScenesQuery())

      expect(result.current.isLoading).toBe(true)

      await flushAll()

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toEqual(scenesPayload)
      expect(fetchMock).toHaveBeenCalledWith('https://realm.test/hot-scenes', expect.anything())
      unmount()
    })

    it('should fetch only once while consumers stay mounted', async () => {
      const first = renderHook(() => useGetHotScenesQuery())
      await flushAll()
      const calls = fetchMock.mock.calls.length

      const second = renderHook(() => useGetHotScenesQuery())
      await flushAll()

      expect(fetchMock.mock.calls.length).toBe(calls)
      first.unmount()
      second.unmount()
    })

    it('should share an in-flight fetch when a consumer remounts before it settles', async () => {
      let release: (value: Response) => void = () => undefined
      fetchMock.mockImplementation(() => new Promise<Response>(resolve => (release = resolve)))

      const first = renderHook(() => useGetHotScenesQuery())
      first.unmount()
      const second = renderHook(() => useGetHotScenesQuery())

      expect(fetchMock).toHaveBeenCalledTimes(1)

      release(okResponse(scenesPayload))
      await flushAll()

      expect(second.result.current.data).toEqual(scenesPayload)
      second.unmount()
    })
  })

  describe('when HOT_SCENES_URL is not configured', () => {
    beforeEach(() => {
      envMock.mockReturnValue(undefined)
    })

    it('should fall back to the public realm provider', async () => {
      const { unmount } = renderHook(() => useGetHotScenesQuery())

      await flushAll()

      expect(fetchMock).toHaveBeenCalledWith('https://realm-provider-ea.decentraland.org/hot-scenes', expect.anything())
      unmount()
    })
  })

  describe('when the request fails', () => {
    beforeEach(() => {
      fetchMock.mockRejectedValue(new Error('network down'))
    })

    it('should resolve to an empty list', async () => {
      const { result, unmount } = renderHook(() => useGetHotScenesQuery())

      await flushAll()

      expect(result.current).toEqual({ data: [], isLoading: false })
      unmount()
    })
  })

  describe('when the response is not ok', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve(null) } as unknown as Response)
    })

    it('should resolve to an empty list', async () => {
      const { result, unmount } = renderHook(() => useGetHotScenesQuery())

      await flushAll()

      expect(result.current).toEqual({ data: [], isLoading: false })
      unmount()
    })
  })

  describe('when the response is not an array', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(okResponse({ error: 'shape' }))
    })

    it('should resolve to an empty list', async () => {
      const { result, unmount } = renderHook(() => useGetHotScenesQuery())

      await flushAll()

      expect(result.current).toEqual({ data: [], isLoading: false })
      unmount()
    })
  })

  describe('revalidation', () => {
    afterEach(() => {
      jest.useRealTimers()
    })

    describe('when the first consumer mounts', () => {
      it('should register a visibility listener and release it on the last unmount', () => {
        jest.useFakeTimers()
        const { unmount } = renderHook(() => useGetHotScenesQuery())

        expect(capturedVisibilityListener).not.toBeNull()
        expect(mockUnsubscribe).not.toHaveBeenCalled()

        unmount()
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
      })
    })

    describe('when the polling interval ticks', () => {
      it('should re-run the fetch', async () => {
        jest.useFakeTimers()
        const { unmount } = renderHook(() => useGetHotScenesQuery())
        await flushAll()
        const callsBefore = fetchMock.mock.calls.length

        act(() => {
          jest.advanceTimersByTime(60_001)
        })
        await flushAll()

        expect(fetchMock.mock.calls.length).toBe(callsBefore + 1)
        unmount()
      })
    })

    describe('when the tab starts hidden', () => {
      beforeEach(() => {
        visibility = false
      })

      it('should not poll until visibility returns', async () => {
        jest.useFakeTimers()
        const { unmount } = renderHook(() => useGetHotScenesQuery())
        await flushAll()
        const callsBefore = fetchMock.mock.calls.length

        act(() => {
          jest.advanceTimersByTime(60_001)
        })
        await flushAll()
        expect(fetchMock.mock.calls.length).toBe(callsBefore)

        visibility = true
        act(() => {
          capturedVisibilityListener?.(true)
        })
        await flushAll()
        expect(fetchMock.mock.calls.length).toBe(callsBefore + 1)

        act(() => {
          jest.advanceTimersByTime(60_001)
        })
        await flushAll()
        expect(fetchMock.mock.calls.length).toBe(callsBefore + 2)
        unmount()
      })
    })

    describe('when visibility flips to hidden after subscribers exist', () => {
      it('should stop polling until visibility returns', async () => {
        jest.useFakeTimers()
        const { unmount } = renderHook(() => useGetHotScenesQuery())
        await flushAll()
        const callsBefore = fetchMock.mock.calls.length

        visibility = false
        act(() => {
          capturedVisibilityListener?.(false)
        })
        act(() => {
          jest.advanceTimersByTime(120_001)
        })
        await flushAll()

        expect(fetchMock.mock.calls.length).toBe(callsBefore)
        unmount()
      })
    })

    describe('when there are no subscribers', () => {
      it('should ignore visibility changes', async () => {
        jest.useFakeTimers()
        const { unmount } = renderHook(() => useGetHotScenesQuery())
        await flushAll()
        const listener = capturedVisibilityListener
        unmount()
        const callsBefore = fetchMock.mock.calls.length

        act(() => {
          listener?.(true)
          jest.advanceTimersByTime(60_001)
        })
        await flushAll()

        expect(fetchMock.mock.calls.length).toBe(callsBefore)
      })
    })
  })
})
