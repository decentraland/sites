import { createPublicClient, formatEther, getAddress, http } from 'viem'
import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'
import { Env, getEnv } from '@dcl/ui-env'
import type { ManaBalances } from './useManaBalances.types'

/**
 * MANA ERC20 contract addresses per network.
 * Hardcoded to avoid loading decentraland-transactions in the bundle.
 * Source: decentraland-transactions/src/contracts/manaToken.ts
 * Addresses are checksummed at module load to normalize casing (EIP-55).
 */
const MANA_CONTRACTS = {
  production: {
    ethereum: {
      address: getAddress('0x0f5d2fb29fb7d3cfee444a200298f468908cc942'),
      rpc: 'https://rpc.decentraland.org/mainnet'
    },
    polygon: {
      address: getAddress('0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4'),
      rpc: 'https://rpc.decentraland.org/polygon'
    }
  },
  development: {
    ethereum: {
      address: getAddress('0xfa04d2e2ba9aec166c93dfeeba7427b2303befa9'),
      rpc: 'https://rpc.decentraland.org/sepolia'
    },
    polygon: {
      address: getAddress('0x7ad72b9f944ea9793cf4055d88f81138cc2c63a0'),
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
  // Throws if not a valid hex address; returns EIP-55 checksummed form.
  const walletAddress = getAddress(address)
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
