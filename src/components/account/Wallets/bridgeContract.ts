import { getAddress } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { Env } from '@dcl/ui-env'
import { getCurrentEnv } from '../../../config/env'

// Polygon PoS bridge contracts on L1 (Ethereum), used to deposit MANA from Ethereum to Polygon.
// Same source as the standalone account dapp's `modules/mana` config. The withdraw direction
// (Polygon→Ethereum) is intentionally NOT here yet — it needs an L2 burn + a checkpoint wait +
// an exit proof, which is a separate follow-up.
const BRIDGE = {
  production: {
    rootChainManager: getAddress('0xA0c68C638235ee32657e8f720a23ceC1bFc77C77'),
    erc20Predicate: getAddress('0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf')
  },
  development: {
    rootChainManager: getAddress('0x34F5A25B627f50Bb3f5cAb72807c4D4F405a9232'),
    erc20Predicate: getAddress('0x4258c75b752c812b7fa586bdeb259f2d4bd17f4f')
  }
} as const

const isProduction = (): boolean => getCurrentEnv() === Env.PRODUCTION

/** The L1 chain id MANA can be deposited from (mainnet on prod, sepolia otherwise). */
const getL1ChainId = (): number => (isProduction() ? mainnet.id : sepolia.id)

/** Polygon PoS `RootChainManager` address on the active L1. */
const getRootChainManagerAddress = (): `0x${string}` => (isProduction() ? BRIDGE.production : BRIDGE.development).rootChainManager

/** ERC20 predicate address — the spender MANA must approve before a deposit. */
const getErc20PredicateAddress = (): `0x${string}` => (isProduction() ? BRIDGE.production : BRIDGE.development).erc20Predicate

const ERC20_ALLOWANCE_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const

const ROOT_CHAIN_MANAGER_ABI = [
  {
    name: 'depositFor',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'rootToken', type: 'address' },
      { name: 'depositData', type: 'bytes' }
    ],
    outputs: []
  }
] as const

export { ERC20_ALLOWANCE_ABI, ROOT_CHAIN_MANAGER_ABI, getErc20PredicateAddress, getL1ChainId, getRootChainManagerAddress }
