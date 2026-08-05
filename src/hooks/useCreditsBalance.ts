import { useEffect, useRef, useState } from 'react'
import type { AuthIdentity } from '@dcl/crypto'
import { getEnv } from '../config/env'
import { fetchWithIdentity } from '../utils/signedFetch'

const CACHE_TTL_MS = 60 * 1000 // 1 minute — a balance changes on purchase, so it must not go stale for long

/** The `usd` block of the credits-server payload: spendable USD credits (1 credit = $0.10). */
type UsdBalance = { balanceCents: number; credits: number }
type UserCreditsResponse = { usd?: UsdBalance }

/** Cached across mounts so navigating between routes does not refetch on every navbar mount. */
let cache: { address: string; credits: number; fetchedAt: number } | null = null

/**
 * The signed-in wallet's spendable USD credits, for the navbar chip.
 *
 * Unlike `useManaBalances` (which only fetches when the user card opens) this runs on mount, because
 * the chip is always visible. The cost is bounded deliberately:
 *
 * - **Nothing is requested without a wallet.** No address or no identity → no fetch, so an anonymous
 *   homepage visit is completely unaffected and the homepage's Lighthouse budget is untouched.
 * - `decentraland-crypto-fetch` (~340 KB with its peer) stays dynamically imported, via
 *   `fetchWithIdentity`, so it never enters the critical chunk.
 * - The result is cached at module scope, so moving between routes reuses it instead of re-signing.
 *
 * Returns `null` while loading and on failure. A failed read must not render `0` — that reads as "you
 * have no credits", which is a different and misleading statement — so the caller hides the chip
 * instead. Absent credits (feature off, or never granted any) legitimately resolve to 0.
 */
function useCreditsBalance(address: string | undefined, identity: AuthIdentity | undefined) {
  const [credits, setCredits] = useState<number | null>(() => (cache && address && cache.address === address ? cache.credits : null))

  // Read in a ref so a new identity object with the same wallet cannot retrigger the effect: the
  // identity is regenerated per render by `useAuthIdentity`'s useMemo on address change only, but a
  // caller could pass a fresh object and turn this into a fetch loop.
  const identityRef = useRef(identity)
  identityRef.current = identity

  useEffect(() => {
    const currentIdentity = identityRef.current
    if (!address || !currentIdentity) {
      setCredits(null)
      return
    }

    if (cache && cache.address === address && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      setCredits(cache.credits)
      return
    }

    const controller = new AbortController()
    let active = true

    const load = async () => {
      try {
        const serverUrl = getEnv('CREDITS_SERVER_URL')
        if (!serverUrl) return
        const url = `${serverUrl}/users/${address.toLowerCase()}/credits`
        // Signed fetch (ADR-44): the credits-server only answers for the wallet in the path.
        const response = await fetchWithIdentity(url, currentIdentity, 'GET', undefined, undefined, controller.signal, {})
        // 404 means the wallet is unknown to the credits-server, which is a real zero, not an error — so
        // it is cached like any other answer, or a remount inside the TTL would re-sign to learn the same
        // thing. Any path that does NOT read the body has to release the stream itself.
        if (response.status === 404) {
          void response.body?.cancel()
          cache = { address, credits: 0, fetchedAt: Date.now() }
          if (active) setCredits(0)
          return
        }
        if (!response.ok) {
          void response.body?.cancel()
          return
        }
        const payload = (await response.json()) as UserCreditsResponse
        const value = payload.usd?.credits ?? 0
        cache = { address, credits: value, fetchedAt: Date.now() }
        if (active) setCredits(value)
      } catch {
        // Aborted or offline — leave the chip hidden rather than showing a misleading 0.
      }
    }

    void load()

    return () => {
      active = false
      controller.abort()
    }
  }, [address])

  return { credits }
}

export { useCreditsBalance }
