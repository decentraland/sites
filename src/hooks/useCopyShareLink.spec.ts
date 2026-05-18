import { act, renderHook } from '@testing-library/react'
import { useCopyShareLink } from './useCopyShareLink'

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

describe('useCopyShareLink', () => {
  describe('when the clipboard write succeeds', () => {
    it('should toggle copied to true and reset after the timeout', async () => {
      jest.useFakeTimers()
      writeTextMock.mockResolvedValue(undefined)
      const { result } = renderHook(() => useCopyShareLink('https://share.test'))
      expect(result.current.copied).toBe(false)
      act(() => {
        result.current.handleCopy()
      })
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(writeTextMock).toHaveBeenCalledWith('https://share.test')
      expect(result.current.copied).toBe(true)
      act(() => {
        jest.advanceTimersByTime(2001)
      })
      expect(result.current.copied).toBe(false)
      jest.useRealTimers()
    })
  })

  describe('when the clipboard write rejects', () => {
    it('should swallow the failure without flipping copied', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      writeTextMock.mockRejectedValue(new Error('denied'))
      const { result } = renderHook(() => useCopyShareLink('https://share.test'))
      act(() => {
        result.current.handleCopy()
      })
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(result.current.copied).toBe(false)
      expect(warn).toHaveBeenCalled()
      warn.mockRestore()
    })
  })

  describe('when navigator.clipboard is missing', () => {
    it('should not throw when there is no clipboard API', () => {
      const original = navigator.clipboard
      ;(navigator as unknown as { clipboard?: unknown }).clipboard = undefined
      const { result } = renderHook(() => useCopyShareLink('x'))
      expect(() => result.current.handleCopy()).not.toThrow()
      ;(navigator as unknown as { clipboard?: unknown }).clipboard = original
    })
  })
})
