import { resolveDownloadBrowser } from './DownloadSuccess.helpers'
import { DownloadBrowser } from './DownloadSuccess.types'

// Runs the real @dcl/hooks detection (no mock): it guards the hooks version the page relies on to tell Brave apart.
const CHROME_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// The hook caches its result per module instance, so every case loads a fresh copy (with its own React).
const detectBrowserName = async (): Promise<string | undefined> => {
  jest.resetModules()
  // The /pure entry does not register its own afterEach, which is not allowed inside a test.
  const { renderHook, waitFor, cleanup } = await import('@testing-library/react/pure')
  const { useAdvancedUserAgentData } = await import('@dcl/hooks')
  const { result } = renderHook(() => useAdvancedUserAgentData())

  await waitFor(() => expect(result.current[0]).toBe(false))
  const name = result.current[1]?.browser.name
  cleanup()

  return name
}

describe('when the real browser detection runs with a Chrome user agent', () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', { value: CHROME_USER_AGENT, configurable: true })
    // The Apple silicon check draws on a canvas, which jsdom does not implement.
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    delete (window.navigator as unknown as Record<string, unknown>).userAgent
    delete (window.navigator as unknown as Record<string, unknown>).brave
  })

  describe('and navigator.brave exists', () => {
    beforeEach(() => {
      Object.defineProperty(window.navigator, 'brave', { value: { isBrave: () => Promise.resolve(true) }, configurable: true })
    })

    it('should detect Brave', async () => {
      const name = await detectBrowserName()

      expect(name).toBe('Brave')
      expect(resolveDownloadBrowser(name)).toBe(DownloadBrowser.BRAVE)
    })
  })

  describe('and navigator.brave does not exist', () => {
    it('should detect Chrome', async () => {
      const name = await detectBrowserName()

      expect(name).toBe('Chrome')
      expect(resolveDownloadBrowser(name)).toBe(DownloadBrowser.CHROME)
    })
  })
})
