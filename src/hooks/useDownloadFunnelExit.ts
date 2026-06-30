import { useEffect, useRef } from 'react'
import { sendDownloadFunnelExit } from '../modules/downloadFunnelExit'
import type { DownloadFunnelExitData } from '../modules/downloadFunnelExit.types'

/**
 * Fires the `download_funnel_exit` diagnostic event exactly once when the user
 * leaves the page, snapshotting the current funnel state via `getExitData`.
 *
 * Used on `/download_success` to confirm whether the funnel drop comes from
 * users closing the tab before the `download_*` events fire/deliver. `pagehide`
 * is the trigger — it models "left the page" (tab close / navigation away),
 * which is the hypothesis under test, and avoids the tab-switch false positives
 * a `visibilitychange` listener would add. The download flow is desktop-only,
 * so the mobile/bfcache gaps that make `pagehide` unreliable elsewhere don't
 * apply here.
 *
 * `getExitData` is read through a ref so the listener subscribes once and still
 * captures the latest funnel state at departure time.
 *
 * `enabled` scopes the diagnostic to sessions that actually entered the funnel
 * via a download CTA (the caller passes `place !== UNKNOWN`). Direct/campaign
 * landings, refreshes and bots — which never clicked a download button — don't
 * subscribe, so they're excluded from the funnel measurement entirely.
 */
function useDownloadFunnelExit(getExitData: () => DownloadFunnelExitData, enabled = true): void {
  const getExitDataRef = useRef(getExitData)
  getExitDataRef.current = getExitData
  const sentRef = useRef(false)

  useEffect(() => {
    if (!enabled) return
    const sendOnce = () => {
      if (sentRef.current) return
      sentRef.current = true
      sendDownloadFunnelExit(getExitDataRef.current())
    }
    window.addEventListener('pagehide', sendOnce)
    return () => window.removeEventListener('pagehide', sendOnce)
  }, [enabled])
}

export { useDownloadFunnelExit }
