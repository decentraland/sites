import type { ExplorerDownloadsData, PlatformDownloads } from './explorerDownloads.types'

class ExplorerDownloads {
  static URL = import.meta.env.VITE_DOWNLOAD_COUNTS_URL || ''
  static CACHE = new Map<string, ExplorerDownloads>()
  private baseUrl: string

  constructor(url: string) {
    this.baseUrl = url
  }

  static from(url: string) {
    if (!this.CACHE.has(url)) {
      this.CACHE.set(url, new ExplorerDownloads(url))
    }

    return this.CACHE.get(url)!
  }

  static get() {
    return this.from(this.URL)
  }

  async fetch<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  async getDownloads(): Promise<PlatformDownloads[]> {
    const response = await this.fetch<ExplorerDownloadsData>('')

    return response.values.map(([platform, downloads]) => ({
      platform,
      downloads
    }))
  }

  async getWindowsDownloads(): Promise<number> {
    const downloads = await this.getDownloads()
    const windows = downloads.find((item) => item.platform === 'Windows')
    return windows?.downloads || 0
  }

  async getMacDownloads(): Promise<number> {
    const downloads = await this.getDownloads()
    const mac = downloads.find((item) => item.platform === 'Mac')
    return mac?.downloads || 0
  }

  async getTotalDownloads(): Promise<number> {
    const downloads = await this.getDownloads()
    return downloads.reduce((total, item) => total + item.downloads, 0)
  }
}

export { ExplorerDownloads }
