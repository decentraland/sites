// @dcl/core-web3 builds its wagmi config with the default `wagmi` storage prefix, so wagmi persists
// the most-recently-connected connector's id under this key (see @wagmi/core connect.js:
// `storage.setItem('recentConnectorId', connector.id)`, written through createStorage's `wagmi.`
// prefix). Reading it lets the provider-free account section learn the connected provider
// synchronously — without mounting a WagmiProvider — but only once a wallet action has populated it
// (core-web3 builds its wagmi config lazily, on the first BlockchainShell action; a fresh visit has
// no value yet).
const WAGMI_RECENT_CONNECTOR_KEY = 'wagmi.recentConnectorId'

/**
 * The id of the most-recently-connected wagmi connector (e.g. `'magic'`, `'injected'`,
 * `'walletConnect'`, `'coinbaseWallet'`), or `null` when wagmi has not connected on this origin yet.
 *
 * wagmi JSON-encodes the stored value; we decode defensively and return `null` on any unexpected
 * shape, so a future change to wagmi's storage format degrades gracefully (callers fall back to
 * other signals) instead of throwing.
 */
function getRecentConnectorId(): string | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(WAGMI_RECENT_CONNECTOR_KEY)
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'string' && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

export { getRecentConnectorId }
