import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DownloadPlace } from '../src/modules/segment.types'

const SCRIPT = readFileSync(join(__dirname, 'hero-shell-os.js'), 'utf8')

type NavigatorStub = { userAgent: string; platform?: string; maxTouchPoints?: number }

const WINDOWS_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const LINUX_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

const stubNavigator = (key: string, value: unknown) => Object.defineProperty(window.navigator, key, { configurable: true, value })

const runScript = ({ userAgent, platform, maxTouchPoints = 0 }: NavigatorStub) => {
  stubNavigator('userAgent', userAgent)
  stubNavigator('maxTouchPoints', maxTouchPoints)
  stubNavigator('userAgentData', platform === undefined ? undefined : { platform })
  new Function(SCRIPT)()
}

const getButton = () => document.querySelector<HTMLAnchorElement>('#hero-shell .hero-download-btn')

describe('when the hero shell OS script runs', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="hero-shell"><a class="hero-download-btn" href="/download">DOWNLOAD FOR</a></div>'
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    for (const key of ['userAgent', 'maxTouchPoints', 'userAgentData']) {
      delete (window.navigator as unknown as Record<string, unknown>)[key]
    }
  })

  describe('and the browser is on Windows', () => {
    it('should point the button straight at the Windows download and tag it for the icon', () => {
      runScript({ userAgent: WINDOWS_UA, platform: 'Windows' })

      expect(getButton()?.getAttribute('href')).toBe('/download_success?os=Windows&place=landing-hero')
      expect(getButton()?.dataset.os).toBe('Windows')
    })
  })

  describe('and Client Hints are not available on Windows', () => {
    it('should detect Windows from the user agent string', () => {
      runScript({ userAgent: WINDOWS_UA })

      expect(getButton()?.dataset.os).toBe('Windows')
    })
  })

  describe('and the browser is on macOS', () => {
    it('should point the button straight at the macOS download', () => {
      runScript({ userAgent: MAC_UA })

      expect(getButton()?.getAttribute('href')).toBe('/download_success?os=macOS&place=landing-hero')
      expect(getButton()?.dataset.os).toBe('macOS')
    })
  })

  describe('and Client Hints report macOS', () => {
    it('should point the button straight at the macOS download', () => {
      runScript({ userAgent: MAC_UA, platform: 'macOS' })

      expect(getButton()?.dataset.os).toBe('macOS')
    })
  })

  describe('and Client Hints report a platform without a desktop installer under a Windows user agent', () => {
    it('should trust the Client Hints and leave the button on the download page', () => {
      runScript({ userAgent: WINDOWS_UA, platform: 'Android' })

      expect(getButton()?.getAttribute('href')).toBe('/download')
      expect(getButton()?.dataset.os).toBeUndefined()
    })
  })

  describe('and the device is an iPad reporting a Macintosh user agent', () => {
    it('should leave the button on the download page', () => {
      runScript({ userAgent: MAC_UA, maxTouchPoints: 5 })

      expect(getButton()?.getAttribute('href')).toBe('/download')
      expect(getButton()?.dataset.os).toBeUndefined()
    })
  })

  describe('and the OS has no desktop installer', () => {
    it('should leave the button on the download page', () => {
      runScript({ userAgent: LINUX_UA, platform: 'Linux' })

      expect(getButton()?.getAttribute('href')).toBe('/download')
      expect(getButton()?.dataset.os).toBeUndefined()
    })
  })

  describe('and the page carries partner campaign params', () => {
    it('should forward only the utm params to the download link', () => {
      window.history.replaceState(null, '', '/?utm_source=shefi&utm_campaign=q4&ref=abc&os=macOS')

      runScript({ userAgent: WINDOWS_UA, platform: 'Windows' })

      expect(getButton()?.getAttribute('href')).toBe('/download_success?os=Windows&place=landing-hero&utm_source=shefi&utm_campaign=q4')
    })
  })

  describe('and the place it reports is checked against the app', () => {
    it('should match the place the React hero sends', () => {
      runScript({ userAgent: WINDOWS_UA, platform: 'Windows' })

      const href = new URL(getButton()?.getAttribute('href') ?? '', 'https://decentraland.org')
      expect(href.searchParams.get('place')).toBe(DownloadPlace.LANDING_HERO)
    })
  })

  describe('and the shell is not on the page', () => {
    it('should do nothing', () => {
      document.body.innerHTML = ''

      expect(() => runScript({ userAgent: WINDOWS_UA })).not.toThrow()
    })
  })
})
