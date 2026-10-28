import { useCallback, useSyncExternalStore } from 'react'
import { changesTransaction } from './useWalletTransactions.helpers'
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

  // A write that changes nothing still hands `useSyncExternalStore` a fresh array and
  // wakes every subscriber. That is how a confirmed transfer used to loop until React
  // gave up with "Maximum update depth exceeded" (SITES-2RX): the Send modal writes
  // `confirmed` from an effect, the re-render reached a parent that passes an inline
  // `onSuccess`, the new identity re-ran the effect, and the effect wrote again. Any
  // consumer that writes from an effect is exposed to the same loop, so the guard
  // belongs here rather than in the caller.
  const updateTransaction = useCallback(
    (hash: string, partial: Partial<WalletTransaction>) => {
      if (!address) return
      const current = getTransactions(address)
      const target = current.find(transaction => transaction.hash === hash)
      if (!target || !changesTransaction(target, partial)) return
      persist(
        address,
        current.map(transaction => (transaction.hash === hash ? { ...transaction, ...partial } : transaction))
      )
    },
    [address]
  )

  const updateTransactionStatus = useCallback(
    (hash: string, status: WalletTransactionStatus) => updateTransaction(hash, { status }),
    [updateTransaction]
  )

  return { transactions, addTransaction, updateTransaction, updateTransactionStatus }
}

export { useWalletTransactions }
