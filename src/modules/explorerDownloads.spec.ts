const captureDownloadErrorMock = jest.fn()

jest.mock('./downloadFunnelSentry', () => ({
  captureDownloadError: captureDownloadErrorMock,
  recordDownloadMilestone: jest.fn()
}))

const getEnvMock = jest.fn(() => 'https://counts.example/api' as string | undefined)

jest.mock('../config/env', () => ({ getEnv: getEnvMock }))

const RESPONSE_BODY = {
  values: [
    ['Windows', 300],
    ['Mac', 120]
  ]
}

/**
 * `hasReportedFailure` and the instance cache are static, so state leaks across
 * cases. Re-importing after `resetModules` gives every case a clean class.
 */
const loadExplorerDownloads = async () => {
  jest.resetModules()
  const module = await import('./explorerDownloads')
  return module.ExplorerDownloads
}

const mockFetchOk = (body: unknown = RESPONSE_BODY): jest.Mock =>
  jest.fn().mockResolvedValue({ ok: true, json: async () => body } as unknown as Response)

const mockFetchNetworkError = (): jest.Mock => jest.fn().mockRejectedValue(new TypeError('Failed to fetch'))

beforeEach(() => {
  getEnvMock.mockReturnValue('https://counts.example/api')
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('when the download counts URL is not configured', () => {
  it('should fall back to an empty base URL rather than throwing', async () => {
    getEnvMock.mockReturnValue(undefined)
    global.fetch = mockFetchOk() as unknown as typeof fetch
    const ExplorerDownloads = await loadExplorerDownloads()

    await expect(ExplorerDownloads.get().getTotalDownloads()).resolves.toBe(420)
    expect(global.fetch).toHaveBeenCalledWith('')
  })
})

describe('when the downloads endpoint responds', () => {
  it('should total the platform counts', async () => {
    global.fetch = mockFetchOk() as unknown as typeof fetch
    const ExplorerDownloads = await loadExplorerDownloads()

    await expect(ExplorerDownloads.get().getTotalDownloads()).resolves.toBe(420)
  })

  it('should expose the per-platform counts', async () => {
    global.fetch = mockFetchOk() as unknown as typeof fetch
    const ExplorerDownloads = await loadExplorerDownloads()
    const instance = ExplorerDownloads.get()

    await expect(instance.getWindowsDownloads()).resolves.toBe(300)
    await expect(instance.getMacDownloads()).resolves.toBe(120)
  })

  it('should return zero for a platform that is absent', async () => {
    global.fetch = mockFetchOk({ values: [['Windows', 300]] }) as unknown as typeof fetch
    const ExplorerDownloads = await loadExplorerDownloads()

    await expect(ExplorerDownloads.get().getMacDownloads()).resolves.toBe(0)
  })

  it('should share a single request across concurrent callers', async () => {
    const fetchMock = mockFetchOk()
    global.fetch = fetchMock as unknown as typeof fetch
    const ExplorerDownloads = await loadExplorerDownloads()
    const instance = ExplorerDownloads.get()

    await Promise.all([instance.getTotalDownloads(), instance.getWindowsDownloads(), instance.getMacDownloads()])

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('should return zero when Windows is absent', async () => {
    global.fetch = mockFetchOk({ values: [['Mac', 120]] }) as unknown as typeof fetch
    const ExplorerDownloads = await loadExplorerDownloads()

    await expect(ExplorerDownloads.get().getWindowsDownloads()).resolves.toBe(0)
  })

  it('should reuse the cached instance per URL', async () => {
    global.fetch = mockFetchOk() as unknown as typeof fetch
    const ExplorerDownloads = await loadExplorerDownloads()

    expect(ExplorerDownloads.from('https://a.example')).toBe(ExplorerDownloads.from('https://a.example'))
    expect(ExplorerDownloads.from('https://a.example')).not.toBe(ExplorerDownloads.from('https://b.example'))
  })
})

describe('when the endpoint returns a non-ok status', () => {
  it('should resolve with an empty result instead of rejecting', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 } as unknown as Response) as unknown as typeof fetch
    const ExplorerDownloads = await loadExplorerDownloads()

    await expect(ExplorerDownloads.get().getDownloads()).resolves.toEqual([])
  })
})

describe('when the request fails with a network error', () => {
  it('should resolve with an empty result so the counter just hides', async () => {
    global.fetch = mockFetchNetworkError() as unknown as typeof fetch
    const ExplorerDownloads = await loadExplorerDownloads()

    await expect(ExplorerDownloads.get().getTotalDownloads()).resolves.toBe(0)
  })

  // The bug this fixes: a rejected promise is truthy, so the old `||=` kept it
  // forever and the counter stayed broken for the rest of the session.
  it('should clear the memo so a later caller retries', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ ok: true, json: async () => RESPONSE_BODY } as unknown as Response)
    global.fetch = fetchMock as unknown as typeof fetch
    const ExplorerDownloads = await loadExplorerDownloads()
    const instance = ExplorerDownloads.get()

    await expect(instance.getTotalDownloads()).resolves.toBe(0)
    await expect(instance.getTotalDownloads()).resolves.toBe(420)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('should report the failure to Sentry once', async () => {
    global.fetch = mockFetchNetworkError() as unknown as typeof fetch
    const ExplorerDownloads = await loadExplorerDownloads()

    await ExplorerDownloads.get().getTotalDownloads()

    expect(captureDownloadErrorMock).toHaveBeenCalledTimes(1)
    expect(captureDownloadErrorMock).toHaveBeenCalledWith(expect.any(TypeError), {
      feature: 'download_counts',
      url: 'https://counts.example/api'
    })
  })

  it('should not report again on later failures in the same session', async () => {
    global.fetch = mockFetchNetworkError() as unknown as typeof fetch
    const ExplorerDownloads = await loadExplorerDownloads()
    const instance = ExplorerDownloads.get()

    await instance.getTotalDownloads()
    await instance.getTotalDownloads()
    await instance.getTotalDownloads()

    expect(captureDownloadErrorMock).toHaveBeenCalledTimes(1)
  })

  // The flag is per instance, not static: one endpoint failing must not silence
  // the report for a different endpoint that is also broken.
  it('should still report a failure for a different endpoint', async () => {
    global.fetch = mockFetchNetworkError() as unknown as typeof fetch
    const ExplorerDownloads = await loadExplorerDownloads()

    await ExplorerDownloads.from('https://a.example').getTotalDownloads()
    await ExplorerDownloads.from('https://b.example').getTotalDownloads()

    expect(captureDownloadErrorMock).toHaveBeenCalledTimes(2)
    expect(captureDownloadErrorMock).toHaveBeenNthCalledWith(1, expect.any(TypeError), {
      feature: 'download_counts',
      url: 'https://a.example'
    })
    expect(captureDownloadErrorMock).toHaveBeenNthCalledWith(2, expect.any(TypeError), {
      feature: 'download_counts',
      url: 'https://b.example'
    })
  })
})
