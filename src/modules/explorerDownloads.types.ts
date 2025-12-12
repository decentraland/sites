type ExplorerDownloadsData = {
  description: string
  dimensionDescriptions: string[]
  dimensionDisplayNames: string[]
  dimensions: string[]
  metricType: string
  name: string
  values: Array<[string, number]>
}

type PlatformDownloads = {
  platform: string
  downloads: number
}

export type { ExplorerDownloadsData, PlatformDownloads }
