const mockUpdateTransaction = jest.fn()
const mockIsWithdrawClaimable = jest.fn()
let mockTransactions: WalletTransaction[]

jest.mock('../components/account/Wallets/bridgeProof', () => ({
  isWithdrawClaimable: (hash: string) => mockIsWithdrawClaimable(hash)
}))

jest.mock('./useWalletTransactions', () => ({
  useWalletTransactions: () => ({ transactions: mockTransactions, updateTransaction: mockUpdateTransaction })
}))

import { renderHook, waitFor } from '@testing-library/react'
import { useBridgeWithdrawals } from './useBridgeWithdrawals'
import type { WalletTransaction } from './useWalletTransactions.types'

const bridgingWithdraw: WalletTransaction = {
  hash: '0xburn',
  type: 'withdraw',
  network: 'polygon',
  amount: 50,
  timestamp: 1,
  status: 'bridging'
}

describe('useBridgeWithdrawals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTransactions = []
    mockIsWithdrawClaimable.mockResolvedValue(false)
  })

  it('should flip a bridging withdrawal to checkpoint once its exit becomes claimable', async () => {
    mockTransactions = [bridgingWithdraw]
    mockIsWithdrawClaimable.mockResolvedValue(true)

    renderHook(() => useBridgeWithdrawals('0xUSER'))

    await waitFor(() => expect(mockUpdateTransaction).toHaveBeenCalledWith('0xburn', { status: 'checkpoint' }))
    expect(mockIsWithdrawClaimable).toHaveBeenCalledWith('0xburn')
  })

  it('should not flip the row while the exit is not claimable yet', async () => {
    mockTransactions = [bridgingWithdraw]

    renderHook(() => useBridgeWithdrawals('0xUSER'))

    await waitFor(() => expect(mockIsWithdrawClaimable).toHaveBeenCalledWith('0xburn'))
    expect(mockUpdateTransaction).not.toHaveBeenCalled()
  })

  it('should not poll non-withdrawals or already-settled rows', () => {
    mockTransactions = [
      { ...bridgingWithdraw, status: 'confirmed' },
      { ...bridgingWithdraw, hash: '0xsend', type: 'send' }
    ]

    renderHook(() => useBridgeWithdrawals('0xUSER'))

    expect(mockIsWithdrawClaimable).not.toHaveBeenCalled()
  })

  it('should keep re-polling on an interval while the exit stays unclaimable', async () => {
    jest.useFakeTimers()
    try {
      mockTransactions = [bridgingWithdraw]
      mockIsWithdrawClaimable.mockResolvedValue(false)

      renderHook(() => useBridgeWithdrawals('0xUSER'))

      // initial poll + at least one interval tick
      await jest.advanceTimersByTimeAsync(30_000)
      expect(mockIsWithdrawClaimable.mock.calls.length).toBeGreaterThanOrEqual(2)
    } finally {
      jest.useRealTimers()
    }
  })
})
