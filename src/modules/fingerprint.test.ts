// Asserts the snake_case analytics field names produced by the module.
/* eslint-disable @typescript-eslint/naming-convention */
import { collectClientFingerprint } from './fingerprint'

describe('collectClientFingerprint', () => {
  let originalScreen: PropertyDescriptor | undefined
  let originalDpr: PropertyDescriptor | undefined
  let originalNavigatorLanguage: PropertyDescriptor | undefined
  let originalHardwareConcurrency: PropertyDescriptor | undefined
  let originalPlatform: PropertyDescriptor | undefined

  beforeEach(() => {
    originalScreen = Object.getOwnPropertyDescriptor(window, 'screen')
    originalDpr = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio')
    originalNavigatorLanguage = Object.getOwnPropertyDescriptor(window.navigator, 'language')
    originalHardwareConcurrency = Object.getOwnPropertyDescriptor(window.navigator, 'hardwareConcurrency')
    originalPlatform = Object.getOwnPropertyDescriptor(window.navigator, 'platform')
  })

  afterEach(() => {
    if (originalScreen) Object.defineProperty(window, 'screen', originalScreen)
    if (originalDpr) Object.defineProperty(window, 'devicePixelRatio', originalDpr)
    if (originalNavigatorLanguage) Object.defineProperty(window.navigator, 'language', originalNavigatorLanguage)
    if (originalHardwareConcurrency) Object.defineProperty(window.navigator, 'hardwareConcurrency', originalHardwareConcurrency)
    if (originalPlatform) Object.defineProperty(window.navigator, 'platform', originalPlatform)
  })

  describe('when called in a normal browser environment', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'screen', {
        configurable: true,
        value: { width: 1920, height: 1080, colorDepth: 24 }
      })
      Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 })
      Object.defineProperty(window.navigator, 'language', { configurable: true, value: 'en-US' })
      Object.defineProperty(window.navigator, 'hardwareConcurrency', { configurable: true, value: 8 })
      Object.defineProperty(window.navigator, 'platform', { configurable: true, value: 'MacIntel' })
    })

    it('should populate every field from the browser primitives', () => {
      const fp = collectClientFingerprint()

      expect(fp).not.toBeNull()
      expect(fp).toMatchObject({
        screen_width: 1920,
        screen_height: 1080,
        device_pixel_ratio: 2,
        color_depth: 24,
        hardware_concurrency: 8,
        language: 'en-US',
        platform: 'MacIntel'
      })
    })

    it('should include the IANA timezone when Intl exposes it', () => {
      const fp = collectClientFingerprint()
      // jsdom resolves to a real timezone (host's). We just assert it's a string.
      expect(typeof fp?.timezone).toBe('string')
      expect(fp?.timezone?.length ?? 0).toBeGreaterThan(0)
    })

    it('should report the timezone offset as a number', () => {
      const fp = collectClientFingerprint()
      expect(typeof fp?.timezone_offset_minutes).toBe('number')
      expect(Number.isFinite(fp?.timezone_offset_minutes)).toBe(true)
    })
  })

  describe('when individual browser fields are missing', () => {
    it('should fall back to safe defaults rather than crashing', () => {
      Object.defineProperty(window, 'screen', { configurable: true, value: undefined })
      Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: undefined })
      Object.defineProperty(window.navigator, 'hardwareConcurrency', { configurable: true, value: undefined })
      Object.defineProperty(window.navigator, 'language', { configurable: true, value: undefined })
      Object.defineProperty(window.navigator, 'platform', { configurable: true, value: undefined })

      const fp = collectClientFingerprint()

      expect(fp).toMatchObject({
        screen_width: 0,
        screen_height: 0,
        device_pixel_ratio: 1,
        color_depth: 0,
        hardware_concurrency: 0,
        language: null,
        platform: null
      })
    })
  })
})
