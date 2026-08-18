import { DOWNLOAD_URLS, buildMobileDeepLinkUrl, detectDownloadOS, getDownloadUrl } from './downloadConstants'
import type { DownloadOS } from './downloadConstants'

describe('downloadConstants', () => {
  describe('DOWNLOAD_URLS', () => {
    it('should expose the known store destinations', () => {
      expect(DOWNLOAD_URLS.windows).toBe('https://decentraland.org/download')
      expect(DOWNLOAD_URLS.apple).toBe('https://decentraland.org/download')
      expect(DOWNLOAD_URLS.epic).toContain('store.epicgames.com')
      expect(DOWNLOAD_URLS.googlePlay).toContain('play.google.com')
      expect(DOWNLOAD_URLS.appStore).toContain('apps.apple.com')
    })

    describe('googlePlay', () => {
      afterEach(() => {
        window.history.pushState({}, '', '/')
      })

      it('should default to the static QR-code campaign tag when no campaign params are present', () => {
        expect(DOWNLOAD_URLS.googlePlay).toContain('utm_source=fdn')
        expect(DOWNLOAD_URLS.googlePlay).toContain('utm_medium=qr')
        expect(DOWNLOAD_URLS.googlePlay).toContain('utm_campaign=dclpage')
      })

      it('should carry the visitor incoming campaign instead of the default tag when present', () => {
        window.history.pushState({}, '', '/?utm_source=x&utm_medium=paid&utm_campaign=ad')
        const url = new URL(DOWNLOAD_URLS.googlePlay)
        expect(url.searchParams.get('utm_source')).toBe('x')
        expect(url.searchParams.get('utm_medium')).toBe('paid')
        expect(url.searchParams.get('utm_campaign')).toBe('ad')
        expect(url.searchParams.get('id')).toBe('org.decentraland.godotexplorer')
      })

      it('should mirror the default utm set into the Install Referrer param when no campaign is present', () => {
        const referrer = new URLSearchParams(new URL(DOWNLOAD_URLS.googlePlay).searchParams.get('referrer') ?? '')
        expect(referrer.get('utm_source')).toBe('fdn')
        expect(referrer.get('utm_medium')).toBe('qr')
        expect(referrer.get('utm_campaign')).toBe('dclpage')
      })

      it('should mirror the incoming campaign into the Install Referrer param when present', () => {
        window.history.pushState({}, '', '/?utm_source=x&utm_medium=paid&utm_campaign=ad')
        const referrer = new URLSearchParams(new URL(DOWNLOAD_URLS.googlePlay).searchParams.get('referrer') ?? '')
        expect(referrer.get('utm_source')).toBe('x')
        expect(referrer.get('utm_medium')).toBe('paid')
        expect(referrer.get('utm_campaign')).toBe('ad')
        // Non-utm routing params never leak into the referrer payload.
        expect(referrer.get('id')).toBeNull()
      })
    })
  })

  describe('detectDownloadOS', () => {
    let userAgentSpy: jest.SpyInstance | undefined

    const stubUserAgent = (ua: string) => {
      userAgentSpy = jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(ua)
    }

    afterEach(() => {
      userAgentSpy?.mockRestore()
      userAgentSpy = undefined
    })

    describe('when the user agent is Android', () => {
      beforeEach(() => stubUserAgent('Mozilla/5.0 (Linux; Android 13)'))

      it('should return "android"', () => {
        expect(detectDownloadOS()).toBe('android')
      })
    })

    describe('when the user agent is an iPhone', () => {
      beforeEach(() => stubUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)'))

      it('should return "ios"', () => {
        expect(detectDownloadOS()).toBe('ios')
      })
    })

    describe('when the user agent is an iPad', () => {
      beforeEach(() => stubUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0)'))

      it('should return "ios"', () => {
        expect(detectDownloadOS()).toBe('ios')
      })
    })

    describe('when the user agent is a Mac', () => {
      beforeEach(() => stubUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'))

      it('should return "apple"', () => {
        expect(detectDownloadOS()).toBe('apple')
      })
    })

    describe('when the user agent is Windows', () => {
      beforeEach(() => stubUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'))

      it('should default to "windows"', () => {
        expect(detectDownloadOS()).toBe('windows')
      })
    })

    describe('when navigator is unavailable (SSR / prerender)', () => {
      let originalNavigatorDescriptor: PropertyDescriptor | undefined

      beforeEach(() => {
        originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
        Object.defineProperty(globalThis, 'navigator', { configurable: true, value: undefined })
      })

      afterEach(() => {
        if (originalNavigatorDescriptor) {
          Object.defineProperty(globalThis, 'navigator', originalNavigatorDescriptor)
        }
      })

      it('should default to "windows"', () => {
        expect(detectDownloadOS()).toBe('windows')
      })
    })
  })

  describe('buildMobileDeepLinkUrl', () => {
    it('should point at the /open universal-link handler with the position', () => {
      expect(buildMobileDeepLinkUrl({ position: '10,-20' })).toBe('https://mobile.dclexplorer.com/open?position=10%2C-20')
    })

    it('should carry the realm for world jumps', () => {
      expect(buildMobileDeepLinkUrl({ realm: 'aliceworld' })).toBe('https://mobile.dclexplorer.com/open?realm=aliceworld')
    })

    it('should keep both params when a world jump also has a position', () => {
      const url = new URL(buildMobileDeepLinkUrl({ realm: 'aliceworld', position: '1,2' }))
      expect(url.searchParams.get('realm')).toBe('aliceworld')
      expect(url.searchParams.get('position')).toBe('1,2')
    })

    it('should fall back to the bare handler when there is no destination', () => {
      expect(buildMobileDeepLinkUrl()).toBe('https://mobile.dclexplorer.com/open')
    })
  })

  describe('getDownloadUrl', () => {
    const cases: Array<[DownloadOS, string]> = [
      ['apple', DOWNLOAD_URLS.apple],
      ['ios', DOWNLOAD_URLS.appStore],
      ['android', DOWNLOAD_URLS.googlePlay],
      ['windows', DOWNLOAD_URLS.windows]
    ]

    it.each(cases)('should map "%s" to its store url', (os, expected) => {
      expect(getDownloadUrl(os)).toBe(expected)
    })
  })
})
