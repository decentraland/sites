import type { OperativeSystem } from '../types/download.types'

interface StreamOrFallbackArgs {
  url: string
  filename: string
  os: OperativeSystem
  signal: AbortSignal
  onProgress: (percent: number) => void
}

/**
 * Result of a stream-or-fallback attempt.
 *
 * `bytesTransferred` is populated **only** on the Windows streamed path
 * (`fetch` + progress tap). macOS uses a native anchor click — the browser
 * owns the transfer past that point and we have no byte counter. The
 * Windows fallback path (CORS failure → native anchor) also has no counter.
 *
 * Callers treat `undefined` as "unknown / not measured" rather than zero.
 */
interface StreamOrFallbackResult {
  bytesTransferred?: number
}

export type { StreamOrFallbackArgs, StreamOrFallbackResult }
