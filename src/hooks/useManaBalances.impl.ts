import { type Address, createPublicClient, formatEther, http } from 'viem'
import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'
import { Env, getEnv } from '@dcl/ui-env'
import type { ManaBalances } from './useManaBalances.types'

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

function getContracts() {
  const env = getEnv()
  return env === Env.PRODUCTION ? MANA_CONTRACTS.production : MANA_CONTRACTS.development
}

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

async function fetchManaBalancesFromChain(address: string): Promise<ManaBalances> {
  const walletAddress = address as Address
  const contracts = getContracts()
  const { ethClient: eth, polyClient: poly } = getClients()

  const [ethBalance, polyBalance] = await Promise.all([
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

  return {
    ethereum: parseFloat(formatEther(ethBalance)),
    polygon: parseFloat(formatEther(polyBalance))
  }
}

export { fetchManaBalancesFromChain }
