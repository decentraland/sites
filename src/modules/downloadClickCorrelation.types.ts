/* eslint-disable @typescript-eslint/naming-convention */
// snake_case a propósito: el objeto se spreadea tal cual dentro de payloads
// de Segment, donde la convención del warehouse es snake_case (LL-3).
interface DownloadClickCorrelation {
  click_id: string
  clicked_at: number
}
/* eslint-enable @typescript-eslint/naming-convention */

export type { DownloadClickCorrelation }
