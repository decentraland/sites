import { renderHook } from '@testing-library/react'
import { usePageView } from './usePageView'

const mockPage = jest.fn()
let mockIsInitialized = true
let mockPathname = '/reels/abc'

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockPathname })
}))

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ isInitialized: mockIsInitialized, page: mockPage })
}))

describe('usePageView', () => {
  beforeEach(() => {
    mockIsInitialized = true
    mockPathname = '/reels/abc'
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should fire page() with the current pathname once analytics is initialized', () => {
    renderHook(() => usePageView())

    expect(mockPage).toHaveBeenCalledWith('/reels/abc')
    expect(mockPage).toHaveBeenCalledTimes(1)
  })

  it('should not fire page() before analytics is initialized', () => {
    mockIsInitialized = false
    renderHook(() => usePageView())

    expect(mockPage).not.toHaveBeenCalled()
  })

  it('should re-fire page() when the pathname changes', () => {
    const { rerender } = renderHook(() => usePageView())
    expect(mockPage).toHaveBeenCalledTimes(1)

    mockPathname = '/reels/list/0xabc'
    rerender()

    expect(mockPage).toHaveBeenCalledTimes(2)
    expect(mockPage).toHaveBeenLastCalledWith('/reels/list/0xabc')
  })
})
