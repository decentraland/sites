import { isDocumentVisible, subscribeVisibility } from './documentVisibility'

describe('documentVisibility', () => {
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

  describe('isDocumentVisible', () => {
    describe('when the document is not hidden', () => {
      beforeEach(() => {
        hiddenValue = false
      })

      it('should return true', () => {
        expect(isDocumentVisible()).toBe(true)
      })
    })

    describe('when the document is hidden', () => {
      beforeEach(() => {
        hiddenValue = true
      })

      it('should return false', () => {
        expect(isDocumentVisible()).toBe(false)
      })
    })
  })

  describe('subscribeVisibility', () => {
    let listener: jest.Mock
    let unsubscribe: () => void

    beforeEach(() => {
      listener = jest.fn()
    })

    describe('and the document transitions to hidden', () => {
      beforeEach(() => {
        unsubscribe = subscribeVisibility(listener)
        hiddenValue = true
        document.dispatchEvent(new Event('visibilitychange'))
      })

      afterEach(() => {
        unsubscribe()
      })

      it('should invoke the listener with false', () => {
        expect(listener).toHaveBeenCalledWith(false)
      })
    })

    describe('and the document transitions back to visible', () => {
      beforeEach(() => {
        hiddenValue = true
        unsubscribe = subscribeVisibility(listener)
        hiddenValue = false
        document.dispatchEvent(new Event('visibilitychange'))
      })

      afterEach(() => {
        unsubscribe()
      })

      it('should invoke the listener with true', () => {
        expect(listener).toHaveBeenCalledWith(true)
      })
    })

    describe('and the subscription is released before a visibility change', () => {
      beforeEach(() => {
        unsubscribe = subscribeVisibility(listener)
        unsubscribe()
        hiddenValue = true
        document.dispatchEvent(new Event('visibilitychange'))
      })

      it('should not invoke the listener', () => {
        expect(listener).not.toHaveBeenCalled()
      })
    })

    describe('and the same listener reference is subscribed twice', () => {
      let unsubscribeA: () => void
      let unsubscribeB: () => void

      beforeEach(() => {
        unsubscribeA = subscribeVisibility(listener)
        unsubscribeB = subscribeVisibility(listener)
        hiddenValue = true
        document.dispatchEvent(new Event('visibilitychange'))
      })

      afterEach(() => {
        unsubscribeA()
        unsubscribeB()
      })

      it('should deduplicate and invoke the listener only once', () => {
        expect(listener).toHaveBeenCalledTimes(1)
      })
    })

    describe('and the last subscriber leaves', () => {
      let addSpy: jest.SpyInstance
      let removeSpy: jest.SpyInstance

      beforeEach(() => {
        addSpy = jest.spyOn(document, 'addEventListener')
        removeSpy = jest.spyOn(document, 'removeEventListener')
      })

      it('should attach the visibilitychange listener on subscribe', () => {
        const release = subscribeVisibility(() => undefined)

        expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))

        release()
      })

      it('should detach the visibilitychange listener on the last unsubscribe', () => {
        const release = subscribeVisibility(() => undefined)

        release()

        expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
      })
    })
  })
})
