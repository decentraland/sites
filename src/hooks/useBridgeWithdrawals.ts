import { useEffect } from 'react'
import { isWithdrawClaimable } from '../components/account/Wallets/bridgeProof'
import { useWalletTransactions } from './useWalletTransactions'

const POLL_INTERVAL_MS = 30_000

/**
 * Polls the Polygon proof API for in-flight withdrawals: once a withdrawal's L2 burn is checkpointed
 * to Ethereum (its exit payload can be generated), it flips the locally-tracked row from `bridging`
 * to `checkpoint` so the Transactions list can offer the "claim on Ethereum" (exit) action. Readiness
 * is probed through the same exit-payload call the claim uses, so the claim button never appears
 * before the exit actually works. Mounted on the Wallets page; idles once nothing is awaiting.
 */
function useBridgeWithdrawals(address: string | undefined): void {
  const { transactions, updateTransaction } = useWalletTransactions(address)

  // The burns still awaiting a checkpoint, as a stable key, so the effect only re-subscribes when that
  // set actually changes — not on every unrelated tx update (each persist makes a new array).
  const pendingHashes = transactions
    .filter(transaction => transaction.type === 'withdraw' && transaction.status === 'bridging')
    .map(transaction => transaction.hash)
    .join(',')

  useEffect(() => {
    if (!pendingHashes) return undefined
    let cancelled = false

    const poll = async () => {
      for (const hash of pendingHashes.split(',')) {
        const claimable = await isWithdrawClaimable(hash)
        if (claimable && !cancelled) updateTransaction(hash, { status: 'checkpoint' })
      }
    }

    void poll()
    const intervalId = window.setInterval(() => void poll(), POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [pendingHashes, updateTransaction])
}

export { useBridgeWithdrawals }
