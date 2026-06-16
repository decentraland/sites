import { getEnv } from '../../../config/env'

// NOTE: Buy / Swap / Send are on-chain operations that require a connected Web3 signer, which
// sites deliberately does not provide (no wagmi / decentraland-connect / thirdweb on heavy
// routes). Per the approved migration plan these deep-link out to the Marketplace — where the
// user already has a connected wallet — instead of running in-page. Exact per-action Marketplace
// deep-link paths are pending product confirmation; for now all three open the Marketplace root.
const getMarketplaceUrl = (): string => {
  const url = getEnv('MARKETPLACE_URL')
  if (!url) throw new Error('MARKETPLACE_URL environment variable is not set')
  return url
}

const buildBuyManaUrl = (): string => getMarketplaceUrl()
const buildSwapManaUrl = (): string => getMarketplaceUrl()
const buildSendManaUrl = (): string => getMarketplaceUrl()

// Wallet balances are shown in full (Figma 322:101467 — "100,595"), thousands-separated, with at
// most two decimals for sub-unit balances. The dust filter lives in useManaBalances.
const formatMana = (value: number): string => value.toLocaleString('en-US', { maximumFractionDigits: 2 })

export { buildBuyManaUrl, buildSendManaUrl, buildSwapManaUrl, formatMana, getMarketplaceUrl }
