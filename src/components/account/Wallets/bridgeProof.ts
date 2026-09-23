import { Env } from '@dcl/ui-env'
import { getCurrentEnv, getEnv } from '../../../config/env'

// Polygon's hosted proof-generation service. Generating the Merkle-Patricia exit proof client-side is
// impractical, so — like maticjs does under the hood — we ask this API for the ready-to-submit payload.

// keccak256("Transfer(address,address,uint256)") — the event the ERC20 withdrawal (L2 burn) emits and
// the exit proof is built from.
const ERC20_TRANSFER_EVENT_SIG = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

// Proof API network segment: `matic` (Polygon mainnet) on prod, `amoy` (testnet) otherwise.
const getProofApiNetwork = (): string => (getCurrentEnv() === Env.PRODUCTION ? 'matic' : 'amoy')

// Lazy getter (rule 16: never throw at module top-level in shell-reachable code).
const getProofApiBase = (): string => {
  const url = getEnv('MANA_PROOF_API')
  if (!url) throw new Error('MANA_PROOF_API environment variable is not set')
  return url.replace(/\/$/, '')
}

/**
 * Fetches the RLP exit payload for an L2 burn, to pass to `RootChainManager.exit`. Returns the payload
 * string when the burn is checkpointed and claimable, or `null` when the proof API reports it is not
 * checkpointed yet (the caller should keep waiting — the API answers 200 with `{ error: true,
 * message: "...has not been checkpointed yet" }`). Throws only on transport / unexpected errors.
 *
 * This is the single source of truth for "is the withdrawal claimable?": readiness polling and the
 * claim itself both go through it, so the claim button never appears before the exit actually works.
 */
async function fetchExitPayload(burnTxHash: string): Promise<`0x${string}` | null> {
  const url = `${getProofApiBase()}/api/v1/${getProofApiNetwork()}/exit-payload/${burnTxHash}?eventSignature=${ERC20_TRANSFER_EVENT_SIG}&tokenIndex=0`
  const response = await fetch(url)
  // Reject error statuses before reading the body, so an error response that happens to carry a
  // `result: "0x..."` field is never accepted as a valid exit payload (it would only revert on-chain).
  if (!response.ok) throw new Error(`Proof API responded ${response.status}`)
  const body: unknown = await response.json().catch(() => null)
  if (body && typeof body === 'object') {
    const result = (body as { result?: unknown }).result
    if (typeof result === 'string' && result.startsWith('0x')) return result as `0x${string}`
    // 200 with { error, message } while the burn isn't checkpointed yet → not ready, keep waiting.
    if ((body as { error?: unknown }).error) return null
  }
  return null
}

/**
 * Whether a withdrawal's L2 burn is checkpointed and its exit is claimable now. Network/transport
 * errors resolve to `false` so the caller just retries on the next poll.
 */
async function isWithdrawClaimable(burnTxHash: string): Promise<boolean> {
  try {
    return (await fetchExitPayload(burnTxHash)) !== null
  } catch {
    return false
  }
}

export { ERC20_TRANSFER_EVENT_SIG, fetchExitPayload, getProofApiNetwork, isWithdrawClaimable }
