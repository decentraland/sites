type WalletTransactionType = 'send' | 'swap'

type WalletTransactionStatus = 'pending' | 'confirmed' | 'failed'

type WalletTransactionNetwork = 'ethereum' | 'polygon'

/**
 * A wallet action the user initiated in sites (a MANA transfer or a swap/deposit). Tracked
 * client-side in localStorage — the standalone account dapp did the same, since there is no public
 * indexer for per-wallet MANA transfers. `network` is the chain the tx was submitted on (a swap is
 * an Ethereum→Polygon deposit, so it lives on `ethereum`).
 */
interface WalletTransaction {
  hash: string
  type: WalletTransactionType
  network: WalletTransactionNetwork
  amount: number
  timestamp: number
  status: WalletTransactionStatus
}

export type { WalletTransaction, WalletTransactionNetwork, WalletTransactionStatus, WalletTransactionType }
