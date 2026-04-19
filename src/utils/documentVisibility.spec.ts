import { isDocumentVisible, subscribeVisibility } from './documentVisibility'

describe('documentVisibility', () => {
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

  describe('isDocumentVisible', () => {
    it('should return true when document is not hidden', () => {
      hiddenValue = false
      expect(isDocumentVisible()).toBe(true)
    })

    it('should return false when document is hidden', () => {
      hiddenValue = true
      expect(isDocumentVisible()).toBe(false)
    })
  })

  describe('subscribeVisibility', () => {
    it('should invoke the listener when visibility flips', () => {
      const listener = jest.fn()
      const unsubscribe = subscribeVisibility(listener)

      hiddenValue = true
      document.dispatchEvent(new Event('visibilitychange'))

      expect(listener).toHaveBeenCalledWith(false)

      hiddenValue = false
      document.dispatchEvent(new Event('visibilitychange'))

      expect(listener).toHaveBeenCalledWith(true)

      unsubscribe()
    })

    it('should stop invoking the listener after unsubscribe', () => {
      const listener = jest.fn()
      const unsubscribe = subscribeVisibility(listener)
      unsubscribe()

      hiddenValue = true
      document.dispatchEvent(new Event('visibilitychange'))

      expect(listener).not.toHaveBeenCalled()
    })

    it('should deduplicate the same listener reference', () => {
      const listener = jest.fn()
      const unsubscribeA = subscribeVisibility(listener)
      const unsubscribeB = subscribeVisibility(listener)

      hiddenValue = true
      document.dispatchEvent(new Event('visibilitychange'))

      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribeA()
      unsubscribeB()
    })

    it('should detach the underlying document listener when the last subscriber leaves', () => {
      const addSpy = jest.spyOn(document, 'addEventListener')
      const removeSpy = jest.spyOn(document, 'removeEventListener')

      const unsubscribe = subscribeVisibility(() => undefined)
      expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))

      unsubscribe()
      expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    })
  })
})
