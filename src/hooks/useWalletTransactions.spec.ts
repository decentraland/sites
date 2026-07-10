import { act, renderHook } from '@testing-library/react'
import { useWalletTransactions } from './useWalletTransactions'
import type { WalletTransaction } from './useWalletTransactions.types'

const ADDRESS = '0xAbC0000000000000000000000000000000000001'

const tx = (overrides: Partial<WalletTransaction> = {}): WalletTransaction => ({
  hash: '0xhash1',
  type: 'send',
  network: 'ethereum',
  amount: 5,
  timestamp: 1000,
  status: 'pending',
  ...overrides
})

describe('useWalletTransactions', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('should start empty for a wallet with no history', () => {
    const { result } = renderHook(() => useWalletTransactions(ADDRESS))
    expect(result.current.transactions).toEqual([])
  })

  it('should add a transaction and expose it newest-first', () => {
    const { result } = renderHook(() => useWalletTransactions(ADDRESS))

    act(() => result.current.addTransaction(tx({ hash: '0xa' })))
    act(() => result.current.addTransaction(tx({ hash: '0xb' })))

    expect(result.current.transactions.map(t => t.hash)).toEqual(['0xb', '0xa'])
  })

  it('should persist across hook instances (localStorage) keyed by address', () => {
    const first = renderHook(() => useWalletTransactions(ADDRESS))
    act(() => first.result.current.addTransaction(tx({ hash: '0xpersist' })))

    // a second consumer of the same wallet sees it (module singleton + localStorage)
    const second = renderHook(() => useWalletTransactions(ADDRESS.toLowerCase()))
    expect(second.result.current.transactions.map(t => t.hash)).toContain('0xpersist')
  })

  it('should update a transaction status by hash', () => {
    const { result } = renderHook(() => useWalletTransactions(ADDRESS))
    act(() => result.current.addTransaction(tx({ hash: '0xc', status: 'pending' })))

    act(() => result.current.updateTransactionStatus('0xc', 'confirmed'))

    expect(result.current.transactions.find(t => t.hash === '0xc')?.status).toBe('confirmed')
  })

  it('should patch arbitrary fields of a transaction by hash', () => {
    const { result } = renderHook(() => useWalletTransactions(ADDRESS))
    act(() => result.current.addTransaction(tx({ hash: '0xw', type: 'withdraw', amount: 42, status: 'checkpoint' })))

    act(() => result.current.updateTransaction('0xw', { status: 'pending', claimHash: '0xexit' }))

    const updated = result.current.transactions.find(t => t.hash === '0xw')
    expect(updated?.status).toBe('pending')
    expect(updated?.claimHash).toBe('0xexit')
    // untouched fields are preserved
    expect(updated?.amount).toBe(42)
  })

  it('should be a no-op without an address', () => {
    const { result } = renderHook(() => useWalletTransactions(undefined))
    act(() => result.current.addTransaction(tx()))
    expect(result.current.transactions).toEqual([])
  })
})
