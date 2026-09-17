import { useMemo, useSyncExternalStore } from 'react'
import { hasValidIdentityFor, isRelevantStorageKey, resolveActiveAddress, writeActivePointer } from '../utils/activeIdentity'
import { redirectToAuth } from '../utils/authRedirect'
import { removeStorageItems } from '../utils/safeStorage'

type WalletState = {
  address: string | null
  isConnected: boolean
  disconnect: () => void
}

// ── Shared store (singleton, outside React) ──────────────────────────

let currentAddress: string | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(fn => fn())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): string | null {
  return currentAddress
}

function setSharedAddress(addr: string | null) {
  if (addr !== currentAddress) {
    currentAddress = addr
    notify()
  }
}

/**
 * Records the user's wallet selection in both the persistent pointer
 * and the in-memory snapshot, so reloads and cross-tab events keep it.
 */
function setActiveAddress(addr: string) {
  writeActivePointer(addr)
  setSharedAddress(addr)
}

// ── Initialize + global listeners (run once) ─────────────────────────

currentAddress = resolveActiveAddress()

// Cross-tab updates from any dapp that touches the SSO keys or the
// active-address pointer. Other localStorage writes are ignored so they
// can no longer flip the menu to a different wallet.
window.addEventListener('storage', (event: StorageEvent) => {
  if (!isRelevantStorageKey(event.key)) return

  setSharedAddress(resolveActiveAddress())
})

// MetaMask account switch — explicit signal from an injected EVM wallet.
// Magic and OTP flows never reach this branch (they don't inject `window.ethereum`).
const handleAccountsChanged = (...args: unknown[]): void => {
  // The payload comes from the extension, so the element type is checked rather than
  // asserted: `Array.isArray` only narrows to `any[]`, and a non-string first entry
  // would throw on `toLowerCase()` inside an event callback, where nothing catches it.
  const accounts: unknown[] = Array.isArray(args[0]) ? args[0] : []
  const firstAccount = accounts[0]
  const newAccount = typeof firstAccount === 'string' ? firstAccount.toLowerCase() : undefined
  if (!newAccount) {
    // Wallet locked: drop the in-memory state but keep the pointer so the
    // user returns to the same wallet when they unlock.
    setSharedAddress(null)
    return
  }
  if (hasValidIdentityFor(newAccount)) {
    setActiveAddress(newAccount)
    return
  }
  redirectToAuth(window.location.pathname, { loginMethod: 'METAMASK' })
}

// `window.ethereum` belongs to whatever extensions the visitor has installed, so
// touching it is guarded: with two wallets competing for the global, one of them
// installs a Proxy whose `get` breaks a JS invariant, and merely reading `.on`
// throws `'get' on proxy: property 'on' is a read-only and non-configurable data
// property...` (SITES-2S5). This runs at module top level in a file the navbar
// imports, so an unguarded read took the page down with it.
//
// Losing the subscription only costs the live account-switch signal. Address
// resolution does not depend on it (see the NOTE below), so the session still
// works.
try {
  // Read once: a second lookup could resolve to a different object if another
  // extension replaces the global in between.
  const provider = window.ethereum
  if (provider?.on) {
    provider.on('accountsChanged', handleAccountsChanged)
  }
} catch {
  // A hostile or half-installed provider. Nothing to report: it is not ours to fix.
}

// NOTE: a previous version of this file probed `eth_accounts` on load to seed
// the pointer with MetaMask's active account. Removed because it pushes OTP /
// Magic users onto MetaMask's wallet when both providers are present, and
// because `accountsChanged` already covers explicit user switches. Also drops
// the 500ms `metamaskSwitchUntil` grace window — obsolete with a persistent
// pointer. Resolution now relies on: the sign-in-pending flag (fresh logins),
// `dcl:active-address` (explicit selection), and the heuristic scan as fallback.

// ── Disconnect ──────────────────────────────────────────────────────

const isSessionKey = (key: string): boolean =>
  key.startsWith('single-sign-on-') ||
  key.startsWith('decentraland-connect') ||
  key.startsWith('wagmi') ||
  key.startsWith('wc@2') ||
  key === 'dcl_magic_user_email' ||
  key === 'dcl_thirdweb_user_email'

function disconnectWallet() {
  // Guarded because storage can be missing or denied (SITES-2RY). The in-memory
  // cleanup below still runs, so the session ends on screen either way.
  removeStorageItems(isSessionKey)
  writeActivePointer(null)
  setSharedAddress(null)
}

// ── React hook ───────────────────────────────────────────────────────

/**
 * Lightweight replacement for `useWalletState()` from @dcl/core-web3.
 * All instances share the same address via useSyncExternalStore.
 * Changes from MetaMask accountsChanged, the active-address pointer,
 * or any cross-tab SSO write propagate to every consumer.
 */
function useWalletAddress(): WalletState {
  const address = useSyncExternalStore(subscribe, getSnapshot, () => null)

  return useMemo(
    () => ({
      address,
      isConnected: address !== null,
      disconnect: disconnectWallet
    }),
    [address]
  )
}

export { disconnectWallet, useWalletAddress }
