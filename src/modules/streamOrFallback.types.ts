import type { OperativeSystem } from '../types/download.types'

interface StreamOrFallbackArgs {
  url: string
  filename: string
  os: OperativeSystem
  signal: AbortSignal
  onProgress: (percent: number) => void
}

export type { StreamOrFallbackArgs }
