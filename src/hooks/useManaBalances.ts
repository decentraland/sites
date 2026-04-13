import { useCallback, useEffect, useRef, useState } from 'react'
import { type Address, createPublicClient, formatEther, http } from 'viem'
import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'
import { Env, getEnv } from '@dcl/ui-env'

/**
 * MANA ERC20 contract addresses per network.
 * Hardcoded to avoid loading decentraland-transactions in the bundle.
 * Source: decentraland-transactions/src/contracts/manaToken.ts
 */
const MANA_CONTRACTS = {
  production: {
    ethereum: {
      address: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942' as Address,
      rpc: 'https://rpc.decentraland.org/mainnet'
    },
    polygon: {
      address: '0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4' as Address,
      rpc: 'https://rpc.decentraland.org/polygon'
    }
  },
  development: {
    ethereum: {
      address: '0xfa04d2e2ba9aec166c93dfeeba7427b2303befa9' as Address,
      rpc: 'https://rpc.decentraland.org/sepolia'
    },
    polygon: {
      address: '0x7ad72b9f944ea9793cf4055d88f81138cc2c63a0' as Address,
      rpc: 'https://rpc.decentraland.org/amoy'
    }
  }
}

const ERC20_BALANCE_OF_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const MIN_DISPLAY_BALANCE = 0.01 // Ignore dust balances below this threshold

function getContracts() {
  const env = getEnv()
  return env === Env.PRODUCTION ? MANA_CONTRACTS.production : MANA_CONTRACTS.development
}

// Lazy-initialized clients — created once per environment, reused across fetches
let ethClient: ReturnType<typeof createPublicClient> | null = null
let polyClient: ReturnType<typeof createPublicClient> | null = null

function getClients() {
  if (!ethClient || !polyClient) {
    const contracts = getContracts()
    const env = getEnv()
    ethClient = createPublicClient({
      chain: env === Env.PRODUCTION ? mainnet : sepolia,
      transport: http(contracts.ethereum.rpc)
    })
    polyClient = createPublicClient({
      chain: env === Env.PRODUCTION ? polygon : polygonAmoy,
      transport: http(contracts.polygon.rpc)
    })
  }
  return { ethClient, polyClient }
}

type ManaBalances = {
  ethereum: number
  polygon: number
}

/**
 * Returns MANA balances and a `fetch` trigger.
 *
 * Balances are NOT fetched on mount — call `fetchBalances()` when the user
 * opens the navbar user card to save RPC calls for users who never open it.
 *
 * Results are cached for 10 minutes. Subsequent calls to `fetchBalances()`
 * within the TTL return the cached value immediately (no loading state,
 * no RPC call). After 10 minutes the next call re-fetches.
 *
 * The cache is invalidated when the wallet address changes.
 * Balances below 0.01 MANA are treated as zero (dust filter).
 *
 * Uses Decentraland's own RPC proxy (`rpc.decentraland.org`) to avoid
 * CORS issues with public RPC endpoints.
 */
function useManaBalances(address: string | undefined) {
  const [balances, setBalances] = useState<ManaBalances | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const isLoadingRef = useRef(false)
  const cacheRef = useRef<{ address: string; balances: ManaBalances; fetchedAt: number } | null>(null)
  const addressRef = useRef(address)

  // Reset balances when address changes to avoid showing stale data
  useEffect(() => {
    addressRef.current = address
    if (!address) {
      setBalances(null)
      cacheRef.current = null
    } else if (cacheRef.current && cacheRef.current.address !== address) {
      setBalances(null)
    }
  }, [address])

  const fetchBalances = useCallback(() => {
    if (!address || isLoadingRef.current) return

    // Return cached result if still fresh and same address
    const cache = cacheRef.current
    if (cache && cache.address === address && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      setBalances(cache.balances)
      return
    }

    isLoadingRef.current = true
    setIsLoading(true)
    const walletAddress = address as Address
    const contracts = getContracts()
    const { ethClient: eth, polyClient: poly } = getClients()

    Promise.all([
      eth.readContract({
        address: contracts.ethereum.address,
        abi: ERC20_BALANCE_OF_ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      }),
      poly.readContract({
        address: contracts.polygon.address,
        abi: ERC20_BALANCE_OF_ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      })
    ])
      .then(([ethBalance, polyBalance]) => {
        // Stale check: if address changed while fetching, discard result
        if (addressRef.current !== address) return
        const result: ManaBalances = {
          ethereum: parseFloat(formatEther(ethBalance)),
          polygon: parseFloat(formatEther(polyBalance))
        }
        cacheRef.current = { address, balances: result, fetchedAt: Date.now() }
        setBalances(result)
      })
      .catch(() => {
        // Silently fail — MANA balances are non-critical
      })
      .finally(() => {
        isLoadingRef.current = false
        setIsLoading(false)
      })
  }, [address])

  return { balances, isLoading, fetchBalances, minDisplayBalance: MIN_DISPLAY_BALANCE }
}

export { useManaBalances, MIN_DISPLAY_BALANCE }
export type { ManaBalances }
