import { getEnv } from '../config/env'
import { captureDownloadError } from './downloadFunnelSentry'
import { DownloadCountsHttpError, isReportableDownloadCountsFailure } from './explorerDownloads.helpers'
import type { ExplorerDownloadsData, PlatformDownloads } from './explorerDownloads.types'

class ExplorerDownloads {
  static cache = new Map<string, ExplorerDownloads>()
  // Reported at most once per endpoint per page load, and only for failures the
  // endpoint is actually responsible for (see `isReportableDownloadCountsFailure`).
  // A flaky or proxied connection retries the same failing request many times over a
  // session, which is how a cosmetic counter produced 4489 Sentry events across 724
  // users (SITES-2MQ). One report keeps a real cdn-data outage visible without the
  // repeats.
  //
  // Per instance rather than static on purpose. `from()` caches one instance per
  // URL, so this is still a single report per page load for the one endpoint
  // production actually uses, but a static flag would let a failure on one URL
  // silence the report for a different, genuinely broken one.
  private hasReportedFailure = false
  private baseUrl: string
  private downloadsPromise: Promise<PlatformDownloads[]> | null = null

  constructor(url: string) {
    this.baseUrl = url
  }

  static from(url: string) {
    if (!this.cache.has(url)) {
      this.cache.set(url, new ExplorerDownloads(url))
    }

    return this.cache.get(url)!
  }

  static get() {
    return this.from(getEnv('DOWNLOAD_COUNTS_URL') || '')
  }

  async fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`)
    if (!response.ok) {
      throw new DownloadCountsHttpError(response.status)
    }
    return response.json()
  }

  /**
   * Memoizes the in-flight request so the surfaces that show the counter (hero,
   * come-hang-out, jump-in, download options) share one fetch.
   *
   * The failure path is deliberate on two counts. It resolves with an empty list
   * instead of rejecting, because every caller reads the count through
   * `useAsyncMemo`, whose internal catch reports to Sentry — a network blip on a
   * decorative counter is not worth an event, and callers already treat a falsy
   * count as "hide the label". And it clears the memo, because a rejected (or
   * empty) cached promise is still truthy, so without this one blip disabled the
   * counter for the rest of the session with no way to recover.
   *
   * There is no automatic retry here on purpose: the next surface to mount takes
   * the retry, and retrying inside a real outage would only multiply requests.
   */
  async getDownloads(): Promise<PlatformDownloads[]> {
    if (!this.downloadsPromise) {
      this.downloadsPromise = this.fetchDownloads().catch(error => {
        this.downloadsPromise = null
        this.reportFailureOnce(error)
        return []
      })
    }
    return this.downloadsPromise
  }

  private reportFailureOnce(error: unknown): void {
    if (this.hasReportedFailure || !isReportableDownloadCountsFailure(error)) return
    this.hasReportedFailure = true
    void captureDownloadError(error, { feature: 'download_counts', url: this.baseUrl })
  }

  private async fetchDownloads(): Promise<PlatformDownloads[]> {
    const response = await this.fetchJson<ExplorerDownloadsData>('')

    return response.values.map(([platform, downloads]) => ({
      platform,
      downloads
    }))
  }

  async getWindowsDownloads(): Promise<number> {
    const downloads = await this.getDownloads()
    const windows = downloads.find(item => item.platform === 'Windows')
    return windows?.downloads ?? 0
  }

  async getMacDownloads(): Promise<number> {
    const downloads = await this.getDownloads()
    const mac = downloads.find(item => item.platform === 'Mac')
    return mac?.downloads ?? 0
  }

  async getTotalDownloads(): Promise<number> {
    const downloads = await this.getDownloads()
    return downloads.reduce((total, item) => total + item.downloads, 0)
  }
}

export { ExplorerDownloads }
