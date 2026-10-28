import { collectCampaignParams } from './campaignParams'
import { SegmentEvent } from './segment'
import { ensureSegmentAnonymousId } from './segmentAnonymousId'
import { postSegmentEvent } from './segmentBeacon'

// Module-level flag: useDownloadClick marks it on EVERY download CTA click
// (from whichever component fired it), and useDownloadPageExit resets it on
// /download mount, so that page's exit snapshot knows whether the visitor
// picked an option before leaving.
let ctaClicked = false

function markDownloadCtaClicked(): void {
  ctaClicked = true
}

function resetDownloadCtaClicked(): void {
  ctaClicked = false
}

/**
 * Abandonment diagnostic for /download (the options page has no page() call —
 * it's analytics-exempt — nor any other exit signal). Like download_funnel_exit,
 * this can fire multiple times per session (tab switches); the warehouse
 * collapses rows by anon_id. Do NOT add a fire-once guard.
 */
function sendDownloadPageExit(msOnPage: number): void {
  /* eslint-disable @typescript-eslint/naming-convention */
  postSegmentEvent(
    SegmentEvent.DOWNLOAD_PAGE_EXIT,
    {
      cta_clicked: ctaClicked,
      ms_on_page: msOnPage,
      ...collectCampaignParams()
    },
    ensureSegmentAnonymousId()
  )
  /* eslint-enable @typescript-eslint/naming-convention */
}

export { markDownloadCtaClicked, resetDownloadCtaClicked, sendDownloadPageExit }
