import { renderHook } from '@testing-library/react'

// `useAsyncMemo` is mocked through a stable top-level fn so that reloading the
// hook (below) keeps pointing at the same configurable mock.
const mockUseAsyncMemo = jest.fn()
const mockGetTotalDownloads = jest.fn()

jest.mock('@dcl/hooks', () => ({ useAsyncMemo: (...args: unknown[]) => mockUseAsyncMemo(...args) }))
jest.mock('../modules/explorerDownloads', () => ({ ExplorerDownloads: { get: () => ({ getTotalDownloads: mockGetTotalDownloads }) } }))
jest.mock('../modules/number', () => ({ formatToShorthand: (n: number) => `${n}` }))

/**
 * Loads a fresh copy of the hook so its module-level `cachedCount` starts empty
 * on every test — each case is independent of the others' cache writes.
 */
const loadHook = () => {
  let hook!: typeof import('./useTotalDownloads').useTotalDownloads
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    hook = require('./useTotalDownloads').useTotalDownloads
  })
  return hook
}

const asyncMemo = (value: number | null, loaded: boolean) => {
  mockUseAsyncMemo.mockImplementation((fn: () => Promise<unknown>) => {
    void fn()
    return [value, { loading: !loaded, loaded }]
  })
}

describe('useTotalDownloads', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return the default label before the count has loaded', () => {
    asyncMemo(null, false)
    const useTotalDownloads = loadHook()

    const { result } = renderHook(() => useTotalDownloads())

    expect(result.current).toBe('+400K')
  })

  it('should format the loaded count', () => {
    asyncMemo(42000, true)
    const useTotalDownloads = loadHook()

    const { result } = renderHook(() => useTotalDownloads())

    expect(result.current).toBe('42000')
  })

  it('should keep serving the cached count on a later still-loading render', () => {
    const useTotalDownloads = loadHook()

    // First render loads a real count → populates the module-level cache.
    asyncMemo(42000, true)
    const first = renderHook(() => useTotalDownloads())
    expect(first.result.current).toBe('42000')

    // A later render that is still loading keeps serving the cached value.
    asyncMemo(null, false)
    const second = renderHook(() => useTotalDownloads())
    expect(second.result.current).toBe('42000')
  })
})
