/**
 * Partner-attribution query params. Marketing shares links like
 * `https://decentraland.org/download?utm_source=shefi&utm_campaign=…` and we
 * carry these through the download funnel so the attribution survives from the
 * landing click all the way to the `download_*` funnel events.
 *
 * Kept snake_case because that matches BOTH the raw URL param names partners
 * send AND the Segment warehouse dimension convention (see tracking-events
 * LL-3) — so they flow into tracking payloads unchanged, no renaming.
 */
const CAMPAIGN_PARAM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

/**
 * Cap partner-supplied values so a malformed or hostile link can't flood the
 * warehouse (or a redirect URL) with an unbounded string. UTM values are short
 * by convention; 256 chars is generous headroom.
 */
const MAX_CAMPAIGN_VALUE_LENGTH = 256

/**
 * Collects the campaign params present on the given source (defaults to the
 * current URL's search params). Only params that are actually present are
 * returned — absent ones are omitted rather than emitted as empty strings,
 * keeping payloads and redirect URLs clean.
 */
function collectCampaignParams(source?: URLSearchParams): Record<string, string> {
  const params = source ?? new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')

  const collected: Record<string, string> = {}
  for (const key of CAMPAIGN_PARAM_KEYS) {
    const value = params.get(key)
    if (value) {
      collected[key] = value.slice(0, MAX_CAMPAIGN_VALUE_LENGTH)
    }
  }
  return collected
}

export { collectCampaignParams }
