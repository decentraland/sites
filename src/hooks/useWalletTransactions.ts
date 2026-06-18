import { useCallback, useSyncExternalStore } from 'react'
import type { WalletTransaction, WalletTransactionStatus } from './useWalletTransactions.types'

// Per-wallet, client-side transaction log persisted in localStorage. There is no public indexer
// for MANA ERC20 transfers (see the wallets investigation), so — like the standalone account dapp —
// we only track the actions the user initiates here (Send, Swap), with pending→confirmed/failed.
const STORAGE_PREFIX = 'dcl-account-wallet-txs-'
const MAX_TRANSACTIONS = 50 // bound localStorage growth per wallet

const listeners = new Set<() => void>()
const cache = new Map<string, WalletTransaction[]>()
const EMPTY: WalletTransaction[] = []

const storageKey = (address: string): string => `${STORAGE_PREFIX}${address.toLowerCase()}`

const loadFromStorage = (address: string): WalletTransaction[] => {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(storageKey(address))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as WalletTransaction[]) : EMPTY
  } catch {
    return EMPTY
  }
}

const getTransactions = (address: string): WalletTransaction[] => {
  const key = address.toLowerCase()
  let transactions = cache.get(key)
  if (!transactions) {
    transactions = loadFromStorage(address)
    cache.set(key, transactions)
  }
  return transactions
}

const persist = (address: string, transactions: WalletTransaction[]): void => {
  cache.set(address.toLowerCase(), transactions)
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(storageKey(address), JSON.stringify(transactions))
    } catch {
      // localStorage unavailable/full — keep the in-memory copy so the session still works.
    }
  }
  listeners.forEach(listener => listener())
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Reactive access to the wallet's tracked transactions. The store is a module singleton so a modal
 * (Send/Swap) can record a tx and the balance cards re-render immediately, across the component tree.
 */
function useWalletTransactions(address: string | undefined) {
  const getSnapshot = useCallback(() => (address ? getTransactions(address) : EMPTY), [address])
  const transactions = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)

  const addTransaction = useCallback(
    (transaction: WalletTransaction) => {
      if (!address) return
      persist(address, [transaction, ...getTransactions(address)].slice(0, MAX_TRANSACTIONS))
    },
    [address]
  )

  const updateTransactionStatus = useCallback(
    (hash: string, status: WalletTransactionStatus) => {
      if (!address) return
      persist(
        address,
        getTransactions(address).map(transaction => (transaction.hash === hash ? { ...transaction, status } : transaction))
      )
    },
    [address]
  )

  return { transactions, addTransaction, updateTransactionStatus }
}

export { useWalletTransactions }
