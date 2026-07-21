import { renderHook } from '@testing-library/react'
import { useAsyncMemo } from '@dcl/hooks'
import { useTotalDownloads } from './useTotalDownloads'

jest.mock('@dcl/hooks', () => ({ useAsyncMemo: jest.fn() }))
jest.mock('../modules/explorerDownloads', () => ({ ExplorerDownloads: { get: () => ({ getTotalDownloads: jest.fn() }) } }))
jest.mock('../modules/number', () => ({ formatToShorthand: (n: number) => `${n}` }))

const mockedUseAsyncMemo = useAsyncMemo as jest.MockedFunction<typeof useAsyncMemo>

// Invoke the thunk so the total-downloads fetcher itself runs, then return the
// requested tuple.
const withAsyncMemo = (value: number | null, loaded: boolean) => {
  mockedUseAsyncMemo.mockImplementation(((fn: () => Promise<unknown>) => {
    void fn()
    return [value, { loading: !loaded, loaded }]
  }) as unknown as typeof useAsyncMemo)
}

describe('useTotalDownloads', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  // NOTE: the hook caches the loaded count at module scope (so it survives
  // remounts across surfaces), so the "not loaded" case is asserted first,
  // before any test that loads a real count populates the cache.
  it('should return the default label before the count has loaded', () => {
    withAsyncMemo(null, false)

    const { result } = renderHook(() => useTotalDownloads())

    expect(result.current).toBe('+400K')
  })

  it('should format the loaded count', () => {
    withAsyncMemo(42000, true)

    const { result } = renderHook(() => useTotalDownloads())

    expect(result.current).toBe('42000')
  })

  it('should keep serving the cached count once it has loaded', () => {
    // Still loading on this render, but the previous test cached a value.
    withAsyncMemo(null, false)

    const { result } = renderHook(() => useTotalDownloads())

    expect(result.current).toBe('42000')
  })
})
