import { generateUuid } from './segmentAnonymousId'
import type { DownloadClickCorrelation } from './downloadClickCorrelation.types'

const STORAGE_KEY = 'downloadFunnel:lastClick'
// A click older than this is a different download intent (or a direct
// revisit): we don't join it with this page's download_*.
const MAX_CORRELATION_AGE_MS = 30 * 60 * 1000

/**
 * Mints the click→download_* correlation id and persists it in sessionStorage
 * so it survives the full-page navigation to /download_success. The same
 * object is attached to the `Click` event (via useDownloadClick) and to
 * download_* (via readDownloadClickCorrelation), making the click→funnel
 * join deterministic instead of heuristic on anonymousId.
 */
function recordDownloadClickCorrelation(): DownloadClickCorrelation {
  const correlation: DownloadClickCorrelation = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    click_id: generateUuid(),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    clicked_at: Date.now()
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(correlation))
  } catch {
    // Storage blocked (private mode / quota): the Click still carries the
    // correlation; only the cross-page join is lost.
  }
  return correlation
}

/** Never throws; null when there's no fresh, valid correlation. */
function readDownloadClickCorrelation(maxAgeMs: number = MAX_CORRELATION_AGE_MS): DownloadClickCorrelation | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const candidate = parsed as Record<string, unknown>
    if (typeof candidate.click_id !== 'string' || typeof candidate.clicked_at !== 'number') return null
    if (Date.now() - candidate.clicked_at > maxAgeMs) return null
    // eslint-disable-next-line @typescript-eslint/naming-convention
    return { click_id: candidate.click_id, clicked_at: candidate.clicked_at }
  } catch {
    return null
  }
}

export { readDownloadClickCorrelation, recordDownloadClickCorrelation }
