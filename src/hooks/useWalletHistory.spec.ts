jest.mock('../features/account-wallet', () => {
  const helpers = jest.requireActual('../features/account-wallet/account-wallet.helpers')
  return {
    useGetManaTransfersQuery: jest.fn(),
    mergeManaTransferFeeds: helpers.mergeManaTransferFeeds
  }
})
jest.mock('./useWalletTransactions', () => ({ useWalletTransactions: jest.fn() }))

import { renderHook } from '@testing-library/react'
import { useGetManaTransfersQuery } from '../features/account-wallet'
import { useWalletHistory } from './useWalletHistory'
import { useWalletTransactions } from './useWalletTransactions'
import type { WalletTransaction } from './useWalletTransactions.types'

const queryMock = useGetManaTransfersQuery as unknown as jest.Mock
const localMock = useWalletTransactions as unknown as jest.Mock
const USER = '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd'

const tx = (hash: string, timestamp: number, status: WalletTransaction['status']): WalletTransaction => ({
  hash,
  type: 'send',
  network: 'ethereum',
  amount: 1,
  timestamp,
  status
})

const localResult = (transactions: WalletTransaction[]) => ({
  transactions,
  addTransaction: jest.fn(),
  updateTransactionStatus: jest.fn()
})

afterEach(() => jest.resetAllMocks())

describe('useWalletHistory', () => {
  it('should merge the subgraph history with the local optimistic feed, newest first', () => {
    queryMock.mockReturnValue({ data: [tx('0xindexed', 5000, 'confirmed')], isLoading: false, isError: false })
    localMock.mockReturnValue(localResult([tx('0xindexed', 5000, 'pending'), tx('0xfresh', 9000, 'pending')]))

    const { result } = renderHook(() => useWalletHistory(USER))

    expect(result.current.transactions.map(transaction => transaction.hash)).toEqual(['0xfresh', '0xindexed'])
    // the indexed tx is taken from the (confirmed) history, not the local pending copy
    expect(result.current.transactions.find(transaction => transaction.hash === '0xindexed')?.status).toBe('confirmed')
  })

  it('should return an empty feed when there is no history nor local activity', () => {
    queryMock.mockReturnValue({ data: undefined, isLoading: false, isError: false })
    localMock.mockReturnValue(localResult([]))

    const { result } = renderHook(() => useWalletHistory(undefined))

    expect(result.current.transactions).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('should expose the query loading/error flags', () => {
    queryMock.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    localMock.mockReturnValue(localResult([]))

    const { result } = renderHook(() => useWalletHistory(USER))

    expect(result.current.isLoading).toBe(true)
  })
})
