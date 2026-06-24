import { DOWNLOAD_URLS, detectDownloadOS, getDownloadUrl } from './downloadConstants'
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
