type ExplorerDownloadsData = {
  description: string
  dimension_descriptions: string[]
  dimension_display_names: string[]
  dimensions: string[]
  metric_type: string
  name: string
  values: Array<[string, number]>
}

type PlatformDownloads = {
  platform: string
  downloads: number
}

export type { ExplorerDownloadsData, PlatformDownloads }
