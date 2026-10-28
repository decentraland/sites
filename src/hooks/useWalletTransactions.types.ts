// send/received: plain MANA transfers. swap: Ethereum→Polygon bridge deposit. withdraw:
// Polygon→Ethereum bridge withdrawal. (send/swap are also produced by the in-page Send/Swap flows.)
type WalletTransactionType = 'send' | 'received' | 'swap' | 'withdraw'

// pending/confirmed/failed: in-page tx lifecycle. bridging: a swap/withdraw mined on its origin
// chain whose destination-chain credit hasn't landed yet (~20-30 min PoS checkpoint). checkpoint: a
// withdrawal whose L2 burn has been checkpointed to Ethereum and is now claimable (exit) on L1.
type WalletTransactionStatus = 'pending' | 'confirmed' | 'failed' | 'bridging' | 'checkpoint'

type WalletTransactionNetwork = 'ethereum' | 'polygon'

/**
 * A MANA movement in the wallet's history. The confirmed history comes from the `mana-graph`
 * subgraph (Log entity); the in-page Send/Swap flows also track their own tx optimistically in
 * localStorage (pending→confirmed/bridging) so they show before the subgraph indexes them.
 * `network` is the chain the movement's anchor leg lives on (a swap anchors on its Ethereum deposit,
 * a withdrawal on its Polygon burn).
 *
 * `claimHash` only applies to an in-progress withdrawal: it is the L1 exit tx hash once the user
 * claims it (readiness for that claim is probed via the proof API keyed by `hash`, the L2 burn tx).
 */
interface WalletTransaction {
  hash: string
  type: WalletTransactionType
  network: WalletTransactionNetwork
  amount: number
  timestamp: number
  status: WalletTransactionStatus
  claimHash?: string
}

export type { WalletTransaction, WalletTransactionNetwork, WalletTransactionStatus, WalletTransactionType }
