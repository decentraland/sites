import { SegmentEvent } from './segment'
import { generateUuid } from './segmentAnonymousId'
import { postSegmentEvent } from './segmentBeacon'
import type { DownloadFunnelExitData } from './downloadFunnelExit.types'

function buildProperties(data: DownloadFunnelExitData): Record<string, unknown> {
  /* eslint-disable @typescript-eslint/naming-convention */
  const properties: Record<string, unknown> = {
    os: data.os,
    arch: data.arch,
    place: data.place,
    download_started_fired: data.startedFired,
    download_success_fired: data.successFired,
    download_failed_fired: data.failedFired,
    ms_on_page: data.msOnPage,
    revisit: data.revisit,
    auth_state: data.authState
  }
  if (data.anonUserId) {
    properties.anon_user_id = data.anonUserId
  }
  /* eslint-enable @typescript-eslint/naming-convention */

  return properties
}

/**
 * Fires the `download_funnel_exit` diagnostic event via the shared unload-safe
 * transport. The funnel usually threads `anon_user_id`; when it does not, mint
 * a throwaway UUID so Segment accepts the event.
 */
function sendDownloadFunnelExit(data: DownloadFunnelExitData): void {
  postSegmentEvent(SegmentEvent.DOWNLOAD_FUNNEL_EXIT, buildProperties(data), data.anonUserId || generateUuid())
}

export { sendDownloadFunnelExit }
