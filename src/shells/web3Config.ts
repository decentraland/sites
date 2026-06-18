import { createWeb3CoreConfig } from '@dcl/core-web3'
import type { Web3CoreConfig } from '@dcl/core-web3'
import { Env } from '@dcl/ui-env'
import { getCurrentEnv } from '../config/env'

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
      appMetadata: { name: 'Decentraland', urlPath: '/account' }
    })
  }
  return config
}

export { getWeb3Config }
