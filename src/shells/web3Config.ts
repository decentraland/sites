import { createWeb3CoreConfig } from '@dcl/core-web3'
import type { Web3CoreConfig } from '@dcl/core-web3'
import { Env, getEnv } from '@dcl/ui-env'

// core-web3's `environment` selects the default Magic key + default chains. sites only
// distinguishes production from everything else (dev/stg run on testnets), mirroring
// `useManaBalances.impl`.
const resolveEnvironment = (): 'dev' | 'prd' => (getEnv() === Env.PRODUCTION ? 'prd' : 'dev')

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
      appMetadata: { name: 'Decentraland', urlPath: '/account' }
    })
  }
  return config
}

export { getWeb3Config }
