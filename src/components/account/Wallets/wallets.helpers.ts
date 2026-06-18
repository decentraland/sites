import { Env } from '@dcl/ui-env'
import { getCurrentEnv, getEnv } from '../../../config/env'
import type { WalletTransactionNetwork } from '../../../hooks/useWalletTransactions.types'

// NOTE: Buy deep-links out to the Marketplace — where the user already has a connected wallet —
// instead of running in-page. Send and Swap run in-page through the lazy `BlockchainShell`
// (core-web3 / wagmi signer). Exact Marketplace deep-link path is pending product confirmation;
// for now Buy opens the Marketplace root.
const getMarketplaceUrl = (): string => {
  const url = getEnv('MARKETPLACE_URL')
  if (!url) throw new Error('MARKETPLACE_URL environment variable is not set')
  return url
}

const buildBuyManaUrl = (): string => getMarketplaceUrl()

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

export { buildBuyManaUrl, formatMana, getExplorerTxUrl, getMarketplaceUrl }
