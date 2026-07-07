import { generateUuid } from './segmentAnonymousId'
import type { DownloadClickCorrelation } from './downloadClickCorrelation.types'

const STORAGE_KEY = 'downloadFunnel:lastClick'
// Un click más viejo que esto es otra intención de descarga (o una revisita
// directa): no lo joineamos con los download_* de esta página.
const MAX_CORRELATION_AGE_MS = 30 * 60 * 1000

/**
 * Mintea el id de correlación click→download_* y lo persiste en sessionStorage
 * para que sobreviva la navegación full-page a /download_success. El mismo
 * objeto se adjunta al evento `Click` (via useDownloadClick) y a los
 * download_* (via readDownloadClickCorrelation), volviendo el join click→funnel
 * determinístico en lugar de heurístico por anonymousId.
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
    // Storage bloqueado (private mode / quota): el Click igual lleva la
    // correlación; solo se pierde el join cross-page.
  }
  return correlation
}

/** No lanza nunca; null si no hay correlación fresca y válida. */
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
