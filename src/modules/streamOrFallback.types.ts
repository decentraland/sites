import type { OperativeSystem } from '../types/download.types'

interface StreamOrFallbackArgs {
  url: string
  filename: string
  os: OperativeSystem
  signal: AbortSignal
  onProgress: (percent: number) => void
}

/**
 * Which path actually dispatched the download:
 * - `streamed`: Windows fetch + Blob succeeded — the gateway responded 2xx and
 *   every byte reached the browser (the only mode that confirms delivery).
 * - `anchor_fallback`: Windows fetch failed (CORS/network) → native anchor +
 *   fixed hold. Fire-and-forget; no delivery confirmation.
 * - `anchor_native`: macOS always uses the native anchor (to preserve the
 *   kMDItemWhereFroms xattr). Fire-and-forget; no delivery confirmation.
 */
type DeliveryMode = 'streamed' | 'anchor_fallback' | 'anchor_native'

/**
 * Result of a stream-or-fallback attempt.
 *
 * `bytesTransferred` is populated **only** on the Windows streamed path
 * (`fetch` + progress tap). macOS uses a native anchor click — the browser
 * owns the transfer past that point and we have no byte counter. The
 * Windows fallback path (CORS failure → native anchor) also has no counter.
 *
 * Callers treat `undefined` as "unknown / not measured" rather than zero.
 *
 * `deliveryMode` disambiguates the three semantics of a resolved download;
 * `gatewayRequestId` (streamed path only) is the gateway's `X-Request-Id` for
 * the client↔server join.
 */
interface StreamOrFallbackResult {
  bytesTransferred?: number
  deliveryMode: DeliveryMode
  gatewayRequestId?: string
}

export type { DeliveryMode, StreamOrFallbackArgs, StreamOrFallbackResult }
