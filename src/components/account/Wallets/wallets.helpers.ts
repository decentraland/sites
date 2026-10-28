import { Env } from '@dcl/ui-env'
import { getCurrentEnv } from '../../../config/env'
import type { WalletTransactionNetwork } from '../../../hooks/useWalletTransactions.types'

// Wallet balances are shown in full (Figma 322:101467 — "100,595"), thousands-separated, with at
// most two decimals for sub-unit balances. The dust filter lives in useManaBalances.
const formatMana = (value: number): string => value.toLocaleString('en-US', { maximumFractionDigits: 2 })

// Block explorer per network/env — mainnet/polygon on production, sepolia/amoy otherwise.
const EXPLORER_BASE = {
  production: { ethereum: 'https://etherscan.io', polygon: 'https://polygonscan.com' },
  development: { ethereum: 'https://sepolia.etherscan.io', polygon: 'https://amoy.polygonscan.com' }
} as const

const getExplorerTxUrl = (network: WalletTransactionNetwork, hash: string): string => {
  const base = getCurrentEnv() === Env.PRODUCTION ? EXPLORER_BASE.production : EXPLORER_BASE.development
  return `${base[network]}/tx/${hash}`
}

export { formatMana, getExplorerTxUrl }
