import { useMemo, useSyncExternalStore } from 'react'
import {
  hasValidIdentityFor,
  isRelevantStorageKey,
  readActivePointer,
  resolveActiveAddress,
  writeActivePointer
} from '../utils/activeIdentity'
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

// One-time reconciliation on load: only used to SEED the pointer when it
// is missing. It must never overrule an existing pointer — that would let
// MetaMask's idea of "active account" steamroll a Magic/OTP selection or
// a previous explicit switch.
//
// NOTE: replaces the previous 500ms `metamaskSwitchUntil` grace window. That
// band-aid only suppressed `storage` events for half a second after a
// MetaMask switch; the persistent pointer makes it unnecessary because
// `resolveActiveAddress` always honors the user's explicit selection.
if (window.ethereum?.request) {
  window.ethereum
    .request({ method: 'eth_accounts' })
    .then(result => {
      const accounts = Array.isArray(result) ? (result as string[]) : []
      const active = accounts[0]?.toLowerCase()
      if (!active || !hasValidIdentityFor(active)) return
      if (readActivePointer()) return
      setActiveAddress(active)
    })
    .catch(error => {
      const message = error instanceof Error ? error.message : 'unknown error'
      console.warn('[useWalletAddress] eth_accounts probe failed:', message)
    })
}

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
