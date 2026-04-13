import { useCallback, useRef, useState } from 'react'
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
      chain: mainnet,
      rpc: 'https://rpc.decentraland.org/mainnet'
    },
    polygon: {
      address: '0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4' as Address,
      chain: polygon,
      rpc: 'https://rpc.decentraland.org/polygon'
    }
  },
  development: {
    ethereum: {
      address: '0xfa04d2e2ba9aec166c93dfeeba7427b2303befa9' as Address,
      chain: sepolia,
      rpc: 'https://rpc.decentraland.org/sepolia'
    },
    polygon: {
      address: '0x7ad72b9f944ea9793cf4055d88f81138cc2c63a0' as Address,
      chain: polygonAmoy,
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

function getContracts() {
  const env = getEnv()
  return env === Env.PRODUCTION ? MANA_CONTRACTS.production : MANA_CONTRACTS.development
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
 *
 * Uses Decentraland's own RPC proxy (`rpc.decentraland.org`) to avoid
 * CORS issues with public RPC endpoints.
 */
function useManaBalances(address: string | undefined) {
  const [balances, setBalances] = useState<ManaBalances | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const cacheRef = useRef<{ address: string; balances: ManaBalances; fetchedAt: number } | null>(null)

  const fetchBalances = useCallback(() => {
    if (!address || isLoading) return

    // Return cached result if still fresh and same address
    const cache = cacheRef.current
    if (cache && cache.address === address && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      setBalances(cache.balances)
      return
    }

    setIsLoading(true)
    const walletAddress = address as Address
    const contracts = getContracts()

    const readBalance = async (config: { address: Address; chain: typeof mainnet; rpc: string }): Promise<bigint> => {
      const client = createPublicClient({ chain: config.chain, transport: http(config.rpc) })
      return client.readContract({
        address: config.address,
        abi: ERC20_BALANCE_OF_ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      })
    }

    Promise.all([readBalance(contracts.ethereum), readBalance(contracts.polygon)])
      .then(([ethBalance, polyBalance]) => {
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
        setIsLoading(false)
      })
  }, [address, isLoading])

  return { balances, isLoading, fetchBalances }
}

export { useManaBalances }
export type { ManaBalances }
