import { getEnv } from '../../../config/env'

// NOTE: Buy and Swap deep-link out to the Marketplace — where the user already has a connected
// wallet — instead of running in-page. Send runs in-page through the lazy `BlockchainShell`
// (core-web3 / wagmi signer). Exact per-action Marketplace deep-link paths are pending product
// confirmation; for now both open the Marketplace root.
const getMarketplaceUrl = (): string => {
  const url = getEnv('MARKETPLACE_URL')
  if (!url) throw new Error('MARKETPLACE_URL environment variable is not set')
  return url
}

const buildBuyManaUrl = (): string => getMarketplaceUrl()
const buildSwapManaUrl = (): string => getMarketplaceUrl()

// Wallet balances are shown in full (Figma 322:101467 — "100,595"), thousands-separated, with at
// most two decimals for sub-unit balances. The dust filter lives in useManaBalances.
const formatMana = (value: number): string => value.toLocaleString('en-US', { maximumFractionDigits: 2 })

export { buildBuyManaUrl, buildSwapManaUrl, formatMana, getMarketplaceUrl }
