import type { WalletTransactionNetwork } from '../../hooks/useWalletTransactions.types'

/**
 * A `Log` row from the `mana-graph` subgraph — one MANA ERC20 `Transfer` event.
 * `from`/`to` are lowercased addresses, `value` is wei, `time` is unix seconds (strings, as the
 * subgraph returns BigInt as string over GraphQL).
 */
interface ManaSubgraphLog {
  txHash: string
  from: string
  to: string
  value: string
  time: string
}

/** A decoded log normalized for classification (addresses lowercased, value as bigint, time in ms). */
interface DecodedManaLog {
  network: WalletTransactionNetwork
  from: string
  to: string
  value: bigint
  hash: string
  timestamp: number
}

interface GetManaTransfersArgs {
  address: string
}

export type { DecodedManaLog, GetManaTransfersArgs, ManaSubgraphLog }
