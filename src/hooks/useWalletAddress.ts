import { useMemo, useSyncExternalStore } from 'react'
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'
import { redirectToAuth } from '../utils/authRedirect'

type WalletState = {
  address: string | null
  isConnected: boolean
  disconnect: () => void
}

// ── Shared store (singleton, outside React) ──────────────────────────

let currentAddress: string | null = null
const listeners = new Set<() => void>()

/** Brief grace period after a MetaMask switch to ignore storage events
 *  that would otherwise revert the address back to the "most recent expiration". */
let metamaskSwitchUntil = 0

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

// ── Address resolution ───────────────────────────────────────────────

/**
 * Scans all single-sign-on-0x* keys and picks the one with the most recent
 * expiration (= the last session the user created via auth dapp).
 *
 * Note: `localStorageGetIdentity` from @dcl/single-sign-on-client already
 * validates expiration internally — it returns null for expired identities.
 */
function getStoredAddress(): string | null {
  try {
    let bestAddress: string | null = null
    let bestExpiration = 0

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('single-sign-on-0x')) {
        const address = key.replace('single-sign-on-', '')
        const identity = localStorageGetIdentity(address)
        if (identity) {
          const payload = identity.authChain?.[1]?.payload
          const expirationMatch = payload ? String(payload).match(/Expiration: ([^\n]+)/) : null
          const expiration = expirationMatch ? new Date(expirationMatch[1]).getTime() : 0
          if (expiration > bestExpiration) {
            bestExpiration = expiration
            bestAddress = address
          }
        }
      }
    }
    return bestAddress
  } catch {
    return null
  }
}

function hasIdentityFor(address: string): boolean {
  try {
    return localStorageGetIdentity(address.toLowerCase()) !== null
  } catch {
    return false
  }
}

// ── Initialize + global listeners (run once) ─────────────────────────

currentAddress = getStoredAddress()

// Cross-tab: other tab signs in/out.
// Suppressed briefly after a MetaMask switch to avoid reverting the address.
window.addEventListener('storage', () => {
  if (Date.now() < metamaskSwitchUntil) return
  setSharedAddress(getStoredAddress())
})

// MetaMask account switch
if (window.ethereum?.on) {
  window.ethereum.on('accountsChanged', (...args: unknown[]) => {
    const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : []
    const newAccount = accounts[0]?.toLowerCase()
    if (!newAccount) {
      setSharedAddress(null)
      return
    }
    if (hasIdentityFor(newAccount)) {
      metamaskSwitchUntil = Date.now() + 500
      setSharedAddress(newAccount)
      return
    }
    redirectToAuth(window.location.pathname, { loginMethod: 'METAMASK' })
  })
}

// On load: reconcile with MetaMask's active account
if (window.ethereum?.request) {
  window.ethereum
    .request({ method: 'eth_accounts' })
    .then(result => {
      const accounts = Array.isArray(result) ? (result as string[]) : []
      const active = accounts[0]?.toLowerCase()
      if (active && hasIdentityFor(active) && active !== currentAddress) {
        metamaskSwitchUntil = Date.now() + 500
        setSharedAddress(active)
      }
    })
    .catch(() => {})
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
  setSharedAddress(null)
}

// ── React hook ───────────────────────────────────────────────────────

/**
 * Lightweight replacement for `useWalletState()` from @dcl/core-web3.
 * All instances share the same address via useSyncExternalStore.
 * Changes from MetaMask accountsChanged or cross-tab storage events
 * propagate to every component that uses this hook.
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
