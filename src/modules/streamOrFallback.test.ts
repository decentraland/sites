import { OperativeSystem } from '../types/download.types'
import {
  ESTIMATE_MAX_HOLD_MS,
  ESTIMATE_MIN_HOLD_MS,
  FALLBACK_LOADER_HOLD_MS,
  estimateDownloadHoldMs,
  streamOrFallback
} from './streamOrFallback'

const mockTriggerFileDownload = jest.fn()
const mockDownloadFileWithProgress = jest.fn()

jest.mock('./file', () => ({
  triggerFileDownload: (...args: unknown[]) => mockTriggerFileDownload(...args),
  downloadFileWithProgress: (...args: unknown[]) => mockDownloadFileWithProgress(...args)
}))

const buildHeadResponse = (contentLength: string | null, ok = true): Response =>
  ({
    ok,
    headers: { get: (name: string) => (name.toLowerCase() === 'content-length' ? contentLength : null) }
  }) as unknown as Response

const setNavigatorConnection = (downlink: number | undefined): void => {
  Object.defineProperty(window.navigator, 'connection', {
    configurable: true,
    value: downlink !== undefined ? { downlink } : undefined
  })
}

const clearNavigatorConnection = (): void => {
  Object.defineProperty(window.navigator, 'connection', { configurable: true, value: undefined })
}

describe('estimateDownloadHoldMs', () => {
  let mockFetch: jest.Mock

  beforeEach(() => {
    mockFetch = jest.fn()
    global.fetch = mockFetch as unknown as typeof fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
    clearNavigatorConnection()
  })

  describe('when the HEAD request returns a Content-Length and the browser exposes downlink', () => {
    beforeEach(() => {
      // 80 MB in bytes — the macOS DMG ballpark.
      mockFetch.mockResolvedValue(buildHeadResponse(String(80 * 1024 * 1024)))
    })

    it('should compute a hold proportional to size / downlink with the safety margin applied', async () => {
      // 100 Mbps → 80MB ≈ 6.4s pure transfer + safety margin (~1.5s) → ~7.9s.
      setNavigatorConnection(100)
      const ms = await estimateDownloadHoldMs('https://example.com/file.dmg')
      expect(ms).toBeGreaterThanOrEqual(7000)
      expect(ms).toBeLessThanOrEqual(9000)
    })

    it('should produce a longer hold for a slower connection at the same size', async () => {
      // 5 Mbps → 80MB ≈ 128s pure transfer, way over ESTIMATE_MAX_HOLD_MS.
      setNavigatorConnection(5)
      const ms = await estimateDownloadHoldMs('https://example.com/file.dmg')
      expect(ms).toBe(ESTIMATE_MAX_HOLD_MS)
    })
  })

  describe('when the HEAD request fails', () => {
    it('should return the minimum hold instead of guessing', async () => {
      mockFetch.mockRejectedValue(new TypeError('CORS blocked'))
      setNavigatorConnection(50)

      const ms = await estimateDownloadHoldMs('https://example.com/file.dmg')

      expect(ms).toBe(ESTIMATE_MIN_HOLD_MS)
    })
  })

  describe('when the HEAD response is non-2xx (403, 405, etc.)', () => {
    it('should treat it like a missing Content-Length and return the minimum hold', async () => {
      mockFetch.mockResolvedValue(buildHeadResponse(String(80 * 1024 * 1024), false))
      setNavigatorConnection(50)

      const ms = await estimateDownloadHoldMs('https://example.com/file.dmg')

      expect(ms).toBe(ESTIMATE_MIN_HOLD_MS)
    })
  })

  describe('when the HEAD response omits Content-Length', () => {
    it('should return the minimum hold', async () => {
      mockFetch.mockResolvedValue(buildHeadResponse(null))
      setNavigatorConnection(50)

      const ms = await estimateDownloadHoldMs('https://example.com/file.dmg')

      expect(ms).toBe(ESTIMATE_MIN_HOLD_MS)
    })
  })

  describe('when the browser does not expose navigator.connection (Safari, Firefox)', () => {
    it('should fall back to the default downlink and still produce an adaptive hold', async () => {
      // 10 MB at the default 25 Mbps ≈ 3.2s pure transfer + safety margin.
      // Sized to land between MIN and MAX so the assertion exercises the
      // adaptive arithmetic rather than the clamps.
      mockFetch.mockResolvedValue(buildHeadResponse(String(10 * 1024 * 1024)))
      clearNavigatorConnection()

      const ms = await estimateDownloadHoldMs('https://example.com/file.dmg')

      expect(ms).toBeGreaterThan(ESTIMATE_MIN_HOLD_MS)
      expect(ms).toBeLessThan(ESTIMATE_MAX_HOLD_MS)
    })
  })

  describe('when the file is tiny', () => {
    it('should clamp to the minimum hold so the modal does not vanish instantly', async () => {
      mockFetch.mockResolvedValue(buildHeadResponse('512')) // 512 bytes
      setNavigatorConnection(100)

      const ms = await estimateDownloadHoldMs('https://example.com/file.dmg')

      expect(ms).toBe(ESTIMATE_MIN_HOLD_MS)
    })
  })
})

describe('streamOrFallback', () => {
  let abortController: AbortController
  let onProgress: jest.Mock
  let mockFetch: jest.Mock

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['performance', 'Date'] })
    abortController = new AbortController()
    onProgress = jest.fn()
    mockFetch = jest.fn().mockResolvedValue(buildHeadResponse(null))
    global.fetch = mockFetch as unknown as typeof fetch
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.resetAllMocks()
    clearNavigatorConnection()
  })

  describe('when the OS is macOS', () => {
    it('should use the native anchor to preserve the kMDItemWhereFroms xattr', async () => {
      const promise = streamOrFallback({
        url: 'https://example.com/file.dmg',
        filename: 'Decentraland-Installer.dmg',
        os: OperativeSystem.MACOS,
        signal: abortController.signal,
        onProgress
      })

      // Drain the HEAD round-trip and the timer.
      await jest.advanceTimersByTimeAsync(ESTIMATE_MAX_HOLD_MS)
      await promise

      expect(mockTriggerFileDownload).toHaveBeenCalledWith('https://example.com/file.dmg', 'Decentraland-Installer.dmg')
      expect(mockDownloadFileWithProgress).not.toHaveBeenCalled()
    })

    it('should HEAD the URL to get Content-Length for the adaptive estimate', async () => {
      const promise = streamOrFallback({
        url: 'https://example.com/file.dmg',
        filename: 'Decentraland-Installer.dmg',
        os: OperativeSystem.MACOS,
        signal: abortController.signal,
        onProgress
      })

      await jest.advanceTimersByTimeAsync(ESTIMATE_MAX_HOLD_MS)
      await promise

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/file.dmg', expect.objectContaining({ method: 'HEAD' }))
    })

    it('should hold for at least ESTIMATE_MIN_HOLD_MS when HEAD provides no size signal', async () => {
      mockFetch.mockResolvedValue(buildHeadResponse(null))

      let resolved = false
      streamOrFallback({
        url: 'https://example.com/file.dmg',
        filename: 'Decentraland-Installer.dmg',
        os: OperativeSystem.MACOS,
        signal: abortController.signal,
        onProgress
      }).then(() => {
        resolved = true
      })

      await jest.advanceTimersByTimeAsync(ESTIMATE_MIN_HOLD_MS - 1)
      expect(resolved).toBe(false)

      await jest.advanceTimersByTimeAsync(2)
      expect(resolved).toBe(true)
    })

    it('should resolve promptly when the signal aborts mid-hold', async () => {
      // Long estimated hold so the test exercises a real wait window:
      // 80 MB at 5 Mbps caps at MAX_HOLD_MS.
      mockFetch.mockResolvedValue(buildHeadResponse(String(80 * 1024 * 1024)))
      setNavigatorConnection(5)

      let resolved = false
      streamOrFallback({
        url: 'https://example.com/file.dmg',
        filename: 'Decentraland-Installer.dmg',
        os: OperativeSystem.MACOS,
        signal: abortController.signal,
        onProgress
      }).then(() => {
        resolved = true
      })

      // Let the HEAD resolve and the sleep get scheduled, then verify we are
      // mid-hold (not yet resolved).
      await jest.advanceTimersByTimeAsync(ESTIMATE_MIN_HOLD_MS)
      expect(resolved).toBe(false)

      // Abort while still inside the hold.
      abortController.abort()
      await jest.advanceTimersByTimeAsync(0)

      // Should resolve now without needing to advance through the rest of
      // the long hold.
      expect(resolved).toBe(true)
    })
  })

  describe('when the OS is Windows', () => {
    describe('and the streamed fetch succeeds', () => {
      beforeEach(() => {
        mockDownloadFileWithProgress.mockResolvedValue(undefined)
      })

      it('should use downloadFileWithProgress and skip the native anchor', async () => {
        await streamOrFallback({
          url: 'https://example.com/file.exe',
          filename: 'Decentraland-Installer.exe',
          os: OperativeSystem.WINDOWS,
          signal: abortController.signal,
          onProgress
        })

        expect(mockDownloadFileWithProgress).toHaveBeenCalledTimes(1)
        expect(mockTriggerFileDownload).not.toHaveBeenCalled()
      })

      it('should report progress capped at 99 while the transfer is in flight', async () => {
        mockDownloadFileWithProgress.mockImplementation(
          async (_url: string, _filename: string, progressCb: (p: { loaded: number; total: number }) => void) => {
            progressCb({ loaded: 50, total: 100 })
            progressCb({ loaded: 100, total: 100 })
          }
        )

        await streamOrFallback({
          url: 'https://example.com/file.exe',
          filename: 'Decentraland-Installer.exe',
          os: OperativeSystem.WINDOWS,
          signal: abortController.signal,
          onProgress
        })

        expect(onProgress).toHaveBeenNthCalledWith(1, 50)
        expect(onProgress).toHaveBeenNthCalledWith(2, 99)
      })

      it('should suppress progress updates after the signal aborts', async () => {
        mockDownloadFileWithProgress.mockImplementation(
          async (_url: string, _filename: string, progressCb: (p: { loaded: number; total: number }) => void) => {
            progressCb({ loaded: 25, total: 100 })
            abortController.abort()
            progressCb({ loaded: 75, total: 100 })
          }
        )

        await streamOrFallback({
          url: 'https://example.com/file.exe',
          filename: 'Decentraland-Installer.exe',
          os: OperativeSystem.WINDOWS,
          signal: abortController.signal,
          onProgress
        })

        expect(onProgress).toHaveBeenCalledTimes(1)
        expect(onProgress).toHaveBeenCalledWith(25)
      })

      it('should suppress progress updates when the response has no Content-Length', async () => {
        mockDownloadFileWithProgress.mockImplementation(
          async (_url: string, _filename: string, progressCb: (p: { loaded: number; total: number }) => void) => {
            progressCb({ loaded: 1024, total: 0 })
          }
        )

        await streamOrFallback({
          url: 'https://example.com/file.exe',
          filename: 'Decentraland-Installer.exe',
          os: OperativeSystem.WINDOWS,
          signal: abortController.signal,
          onProgress
        })

        expect(onProgress).not.toHaveBeenCalled()
      })
    })

    describe('and the streamed fetch fails', () => {
      beforeEach(() => {
        mockDownloadFileWithProgress.mockRejectedValue(new Error('CORS blocked'))
        jest.spyOn(console, 'warn').mockImplementation(() => {})
      })

      it('should fall back to the native anchor and hold the backdrop for FALLBACK_LOADER_HOLD_MS', async () => {
        const promise = streamOrFallback({
          url: 'https://example.com/file.exe',
          filename: 'Decentraland-Installer.exe',
          os: OperativeSystem.WINDOWS,
          signal: abortController.signal,
          onProgress
        })

        await jest.advanceTimersByTimeAsync(FALLBACK_LOADER_HOLD_MS)
        await promise

        expect(mockTriggerFileDownload).toHaveBeenCalledWith('https://example.com/file.exe', 'Decentraland-Installer.exe')
      })

      it('should rethrow when the failure is due to the signal being aborted', async () => {
        const abortError = new Error('AbortError')
        abortError.name = 'AbortError'
        mockDownloadFileWithProgress.mockRejectedValue(abortError)
        abortController.abort()

        await expect(
          streamOrFallback({
            url: 'https://example.com/file.exe',
            filename: 'Decentraland-Installer.exe',
            os: OperativeSystem.WINDOWS,
            signal: abortController.signal,
            onProgress
          })
        ).rejects.toThrow('AbortError')

        expect(mockTriggerFileDownload).not.toHaveBeenCalled()
      })
    })
  })
})
