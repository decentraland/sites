import { useCallback, useEffect, useRef, useState } from 'react'
import type { ManaBalances } from './useManaBalances.types'

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const MIN_DISPLAY_BALANCE = 0.01 // Ignore dust balances below this threshold

/**
 * Returns MANA balances and a `fetch` trigger.
 *
 * Balances are NOT fetched on mount — call `fetchBalances()` when the user
 * opens the navbar user card. The underlying viem client is dynamically
 * imported on first fetch so it stays out of the critical bundle for
 * homepage visitors who never open the user card.
 *
 * Results are cached for 10 minutes. Subsequent calls to `fetchBalances()`
 * within the TTL return the cached value immediately (no loading state,
 * no RPC call). After 10 minutes the next call re-fetches.
 *
 * The cache is invalidated when the wallet address changes.
 * Balances below 0.01 MANA are treated as zero (dust filter).
 */
function useManaBalances(address: string | undefined) {
  const [balances, setBalances] = useState<ManaBalances | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const isLoadingRef = useRef(false)
  const cacheRef = useRef<{ address: string; balances: ManaBalances; fetchedAt: number } | null>(null)
  const addressRef = useRef(address)

  useEffect(() => {
    addressRef.current = address
    if (!address) {
      setBalances(null)
      cacheRef.current = null
    } else if (cacheRef.current && cacheRef.current.address !== address) {
      setBalances(null)
    }
  }, [address])

  const fetchBalances = useCallback(async () => {
    if (!address || isLoadingRef.current) return

    const cache = cacheRef.current
    if (cache && cache.address === address && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      setBalances(cache.balances)
      return
    }

    isLoadingRef.current = true
    setIsLoading(true)

    try {
      const { fetchManaBalancesFromChain } = await import('./useManaBalances.impl')
      const result = await fetchManaBalancesFromChain(address)
      if (addressRef.current !== address) return
      cacheRef.current = { address, balances: result, fetchedAt: Date.now() }
      setBalances(result)
    } catch {
      // Silently fail — MANA balances are non-critical
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [address])

  return { balances, isLoading, fetchBalances, minDisplayBalance: MIN_DISPLAY_BALANCE }
}

export { useManaBalances, MIN_DISPLAY_BALANCE }
export type { ManaBalances }
