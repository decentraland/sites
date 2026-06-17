import { getAddress } from 'viem'
import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'
import { Env, getEnv } from '@dcl/ui-env'

type WalletNetwork = 'ethereum' | 'polygon'

// MANA ERC20 addresses per network/env — same source as `useManaBalances.impl` (checksummed).
const MANA_ADDRESS = {
  production: {
    ethereum: getAddress('0x0f5d2fb29fb7d3cfee444a200298f468908cc942'),
    polygon: getAddress('0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4')
  },
  development: {
    ethereum: getAddress('0xfa04d2e2ba9aec166c93dfeeba7427b2303befa9'),
    polygon: getAddress('0x7ad72b9f944ea9793cf4055d88f81138cc2c63a0')
  }
} as const

const CHAIN_ID = {
  production: { ethereum: mainnet.id, polygon: polygon.id },
  development: { ethereum: sepolia.id, polygon: polygonAmoy.id }
} as const

const isProduction = (): boolean => getEnv() === Env.PRODUCTION

/** MANA contract address for the network on the active environment. */
const getManaAddress = (network: WalletNetwork): `0x${string}` =>
  (isProduction() ? MANA_ADDRESS.production : MANA_ADDRESS.development)[network]

/** The chain id MANA lives on for the network on the active environment (mainnet/polygon vs sepolia/amoy). */
const getNetworkChainId = (network: WalletNetwork): number => (isProduction() ? CHAIN_ID.production : CHAIN_ID.development)[network]

const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const

export { ERC20_TRANSFER_ABI, getManaAddress, getNetworkChainId }
export type { WalletNetwork }
