import type { WalletTransaction } from './useWalletTransactions.types'

/**
 * Whether applying `partial` to `transaction` would actually change it.
 *
 * Every field of a `WalletTransaction` is a primitive, so comparing the patched keys
 * is enough to tell a real update from a repeated one.
 */
function changesTransaction(transaction: WalletTransaction, partial: Partial<WalletTransaction>): boolean {
  return (Object.keys(partial) as (keyof WalletTransaction)[]).some(key => transaction[key] !== partial[key])
}

export { changesTransaction }
