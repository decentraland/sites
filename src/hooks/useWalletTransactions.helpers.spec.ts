import { changesTransaction } from './useWalletTransactions.helpers'
import type { WalletTransaction } from './useWalletTransactions.types'

const transaction: WalletTransaction = {
  hash: '0xhash',
  type: 'send',
  network: 'ethereum',
  amount: 5,
  timestamp: 1000,
  status: 'pending'
}

describe('when the patch carries a different value', () => {
  it('should report a change', () => {
    expect(changesTransaction(transaction, { status: 'confirmed' })).toBe(true)
  })

  it('should report a change for any of the patched keys', () => {
    expect(changesTransaction(transaction, { status: 'pending', amount: 7 })).toBe(true)
  })
})

describe('when the patch carries the values the transaction already has', () => {
  it('should report no change', () => {
    expect(changesTransaction(transaction, { status: 'pending' })).toBe(false)
  })

  it('should report no change for a multi-key patch', () => {
    expect(changesTransaction(transaction, { status: 'pending', amount: 5 })).toBe(false)
  })
})

describe('when the patch is empty', () => {
  it('should report no change', () => {
    expect(changesTransaction(transaction, {})).toBe(false)
  })
})

describe('when the patch adds a key the transaction does not carry', () => {
  it('should report a change', () => {
    expect(changesTransaction(transaction, { claimHash: '0xexit' })).toBe(true)
  })
})
