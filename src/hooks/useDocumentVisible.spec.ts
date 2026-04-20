import { act, renderHook } from '@testing-library/react'
import { useDocumentVisible } from './useDocumentVisible'

describe('useDocumentVisible', () => {
  let hiddenValue: boolean

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

  describe('when the document is initially visible', () => {
    beforeEach(() => {
      hiddenValue = false
    })

    it('should return true', () => {
      const { result } = renderHook(() => useDocumentVisible())

      expect(result.current).toBe(true)
    })

    describe('and a visibilitychange event fires with document.hidden=true', () => {
      it('should flip to false', () => {
        const { result } = renderHook(() => useDocumentVisible())

        act(() => {
          hiddenValue = true
          document.dispatchEvent(new Event('visibilitychange'))
        })

        expect(result.current).toBe(false)
      })
    })
  })

  describe('when the document is initially hidden', () => {
    beforeEach(() => {
      hiddenValue = true
    })

    it('should return false', () => {
      const { result } = renderHook(() => useDocumentVisible())

      expect(result.current).toBe(false)
    })

    describe('and a visibilitychange event fires with document.hidden=false', () => {
      it('should flip back to true', () => {
        const { result } = renderHook(() => useDocumentVisible())

        act(() => {
          hiddenValue = false
          document.dispatchEvent(new Event('visibilitychange'))
        })

        expect(result.current).toBe(true)
      })
    })
  })

  describe('when the hook unmounts', () => {
    let removeSpy: jest.SpyInstance

    beforeEach(() => {
      removeSpy = jest.spyOn(document, 'removeEventListener')
    })

    it('should remove the visibilitychange listener', () => {
      const { unmount } = renderHook(() => useDocumentVisible())

      unmount()

      expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    })
  })
})
