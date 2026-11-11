import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'
import { createWeb3CoreConfig, thirdweb } from '@dcl/core-web3'
import type { Web3CoreConfig } from '@dcl/core-web3'
import { Env } from '@dcl/ui-env'
import { getCurrentEnv, getEnv } from '../config/env'
import { isThirdwebAccount } from '../hooks/useIsThirdwebAccount'

// core-web3's `environment` selects the default Magic key + default chains. sites only
// distinguishes production from everything else (dev/stg run on testnets), mirroring
// `useManaBalances.impl`. Uses the sites config env (defaults to 'dev' on localhost), NOT the
// standalone `getEnv()` which falls back to production on unknown hosts.
const resolveEnvironment = (): 'dev' | 'prd' => (getCurrentEnv() === Env.PRODUCTION ? 'prd' : 'dev')

let config: Web3CoreConfig | undefined

/**
 * Lazily builds (and memoizes) the core-web3 wagmi config for the BlockchainShell. Lazy — never at
 * module load — because it instantiates wallet connectors and the file is reachable from the lazy
 * shell chunk (rule 16: no top-level side effects/throws on the shell import graph).
 */
const getWeb3Config = (): Web3CoreConfig => {
  if (!config) {
    config = createWeb3CoreConfig({
      environment: resolveEnvironment(),
      appMetadata: { name: 'Decentraland', urlPath: '/account' },
      // Only for thirdweb logins: the connector restores its session on mount, which loads the thirdweb SDK.
      // Its chains default to Ethereum only, so the Polygon ones are listed for MANA on Polygon.
      additionalConnectors: isThirdwebAccount()
        ? [
            thirdweb({
              clientId: getEnv('THIRDWEB_CLIENT_ID') ?? '',
              supportedChainIds: [mainnet.id, polygon.id, sepolia.id, polygonAmoy.id]
            })
          ]
        : []
    })
  }
  return config
}

export { getWeb3Config }
