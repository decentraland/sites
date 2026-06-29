import { useEffect, useState } from 'react'
import { isMagicLoggedIn } from '../lib/magic'

interface UseIsMagicAccountOptions {
  /**
   * Skip detection (returns `false`) when the caller already knows the account is non-Magic — e.g. a
   * thirdweb login — so the Magic SDK / iframe is never loaded needlessly.
   */
  skip?: boolean
}

/**
 * Whether the connected account is a Magic login, determined by asking the Magic SDK whether there
 * is an active session (`magic.user.isLoggedIn()`). This is the authoritative, login-method-agnostic
 * signal: it covers every Magic login (email, SMS, passkey, OAuth without email) alike.
 *
 * Returns `undefined` while the (async) check resolves, so callers can show a loading state instead
 * of briefly flashing the wrong UI.
 */
function useIsMagicAccount(options: UseIsMagicAccountOptions = {}): boolean | undefined {
  const { skip = false } = options
  const [isMagic, setIsMagic] = useState<boolean | undefined>(skip ? false : undefined)

  useEffect(() => {
    if (skip) {
      setIsMagic(false)
      return
    }

    let cancelled = false
    isMagicLoggedIn()
      .then(result => {
        if (!cancelled) setIsMagic(result)
      })
      .catch(() => {
        if (!cancelled) setIsMagic(false)
      })

    return () => {
      cancelled = true
    }
  }, [skip])

  return isMagic
}

export { useIsMagicAccount }
