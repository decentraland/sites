import { useEffect, useRef } from 'react'
import { sendDownloadFunnelExit } from '../modules/downloadFunnelExit'
import type { DownloadFunnelExitData } from '../modules/downloadFunnelExit.types'
import { subscribeVisibility } from '../utils/documentVisibility'

/**
 * Fires the `download_funnel_exit` diagnostic event whenever the page becomes
 * hidden, snapshotting the current funnel state via `getExitData`.
 *
 * Used on `/download_success` to confirm whether the funnel drop comes from
 * users leaving before the `download_*` events fire/deliver. We trigger on
 * `visibilitychange → hidden` (via the shared `subscribeVisibility`) rather than
 * `pagehide`: `hidden` is the last callback the Page Lifecycle spec guarantees
 * before a page is frozen/discarded/terminated, so it also catches the user
 * quitting the browser to go run the installer — the modal completion behaviour
 * for this funnel, which `pagehide` misses on some browsers. (Hard crashes /
 * force-kills / power loss are unrecoverable by any client-side signal.)
 *
 * Because `hidden` also fires on a transient tab/app switch, the event can be
 * emitted multiple times per session (e.g. switch away → come back → leave).
 * That is intentional: the warehouse collapses rows per `anon_id`
 * (`BOOLOR_AGG` on the flags), so a tab-switcher who later completes is still
 * counted as started. Do NOT add a fire-once guard — it would record an early
 * `started_fired = false` and never correct it.
 *
 * `enabled` scopes the diagnostic to sessions that entered via a download CTA
 * (the caller passes `place !== UNKNOWN`); direct/campaign landings and bots
 * never subscribe. `getExitData` is read through a ref so the subscription is
 * stable while still capturing the latest funnel state at fire time.
 */
function useDownloadFunnelExit(getExitData: () => DownloadFunnelExitData, enabled = true): void {
  const getExitDataRef = useRef(getExitData)
  getExitDataRef.current = getExitData

  useEffect(() => {
    if (!enabled) return
    return subscribeVisibility(visible => {
      if (!visible) sendDownloadFunnelExit(getExitDataRef.current())
    })
  }, [enabled])
}

export { useDownloadFunnelExit }
