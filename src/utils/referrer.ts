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

/**
 * Resolves the referrer for the current download.
 *
 * NOTE (2026-08-31): this no longer checks an `INVITE_DIRECT_DOWNLOAD` env gate.
 * The single source of truth is now the `dapps-invite-direct-download` feature
 * flag, checked at the invite page — the only place a referrer enters this flow
 * (it writes the query param and the session value). Downstream just carries
 * whatever it was handed, so there is nothing left for a second gate to guard.
 *
 * An explicit `referrer` query param is authoritative: when it is present but
 * invalid we must NOT fall back to the stored value, because that would
 * attribute this download to an earlier referral. The stale value is cleared and
 * no referrer is used. The stored value is only consulted when the param is
 * absent (e.g. in-site navigation that dropped it).
 */
function resolveReferrer(): string | null {
  const raw = new URLSearchParams(window.location.search).get('referrer')

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

export { REFERRER_STORAGE_KEY, parseReferrer, readStoredReferrer, resolveReferrer, storeReferrer }
