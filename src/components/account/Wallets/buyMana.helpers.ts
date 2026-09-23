import { getEnv } from '../../../config/env'
import type { WalletNetwork } from './manaContract'

// Fiat on-ramp providers, matching the standalone account dapp's Buy modal. MoonPay only supports
// Ethereum MANA; Transak supports both networks.
type BuyManaProvider = 'moonpay' | 'transak'

const getRedirectUrl = (): string => (typeof window !== 'undefined' ? `${window.location.origin}/account/wallets` : '')

/**
 * MoonPay hosted checkout for Ethereum MANA. The publishable apiKey is client-side by design (the
 * same key the standalone account dapp ships) — no server-side signature is required. Opened in a new
 * tab synchronously, so it is never blocked by the popup blocker.
 */
function getMoonPayUrl(address: string): string {
  const base = getEnv('MOON_PAY_WIDGET_URL')
  const apiKey = getEnv('MOON_PAY_API_KEY')
  if (!base || !apiKey) throw new Error('MoonPay environment variables are not set')
  const params = new URLSearchParams({
    apiKey,
    currencyCode: 'MANA',
    walletAddress: address,
    redirectURL: getRedirectUrl()
  })
  return `${base}?${params.toString()}`
}

/**
 * Transak's session widget URL is built server-side by the marketplace API (it injects Transak's
 * apiKey + a short-lived session). The endpoint answers `{ ok, data: "<url>" }`; we also tolerate a
 * bare string or a `{ url }` shape. The returned URL is opened in a tab the caller already created
 * synchronously, so the popup blocker doesn't kill it.
 */
async function fetchTransakUrl(network: WalletNetwork, address: string): Promise<string> {
  const apiBase = getEnv('MARKETPLACE_API_URL')
  if (!apiBase) throw new Error('MARKETPLACE_API_URL environment variable is not set')
  const response = await fetch(`${apiBase}/v1/transak/widget-url`, {
    method: 'POST',
    // eslint-disable-next-line @typescript-eslint/naming-convention -- HTTP header name is not camelCase
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ defaultNetwork: network === 'polygon' ? 'polygon' : 'ethereum', walletAddress: address })
  })
  if (!response.ok) throw new Error(`Transak widget URL request failed (${response.status})`)
  const raw = await response.text()
  let url = raw
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed === 'string') {
      url = parsed
    } else if (parsed && typeof parsed === 'object') {
      const fields = parsed as { data?: unknown; url?: unknown }
      if (typeof fields.data === 'string') url = fields.data
      else if (typeof fields.url === 'string') url = fields.url
    }
  } catch {
    // not JSON — treat the body as the raw URL
  }
  // Defense-in-depth: the URL is first-party (built by the marketplace API), but it is navigated to
  // directly in a browser tab, so confirm it is an https Transak host before handing it over. A
  // domain-suffix allowlist tolerates Transak's per-environment subdomains (global / global-stg)
  // while still rejecting any non-Transak host.
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Transak returned no widget URL')
  }
  const isTransakHost = parsed.hostname === 'transak.com' || parsed.hostname.endsWith('.transak.com')
  if (parsed.protocol !== 'https:' || !isTransakHost) {
    throw new Error('Transak returned an unexpected widget URL')
  }
  return parsed.toString()
}

export { fetchTransakUrl, getMoonPayUrl }
export type { BuyManaProvider }
