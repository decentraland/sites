/**
 * Partner-attribution query params. Marketing shares links like
 * `https://decentraland.org/download?utm_source=shefi&utm_campaign=…` and we
 * carry these through the download funnel so the attribution survives from the
 * landing click to the `download_*` funnel events.
 *
 * Known limitation: params are read from the CURRENT URL at call time, not
 * persisted per session. A visitor who lands on `/?utm_source=…`, browses to
 * another page via an internal link, and downloads from there loses the
 * attribution (the query string is gone). Partner links must point directly
 * at a page hosting download CTAs (`/`, `/download`, `/play`).
 *
 * Kept snake_case because that matches BOTH the raw URL param names partners
 * send AND the Segment warehouse payload-key convention (snake_case, e.g.
 * `anon_user_id`, `auth_state` — see `.claude/skills/tracking-events/SKILL.md`
 * § LL-3) — so they flow into tracking payloads unchanged, no renaming.
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
 * current URL's search params). Params that are absent or have empty values
 * are omitted, keeping payloads and redirect URLs clean.
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

/**
 * Appends the current URL's campaign params to an internal path, preserving
 * partner attribution across a plain navigation. Used by the `'/download'`
 * fallback CTA href rendered before user-agent detection resolves — without
 * this, a partner-attributed click in that window would land on /download
 * with the utm params stripped, silently losing the whole funnel attribution.
 */
function withCampaignParams(path: string): string {
  const collected = collectCampaignParams()
  if (Object.keys(collected).length === 0) return path
  const params = new URLSearchParams(collected)
  return `${path}${path.includes('?') ? '&' : '?'}${params.toString()}`
}

export { collectCampaignParams, withCampaignParams }
