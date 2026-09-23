type DownloadProgressCallback = (progress: { loaded: number; total: number }) => void

/**
 * Result of a streamed download. `gatewayRequestId` is the `X-Request-Id`
 * header echoed by the download gateway (exposed via CORS), used to join the
 * client `download_success` event with the gateway's server-side telemetry.
 * Absent when the response omitted the header (e.g. a CDN-direct URL).
 */
interface DownloadStreamResult {
  gatewayRequestId?: string
}

export type { DownloadProgressCallback, DownloadStreamResult }
