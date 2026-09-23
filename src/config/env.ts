import type { Env } from '@dcl/ui-env'
import { config } from './index'

function getEnv(key: string): string | undefined {
  return config.get(key)
}

/**
 * Current resolved environment. Resolves via `?env=` query param > TLD (`.org`→prod, `.zone`→dev) >
 * the `REACT_APP_DCL_DEFAULT_ENV` default ('dev') set in `createConfig`. Prefer this over importing
 * `getEnv` straight from `@dcl/ui-env`: that standalone call has no default and falls back to
 * `Env.PRODUCTION` on unknown hosts (e.g. localhost), which makes dev point at mainnet/`.org`.
 */
function getCurrentEnv(): Env {
  return config.getEnv()
}

export { getCurrentEnv, getEnv }
