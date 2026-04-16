import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'
import { redirectToAuth } from '../utils/authRedirect'

type WalletState = {
  address: string | null
  isConnected: boolean
  isConnecting: false
  disconnect: () => void
}

// ── Shared store (singleton, outside React) ──────────────────────────

let currentAddress: string | null = null
let addressSetByMetaMask = false // true when address was set by accountsChanged
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
  console.log('[wallet-store] setSharedAddress called:', addr, 'current:', currentAddress, 'same?', addr === currentAddress)
  if (addr !== currentAddress) {
    currentAddress = addr
    console.log('[wallet-store] Address changed, notifying', listeners.size, 'listeners')
    notify()
  }
}

// ── Address resolution ───────────────────────────────────────────────

/**
 * Scans all single-sign-on-0x* keys and picks the one with the most recent
 * expiration (= the last session the user created via auth dapp).
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

// Cross-tab: other tab signs in/out
// Don't override if MetaMask explicitly set the address
window.addEventListener('storage', () => {
  if (!addressSetByMetaMask) {
    setSharedAddress(getStoredAddress())
  }
})

// MetaMask account switch
if (window.ethereum?.on) {
  console.log('[wallet-store] Registering global accountsChanged listener')
  window.ethereum.on('accountsChanged', (...args: unknown[]) => {
    const accounts = args[0] as string[]
    const newAccount = accounts?.[0]?.toLowerCase()
    console.log('[wallet-store] accountsChanged:', accounts, '→ newAccount:', newAccount)
    if (!newAccount) {
      setSharedAddress(null)
      return
    }
    const has = hasIdentityFor(newAccount)
    console.log('[wallet-store] hasIdentity for', newAccount, ':', has)
    if (has) {
      addressSetByMetaMask = true
      setSharedAddress(newAccount)
      return
    }
    console.log('[wallet-store] No identity, redirecting to auth')
    redirectToAuth(window.location.pathname, { loginMethod: 'METAMASK' })
  })
}

// On load: reconcile with MetaMask's active account
if (window.ethereum?.request) {
  window.ethereum
    .request({ method: 'eth_accounts' })
    .then(result => {
      const accounts = result as string[]
      const active = accounts?.[0]?.toLowerCase()
      if (active && hasIdentityFor(active) && active !== currentAddress) {
        addressSetByMetaMask = true
        setSharedAddress(active)
      }
    })
    .catch(() => {})
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

  const disconnect = useCallback(() => {
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
  }, [])

  return useMemo(
    () => ({
      address,
      isConnected: address !== null,
      isConnecting: false as const,
      disconnect
    }),
    [address, disconnect]
  )
}

export { useWalletAddress }
