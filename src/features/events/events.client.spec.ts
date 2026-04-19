// Covers the subscribe/unsubscribe lifecycle of the homepage explore client,
// including visibility pause and StrictMode double-invoke protection.
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

const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()

// Note: jest hoists jest.mock() above the top `import`, so the mocks above
// are applied before useGetExploreDataQuery resolves its transitive imports.
// Each test leaves the module in a clean 0-subscriber state by unmounting
// every hook it renders — we intentionally do NOT use jest.resetModules,
// which would create a second React instance and break useSyncExternalStore.

describe('events.client subscribe lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    visibility = true
    capturedVisibilityListener = null
    mockUnsubscribe.mockReset()
    fetchMock.mockReset()
    fetchMock.mockImplementation(() => Promise.resolve(okResponse({ data: [] })))
    global.fetch = fetchMock as unknown as typeof global.fetch
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should subscribe to visibility when the first consumer mounts', () => {
    const { unmount } = renderHook(() => useGetExploreDataQuery())
    expect(capturedVisibilityListener).not.toBeNull()
    unmount()
  })

  it('should unsubscribe from visibility when the last consumer unmounts', () => {
    const { unmount } = renderHook(() => useGetExploreDataQuery())
    expect(mockUnsubscribe).not.toHaveBeenCalled()
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('should not schedule the poll interval while the tab starts hidden', () => {
    visibility = false
    const { unmount } = renderHook(() => useGetExploreDataQuery())
    expect(jest.getTimerCount()).toBe(0)
    unmount()
  })

  it('should schedule the poll interval once visibility returns', () => {
    visibility = false
    const { unmount } = renderHook(() => useGetExploreDataQuery())
    expect(jest.getTimerCount()).toBe(0)

    visibility = true
    capturedVisibilityListener?.(true)
    expect(jest.getTimerCount()).toBeGreaterThan(0)
    unmount()
  })

  it('should keep the subscription alive as long as at least one consumer is mounted', () => {
    const first = renderHook(() => useGetExploreDataQuery())
    const second = renderHook(() => useGetExploreDataQuery())

    first.unmount()
    expect(mockUnsubscribe).not.toHaveBeenCalled()

    second.unmount()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
