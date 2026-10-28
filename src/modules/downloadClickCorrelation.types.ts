/* eslint-disable @typescript-eslint/naming-convention */
// snake_case on purpose: the object is spread as-is into Segment payloads,
// where the warehouse convention is snake_case (LL-3).
interface DownloadClickCorrelation {
  click_id: string
  clicked_at: number
}
/* eslint-enable @typescript-eslint/naming-convention */

export type { DownloadClickCorrelation }
