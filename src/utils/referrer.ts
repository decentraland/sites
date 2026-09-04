const REFERRER_REGEX = /^0x[a-fA-F0-9]{40}$/

const REFERRER_STORAGE_KEY = 'dcl_referrer'

/**
 * Strictly validates a referral attribution address. The value ends up in
 * download URLs consumed by the installer chain, so anything that doesn't
 * match an Ethereum address exactly is dropped.
 */
function parseReferrer(value: string | null | undefined): string | null {
  if (!value || !REFERRER_REGEX.test(value)) return null
  return value.toLowerCase()
}

/**
 * Sets or clears the session-stored referrer for the current tab. A valid
 * address is persisted so it survives the invite → download navigation even if
 * the query param is lost; an invalid/absent value CLEARS any previously stored
 * referrer so a stale attribution from an earlier visit is never reused.
 * sessionStorage (not localStorage) on purpose: short scope.
 */
function storeReferrer(value: string | null | undefined): void {
  const referrer = parseReferrer(value)
  try {
    if (referrer) {
      window.sessionStorage.setItem(REFERRER_STORAGE_KEY, referrer)
    } else {
      window.sessionStorage.removeItem(REFERRER_STORAGE_KEY)
    }
  } catch {
    // Storage may be unavailable (private mode restrictions); attribution falls back to the query param
  }
}

function readStoredReferrer(): string | null {
  try {
    return parseReferrer(window.sessionStorage.getItem(REFERRER_STORAGE_KEY))
  } catch {
    return null
  }
}

function readUrlReferrerParam(): string | null {
  return new URLSearchParams(window.location.search).get('referrer')
}

/**
 * Reads a valid referrer off the CURRENT URL, with no side effects.
 *
 * Separate from `resolveReferrer` because it is safe to call during render: it
 * never touches session storage, so it neither clears a stored value (which
 * `resolveReferrer` does when the URL carries an invalid one — a render must not
 * discard attribution) nor inherits one (which would attribute a download
 * started anywhere in the tab to a referral picked up earlier). Used by the
 * download CTAs (see `buildDownloadTrackingParams`), which run on every route
 * and only need to forward the referrer that arrived on the URL they render at:
 * `/download` resolves the stored value itself, so the query param is the only
 * thing that was ever lost in that hop.
 */
function readUrlReferrer(): string | null {
  return parseReferrer(readUrlReferrerParam())
}

/**
 * Resolves the referrer for the current download. Has side effects (see below)
 * — call it from an event handler or an effect, never during render.
 *
 * NOTE (2026-08-31): this no longer checks an `INVITE_DIRECT_DOWNLOAD` env gate.
 * The single source of truth for the stored value is the
 * `dapps-invite-direct-download` feature flag, checked at the invite page — the
 * only place that WRITES a referrer (query param + session value). Downstream
 * just carries whatever it was handed, so there is nothing left for a second
 * gate to guard.
 *
 * NOTE (2026-09-03): the invite page is no longer the only place a referrer
 * ENTERS the flow. The explorer emits scene share links carrying the sharer's
 * wallet (`/jump?position=x,y&referrer=0x…`), and that URL branch is not
 * flag-gated — so a `?referrer=` on any route with a download CTA yields an
 * attributed download without going through `/invite/:referrer`. Only the stored
 * value stays behind the flag.
 *
 * An explicit `referrer` query param is authoritative: when it is present but
 * invalid we must NOT fall back to the stored value, because that would
 * attribute this download to an earlier referral. The stale value is cleared and
 * no referrer is used. The stored value is only consulted when the param is
 * absent (e.g. in-site navigation that dropped it).
 */
function resolveReferrer(): string | null {
  const raw = readUrlReferrerParam()

  if (raw !== null) {
    const fromUrl = parseReferrer(raw)
    if (!fromUrl) {
      storeReferrer(null)
      return null
    }
    return fromUrl
  }

  return readStoredReferrer()
}

export { REFERRER_STORAGE_KEY, parseReferrer, readStoredReferrer, readUrlReferrer, resolveReferrer, storeReferrer }
