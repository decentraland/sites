import { buildAndroidIntentUrl, launchMobileApp } from './mobileAppLaunch'

describe('buildAndroidIntentUrl', () => {
  describe('when the deep link carries a jump target', () => {
    it('should keep the route and query on the intent url', () => {
      const url = buildAndroidIntentUrl('decentraland://open?position=10%2C20', 'https://play.test/store')

      expect(url.startsWith('intent://open?position=10%2C20#Intent;')).toBe(true)
    })

    it('should name the scheme and the explorer package so chrome can resolve it', () => {
      const url = buildAndroidIntentUrl('decentraland://open?position=10%2C20', 'https://play.test/store')

      expect(url).toContain('scheme=decentraland')
      expect(url).toContain('package=org.decentraland.godotexplorer')
      expect(url.endsWith(';end')).toBe(true)
    })

    it('should percent-encode the fallback url so its own query cannot break the intent', () => {
      const url = buildAndroidIntentUrl('decentraland://open', 'https://play.test/store?id=dcl&referrer=utm_source%3Dfdn')

      expect(url).toContain(`S.browser_fallback_url=${encodeURIComponent('https://play.test/store?id=dcl&referrer=utm_source%3Dfdn')}`)
      expect(url).not.toContain('store?id=dcl&referrer')
    })
  })

  describe('when the deep link has no query', () => {
    it('should still produce a routable intent url', () => {
      expect(buildAndroidIntentUrl('decentraland://open', 'https://store')).toBe(
        'intent://open#Intent;scheme=decentraland;package=org.decentraland.godotexplorer;S.browser_fallback_url=https%3A%2F%2Fstore;end'
      )
    })
  })
})

describe('launchMobileApp', () => {
  const deepLink = 'decentraland://open?position=10%2C20'
  const storeUrl = 'https://store.test/app'
  let openSpy: jest.SpyInstance

  beforeEach(() => {
    jest.useFakeTimers()
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  describe('when the device is not android', () => {
    it('should fire the bare protocol url', async () => {
      const launch = launchMobileApp({ deepLink, storeUrl, isAndroid: false })
      jest.advanceTimersByTime(1500)
      await launch

      expect(openSpy).toHaveBeenCalledWith(deepLink, '_self')
    })
  })

  describe('when the device is android', () => {
    it('should fire the intent url so chrome owns the no-app case', async () => {
      const launch = launchMobileApp({ deepLink, storeUrl, isAndroid: true })
      jest.advanceTimersByTime(1500)
      await launch

      expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('intent://open?position=10%2C20'), '_self')
    })
  })

  describe('when the page never loses focus', () => {
    it('should resolve false so the caller falls back to the store', async () => {
      const launch = launchMobileApp({ deepLink, storeUrl, isAndroid: false })
      jest.advanceTimersByTime(1500)

      await expect(launch).resolves.toBe(false)
    })

    it('should not resolve before the timeout, so a slow app switch still counts', async () => {
      const onResolved = jest.fn()
      launchMobileApp({ deepLink, storeUrl, isAndroid: false }).then(onResolved)

      jest.advanceTimersByTime(1400)
      await Promise.resolve()
      expect(onResolved).not.toHaveBeenCalled()
    })
  })

  describe('when the page is hidden before the timeout', () => {
    it('should resolve true', async () => {
      const launch = launchMobileApp({ deepLink, storeUrl, isAndroid: false })

      jest.spyOn(document, 'hidden', 'get').mockReturnValue(true)
      document.dispatchEvent(new Event('visibilitychange'))
      jest.advanceTimersByTime(1500)

      await expect(launch).resolves.toBe(true)
    })

    it('should ignore a visibility change that leaves the page visible', async () => {
      const launch = launchMobileApp({ deepLink, storeUrl, isAndroid: false })

      jest.spyOn(document, 'hidden', 'get').mockReturnValue(false)
      document.dispatchEvent(new Event('visibilitychange'))
      jest.advanceTimersByTime(1500)

      await expect(launch).resolves.toBe(false)
    })
  })

  describe('when the page is unloaded before the timeout', () => {
    it('should resolve true on pagehide', async () => {
      const launch = launchMobileApp({ deepLink, storeUrl, isAndroid: false })

      window.dispatchEvent(new Event('pagehide'))
      jest.advanceTimersByTime(1500)

      await expect(launch).resolves.toBe(true)
    })

    it('should resolve true on blur, which is what ios reports on an app switch', async () => {
      const launch = launchMobileApp({ deepLink, storeUrl, isAndroid: false })

      window.dispatchEvent(new Event('blur'))
      jest.advanceTimersByTime(1500)

      await expect(launch).resolves.toBe(true)
    })
  })

  describe('when the navigation throws', () => {
    it('should resolve false immediately instead of waiting out the timeout', async () => {
      openSpy.mockImplementation(() => {
        throw new Error('blocked scheme')
      })

      await expect(launchMobileApp({ deepLink, storeUrl, isAndroid: false })).resolves.toBe(false)
    })
  })

  describe('when a custom timeout is provided', () => {
    it('should honor it', async () => {
      const launch = launchMobileApp({ deepLink, storeUrl, isAndroid: false, timeoutMs: 100 })
      jest.advanceTimersByTime(100)

      await expect(launch).resolves.toBe(false)
    })
  })

  describe('once it settles', () => {
    it('should stop listening so a later app switch cannot flip a resolved attempt', async () => {
      const removeSpy = jest.spyOn(window, 'removeEventListener')
      const launch = launchMobileApp({ deepLink, storeUrl, isAndroid: false })
      jest.advanceTimersByTime(1500)
      await launch

      expect(removeSpy).toHaveBeenCalledWith('pagehide', expect.any(Function))
      expect(removeSpy).toHaveBeenCalledWith('blur', expect.any(Function))
    })
  })
})
