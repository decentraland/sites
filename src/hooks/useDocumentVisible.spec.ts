import { act, renderHook } from '@testing-library/react'
import { useDocumentVisible } from './useDocumentVisible'

describe('useDocumentVisible', () => {
  let hiddenValue = false

  beforeEach(() => {
    hiddenValue = false
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hiddenValue
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return true when the document is initially visible', () => {
    hiddenValue = false
    const { result } = renderHook(() => useDocumentVisible())
    expect(result.current).toBe(true)
  })

  it('should return false when the document is initially hidden', () => {
    hiddenValue = true
    const { result } = renderHook(() => useDocumentVisible())
    expect(result.current).toBe(false)
  })

  it('should flip to false when a visibilitychange event fires with document.hidden=true', () => {
    const { result } = renderHook(() => useDocumentVisible())
    expect(result.current).toBe(true)

    act(() => {
      hiddenValue = true
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toBe(false)
  })

  it('should flip back to true when the document becomes visible again', () => {
    hiddenValue = true
    const { result } = renderHook(() => useDocumentVisible())
    expect(result.current).toBe(false)

    act(() => {
      hiddenValue = false
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toBe(true)
  })

  it('should remove the visibilitychange listener on unmount', () => {
    const removeSpy = jest.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => useDocumentVisible())
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })
})
