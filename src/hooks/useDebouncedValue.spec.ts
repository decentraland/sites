import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  describe('when first rendered', () => {
    it('should return the initial value without waiting', () => {
      const { result } = renderHook(() => useDebouncedValue('hat', 300))

      expect(result.current).toBe('hat')
    })
  })

  describe('when the value changes', () => {
    it('should keep the previous value until the delay elapses', () => {
      const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: 'hat' } })

      rerender({ value: 'hats' })
      expect(result.current).toBe('hat')

      act(() => {
        jest.advanceTimersByTime(300)
      })
      expect(result.current).toBe('hats')
    })
  })

  describe('and it changes again before the delay elapses', () => {
    it('should only settle on the last value', () => {
      const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: 'h' } })

      rerender({ value: 'ha' })
      act(() => {
        jest.advanceTimersByTime(200)
      })
      rerender({ value: 'hat' })
      act(() => {
        jest.advanceTimersByTime(200)
      })
      expect(result.current).toBe('h')

      act(() => {
        jest.advanceTimersByTime(100)
      })
      expect(result.current).toBe('hat')
    })
  })

  describe('and it returns to the already-settled value', () => {
    it('should not schedule another update', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
      const { rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: 'hat' } })

      rerender({ value: 'hat' })

      expect(setTimeoutSpy).not.toHaveBeenCalled()
    })
  })
})
