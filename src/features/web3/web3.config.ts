import { createWeb3CoreConfig, magic } from '@dcl/core-web3'
import { getEnv } from '../../config/env'

const WALLET_CONNECT_PROJECT_ID = getEnv('WALLET_CONNECT_PROJECT_ID') ?? ''
const MAGIC_API_KEY = getEnv('MAGIC_API_KEY') ?? ''

const additionalConnectors = MAGIC_API_KEY ? [magic({ apiKey: MAGIC_API_KEY })] : []

const web3Config = createWeb3CoreConfig({
  walletConnectProjectId: WALLET_CONNECT_PROJECT_ID,
  appMetadata: {
    name: 'Decentraland Landing',
    description: 'Decentraland Landing Site',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://decentraland.org'
  },
  connectors: {
    // Disable Coinbase Wallet SDK to avoid COOP header warning.
    // Users connect via the auth dapp which has its own wallet connectors.
    coinbaseWallet: false
  },
  additionalConnectors
})

export { MAGIC_API_KEY, web3Config }
