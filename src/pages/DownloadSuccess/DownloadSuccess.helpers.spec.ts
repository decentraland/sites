import { OperativeSystem } from '../../types/download.types'
import { getStepOneVariant, resolveDownloadBrowser } from './DownloadSuccess.helpers'
import { DownloadBrowser } from './DownloadSuccess.types'

// Step 1 images export their file name in jest (see jest.config.ts), so the matrix asserts each image together with its coordinates.
const MACOS_CHROME = { image: 'macos-chrome-step1.webp', highlight: { x: 73.54, y: 44.06 } }
const MACOS_OPERA = { image: 'macos-opera-step1.webp', highlight: { x: 55.84, y: 39.79 } }
const MACOS_SAFARI = { image: 'macos-safari-step1.webp', highlight: { x: 56.28, y: 27.08 } }
const WINDOWS_CHROME = { image: 'windows-chrome-step1.webp', highlight: { x: 70.37, y: 46.35 } }
const WINDOWS_OPERA = { image: 'windows-opera-step1.webp', highlight: { x: 55.84, y: 43.54 } }
const WINDOWS_EDGE = { image: 'windows-edge-step1.webp', highlight: { x: 65.1, y: 38.12 } }

describe('when resolving the download browser from a detected name', () => {
  describe.each([
    ['Chrome', DownloadBrowser.CHROME],
    ['Firefox', DownloadBrowser.FIREFOX],
    ['Brave', DownloadBrowser.BRAVE],
    ['Opera', DownloadBrowser.OPERA],
    ['Edge', DownloadBrowser.EDGE],
    ['Safari', DownloadBrowser.SAFARI]
  ])('and the name is %s', (name, expected) => {
    it('should resolve that browser', () => {
      expect(resolveDownloadBrowser(name)).toBe(expected)
    })
  })

  describe.each([
    ['Mobile Safari', DownloadBrowser.SAFARI],
    ['Mobile Firefox', DownloadBrowser.FIREFOX],
    ['Mobile Chrome', DownloadBrowser.CHROME],
    ['Opera GX', DownloadBrowser.OPERA],
    ['brave', DownloadBrowser.BRAVE]
  ])('and the name is %s', (name, expected) => {
    it('should resolve it to its base browser', () => {
      expect(resolveDownloadBrowser(name)).toBe(expected)
    })
  })

  describe.each([[undefined], [''], ['Unknown'], ['Chromium'], ['Samsung Browser'], ['DuckDuckGo']])('and the name is %p', name => {
    it('should fall back to Chrome', () => {
      expect(resolveDownloadBrowser(name)).toBe(DownloadBrowser.CHROME)
    })
  })
})

describe('when selecting the Step 1 variant', () => {
  describe.each([
    [OperativeSystem.MACOS, DownloadBrowser.CHROME, MACOS_CHROME],
    [OperativeSystem.MACOS, DownloadBrowser.OPERA, MACOS_OPERA],
    [OperativeSystem.MACOS, DownloadBrowser.SAFARI, MACOS_SAFARI],
    // macOS Edge reuses the Windows Edge image
    [OperativeSystem.MACOS, DownloadBrowser.EDGE, WINDOWS_EDGE],
    [OperativeSystem.WINDOWS, DownloadBrowser.CHROME, WINDOWS_CHROME],
    [OperativeSystem.WINDOWS, DownloadBrowser.OPERA, WINDOWS_OPERA],
    [OperativeSystem.WINDOWS, DownloadBrowser.EDGE, WINDOWS_EDGE],
    // no Windows Safari exists: it shows the Windows Chrome image
    [OperativeSystem.WINDOWS, DownloadBrowser.SAFARI, WINDOWS_CHROME]
  ])('and the OS is %s and the browser is %s', (os, browser, expected) => {
    it('should return its image together with the highlight centered on its download icon', () => {
      expect(getStepOneVariant(os, browser)).toEqual(expected)
    })
  })

  // Firefox and Brave Step 1 images are still being designed. Replace each todo with the
  // matrix rows above (own image + measured highlight) when their entries land in the helpers.
  describe.each([
    [OperativeSystem.MACOS, DownloadBrowser.FIREFOX],
    [OperativeSystem.MACOS, DownloadBrowser.BRAVE],
    [OperativeSystem.WINDOWS, DownloadBrowser.FIREFOX],
    [OperativeSystem.WINDOWS, DownloadBrowser.BRAVE]
  ])('and the OS is %s and the browser is %s', (os, browser) => {
    it.todo(`should return its own image and a measured highlight (${os} ${browser}: no asset yet)`)

    it('should return the Chrome variant of that OS while it has no asset', () => {
      const chrome = getStepOneVariant(os, DownloadBrowser.CHROME)

      expect(getStepOneVariant(os, browser)).toBe(chrome)
    })
  })

  describe('and every OS and browser combination is requested', () => {
    const operativeSystems = Object.values(OperativeSystem)
    const browsers = Object.values(DownloadBrowser)

    it('should use a different image file for each distinct variant', () => {
      const images = new Set(operativeSystems.flatMap(os => browsers.map(browser => getStepOneVariant(os, browser).image)))

      expect(images).toEqual(
        new Set([MACOS_CHROME, MACOS_OPERA, MACOS_SAFARI, WINDOWS_CHROME, WINDOWS_OPERA, WINDOWS_EDGE].map(({ image }) => image))
      )
    })

    it('should always return an image and a highlight inside the image', () => {
      operativeSystems.forEach(os =>
        browsers.forEach(browser => {
          const { image, highlight } = getStepOneVariant(os, browser)

          expect(image).toBeTruthy()
          expect(highlight.x).toBeGreaterThan(0)
          expect(highlight.x).toBeLessThan(100)
          expect(highlight.y).toBeGreaterThan(0)
          expect(highlight.y).toBeLessThan(100)
        })
      )
    })
  })
})
