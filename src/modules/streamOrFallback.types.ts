type StreamOrFallbackArgs = {
  url: string
  filename: string
  signal: AbortSignal
  onProgress: (progress: number) => void
}

export type { StreamOrFallbackArgs }
