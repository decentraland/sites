import { useEffect, useState } from 'react'
import { isMagicLoggedIn } from '../lib/magic'
import { getRecentConnectorId } from '../utils/recentConnector'

// Magic logins that carry an email persist it here (set by the auth dapp, see useWalletAddress). Its
// presence is a fast, synchronous *positive* signal — but Magic logins without an email (SMS /
// passkey / some OAuth) never set it, so its absence does NOT mean "not Magic".
const MAGIC_EMAIL_KEY = 'dcl_magic_user_email'
// core-web3's Magic wagmi connector id (see @dcl/core-web3 config/connectors/magic).
const MAGIC_CONNECTOR_ID = 'magic'

const hasMagicEmail = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage.getItem(MAGIC_EMAIL_KEY))

/**
 * Resolves the Magic signal from synchronous, zero-cost sources, cheapest first. Returns `undefined`
 * when none apply and the authoritative async check ({@link isMagicLoggedIn}) is needed.
 *
 * 1. `dcl_magic_user_email` — positive-only (email-less Magic logins never set it).
 * 2. wagmi's persisted connector id — present once the user has done a wallet action; reflects the
 *    connected provider regardless of login method, so it also covers email-less Magic without
 *    loading the Magic SDK.
 */
const resolveSyncSignal = (skip: boolean): boolean | undefined => {
  if (skip) return false
  if (hasMagicEmail()) return true

  const connectorId = getRecentConnectorId()
  if (connectorId !== null) return connectorId === MAGIC_CONNECTOR_ID

  return undefined
}

interface UseIsMagicAccountOptions {
  /**
   * Skip detection (returns `false`) when the caller already knows the account is non-Magic — e.g. a
   * thirdweb login — so the Magic SDK / iframe is never loaded needlessly.
   */
  skip?: boolean
}

/**
 * Whether the connected account is a Magic login. Returns `undefined` while the authoritative check
 * is still resolving, so callers can show a loading state instead of briefly flashing the wrong UI.
 *
 * Detection layers synchronous fast-paths over an authoritative async check (see
 * {@link resolveSyncSignal}); only when no synchronous signal applies — a fresh session with no
 * wallet action — does it fall back to `magic.user.isLoggedIn()`, the one signal that always covers
 * email-less Magic logins.
 */
function useIsMagicAccount(options: UseIsMagicAccountOptions = {}): boolean | undefined {
  const { skip = false } = options
  const [isMagic, setIsMagic] = useState<boolean | undefined>(() => resolveSyncSignal(skip))

  useEffect(() => {
    const sync = resolveSyncSignal(skip)
    if (sync !== undefined) {
      setIsMagic(sync)
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
