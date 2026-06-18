import { getEnv } from '../../../config/env'

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

export { buildBuyManaUrl, formatMana, getMarketplaceUrl }
