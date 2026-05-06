import { OperativeSystem } from '../types/download.types'
import { FALLBACK_LOADER_HOLD_MS, streamOrFallback } from './streamOrFallback'

const mockTriggerFileDownload = jest.fn()
const mockDownloadFileWithProgress = jest.fn()

jest.mock('./file', () => ({
  triggerFileDownload: (...args: unknown[]) => mockTriggerFileDownload(...args),
  downloadFileWithProgress: (...args: unknown[]) => mockDownloadFileWithProgress(...args)
}))

describe('streamOrFallback', () => {
  let abortController: AbortController
  let onProgress: jest.Mock

  beforeEach(() => {
    jest.useFakeTimers()
    abortController = new AbortController()
    onProgress = jest.fn()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.resetAllMocks()
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

      jest.advanceTimersByTime(FALLBACK_LOADER_HOLD_MS)
      await promise

      expect(mockTriggerFileDownload).toHaveBeenCalledWith('https://example.com/file.dmg', 'Decentraland-Installer.dmg')
      expect(mockDownloadFileWithProgress).not.toHaveBeenCalled()
    })

    it('should hold the backdrop for FALLBACK_LOADER_HOLD_MS before resolving', async () => {
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

      // Drain the microtask that schedules the timer, then advance just
      // below the threshold — the hold should still be pending.
      await jest.advanceTimersByTimeAsync(FALLBACK_LOADER_HOLD_MS - 1)
      expect(resolved).toBe(false)

      await jest.advanceTimersByTimeAsync(1)
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

        // Drain the rejected fetch promise, then advance through the hold.
        await Promise.resolve()
        await Promise.resolve()
        jest.advanceTimersByTime(FALLBACK_LOADER_HOLD_MS)
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
