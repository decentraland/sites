import { useEffect, useState } from 'react'
import { isMagicLoggedIn } from '../lib/magic'

interface MagicAccountStatus {
  /** Whether the connected account is a Magic login. `false` until/unless the check confirms it. */
  isMagic: boolean
  /** Whether the (async) Magic-session check is still resolving. */
  isLoading: boolean
}

interface UseMagicAccountStatusOptions {
  /**
   * Skip the check (reports a settled non-Magic account) when the caller already knows the account is
   * non-Magic — e.g. a thirdweb login — so the Magic SDK / iframe is never loaded needlessly.
   */
  skip?: boolean
}

/**
 * Magic-login status for the connected account, determined by asking the Magic SDK whether there is
 * an active session (`magic.user.isLoggedIn()`) — the authoritative, login-method-agnostic signal
 * that covers every Magic login (email, SMS, passkey, OAuth without email) alike.
 *
 * `isLoading` is `true` while the async check resolves, so callers can avoid flashing the wrong UI.
 */
function useMagicAccountStatus(options: UseMagicAccountStatusOptions = {}): MagicAccountStatus {
  const { skip = false } = options
  const [status, setStatus] = useState<MagicAccountStatus>(() =>
    skip ? { isMagic: false, isLoading: false } : { isMagic: false, isLoading: true }
  )

  useEffect(() => {
    if (skip) {
      setStatus({ isMagic: false, isLoading: false })
      return
    }

    let cancelled = false
    isMagicLoggedIn()
      .then(isMagic => {
        if (!cancelled) setStatus({ isMagic, isLoading: false })
      })
      .catch(() => {
        if (!cancelled) setStatus({ isMagic: false, isLoading: false })
      })

    return () => {
      cancelled = true
    }
  }, [skip])

  return status
}

export { useMagicAccountStatus }
export type { MagicAccountStatus }
