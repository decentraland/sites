import { timeoutSignal } from './timeoutSignal'

describe('when building a timeout signal', () => {
  // Saved as a descriptor rather than a bare reference so the original is put back
  // exactly as it was, whatever setupTests installed for jsdom.
  const nativeDescriptor = Object.getOwnPropertyDescriptor(AbortSignal, 'timeout')

  afterEach(() => {
    if (nativeDescriptor) {
      Object.defineProperty(AbortSignal, 'timeout', nativeDescriptor)
    }
    jest.useRealTimers()
  })

  describe('and the browser supports AbortSignal.timeout', () => {
    it('should delegate to it with the same duration', () => {
      const signal = new AbortController().signal
      const spy = jest.fn().mockReturnValue(signal)
      Object.defineProperty(AbortSignal, 'timeout', { configurable: true, writable: true, value: spy })

      expect(timeoutSignal(1234)).toBe(signal)
      expect(spy).toHaveBeenCalledWith(1234)
    })
  })

  // The branch that matters: this is what Chrome below 103 and Safari below 16 hit,
  // and it used to throw before the request was ever made (SITES-2NN).
  describe('and the browser lacks AbortSignal.timeout', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      Object.defineProperty(AbortSignal, 'timeout', { configurable: true, writable: true, value: undefined })
    })

    it('should return a signal instead of throwing', () => {
      const signal = timeoutSignal(100)
      expect(signal.aborted).toBe(false)
    })

    it('should not abort before the timeout elapses', () => {
      const signal = timeoutSignal(100)
      jest.advanceTimersByTime(99)
      expect(signal.aborted).toBe(false)
    })

    it('should abort once the timeout elapses', () => {
      const signal = timeoutSignal(100)
      jest.advanceTimersByTime(100)
      expect(signal.aborted).toBe(true)
    })

    it('should abort with a TimeoutError, matching the native reason', () => {
      const signal = timeoutSignal(100)
      jest.advanceTimersByTime(100)
      expect((signal.reason as DOMException)?.name).toBe('TimeoutError')
    })
  })
})
