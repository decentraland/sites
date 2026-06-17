import { act, renderHook } from '@testing-library/react'
import { useCopyToClipboard } from './useCopyToClipboard'

const writeTextMock = jest.fn()

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: { writeText: writeTextMock }
  })
})

beforeEach(() => {
  writeTextMock.mockReset()
})

describe('useCopyToClipboard', () => {
  describe('when the clipboard write succeeds', () => {
    it('should toggle copied to true and reset after the timeout', async () => {
      jest.useFakeTimers()
      writeTextMock.mockResolvedValue(undefined)
      const { result } = renderHook(() => useCopyToClipboard())
      expect(result.current.copied).toBe(false)
      act(() => {
        result.current.copy('0xCafe')
      })
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(writeTextMock).toHaveBeenCalledWith('0xCafe')
      expect(result.current.copied).toBe(true)
      act(() => {
        jest.advanceTimersByTime(2001)
      })
      expect(result.current.copied).toBe(false)
      jest.useRealTimers()
    })

    it('should honour a custom reset timeout', async () => {
      jest.useFakeTimers()
      writeTextMock.mockResolvedValue(undefined)
      const { result } = renderHook(() => useCopyToClipboard(5000))
      act(() => {
        result.current.copy('value')
      })
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(result.current.copied).toBe(true)
      act(() => {
        jest.advanceTimersByTime(2001)
      })
      expect(result.current.copied).toBe(true)
      act(() => {
        jest.advanceTimersByTime(3000)
      })
      expect(result.current.copied).toBe(false)
      jest.useRealTimers()
    })
  })

  describe('when the clipboard write rejects', () => {
    it('should keep copied false and not leak an unhandled rejection', async () => {
      writeTextMock.mockRejectedValue(new Error('denied'))
      const { result } = renderHook(() => useCopyToClipboard())
      act(() => {
        result.current.copy('value')
      })
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(result.current.copied).toBe(false)
    })
  })

  describe('when navigator.clipboard is missing', () => {
    it('should not throw when there is no clipboard API', () => {
      const original = navigator.clipboard
      ;(navigator as unknown as { clipboard?: unknown }).clipboard = undefined
      const { result } = renderHook(() => useCopyToClipboard())
      expect(() => result.current.copy('value')).not.toThrow()
      expect(result.current.copied).toBe(false)
      ;(navigator as unknown as { clipboard?: unknown }).clipboard = original
    })
  })

  describe('when copied twice in quick succession', () => {
    it('should restart the reset timer instead of dismissing early', async () => {
      jest.useFakeTimers()
      writeTextMock.mockResolvedValue(undefined)
      const { result } = renderHook(() => useCopyToClipboard())
      act(() => {
        result.current.copy('a')
      })
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })
      act(() => {
        jest.advanceTimersByTime(1500)
      })
      act(() => {
        result.current.copy('b')
      })
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })
      // 1500ms after the first copy + 1000ms more: the first timer would have
      // fired at 2000ms, but the second copy reset it, so it stays visible.
      act(() => {
        jest.advanceTimersByTime(1000)
      })
      expect(result.current.copied).toBe(true)
      act(() => {
        jest.advanceTimersByTime(1001)
      })
      expect(result.current.copied).toBe(false)
      jest.useRealTimers()
    })
  })
})
