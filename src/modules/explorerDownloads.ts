import { getEnv } from '../config/env'
import type { ExplorerDownloadsData, PlatformDownloads } from './explorerDownloads.types'

class ExplorerDownloads {
  static url = getEnv('DOWNLOAD_COUNTS_URL') || ''
  static cache = new Map<string, ExplorerDownloads>()
  private baseUrl: string

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
    return this.from(this.url)
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
    const windows = downloads.find(item => item.platform === 'Windows')
    return windows?.downloads || 0
  }

  async getMacDownloads(): Promise<number> {
    const downloads = await this.getDownloads()
    const mac = downloads.find(item => item.platform === 'Mac')
    return mac?.downloads || 0
  }

  async getTotalDownloads(): Promise<number> {
    const downloads = await this.getDownloads()
    return downloads.reduce((total, item) => total + item.downloads, 0)
  }
}

export { ExplorerDownloads }
