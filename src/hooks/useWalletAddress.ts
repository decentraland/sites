import { useMemo, useSyncExternalStore } from 'react'
import { hasValidIdentityFor, isRelevantStorageKey, resolveActiveAddress, writeActivePointer } from '../utils/activeIdentity'
import { redirectToAuth } from '../utils/authRedirect'

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
if (window.ethereum?.on) {
  window.ethereum.on('accountsChanged', (...args: unknown[]) => {
    const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : []
    const newAccount = accounts[0]?.toLowerCase()
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
  })
}

// NOTE: a previous version of this file probed `eth_accounts` on load to seed
// the pointer with MetaMask's active account. Removed because it pushes OTP /
// Magic users onto MetaMask's wallet when both providers are present, and
// because `accountsChanged` already covers explicit user switches. Also drops
// the 500ms `metamaskSwitchUntil` grace window — obsolete with a persistent
// pointer. Resolution now relies on: the sign-in-pending flag (fresh logins),
// `dcl:active-address` (explicit selection), and the heuristic scan as fallback.

// ── Disconnect ──────────────────────────────────────────────────────

function disconnectWallet() {
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (
      key &&
      (key.startsWith('single-sign-on-') ||
        key.startsWith('decentraland-connect') ||
        key.startsWith('wagmi') ||
        key.startsWith('wc@2') ||
        key === 'dcl_magic_user_email' ||
        key === 'dcl_thirdweb_user_email')
    ) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
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
