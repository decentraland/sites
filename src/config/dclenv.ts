import { getCurrentEnv } from './env'

const ENV_TO_DCLENV: Record<string, string> = {
  dev: 'zone',
  stg: 'today',
  prd: 'org',
  prod: 'org'
}

function mapEnvToDclenv(env: string | null | undefined): string | undefined {
  return env ? ENV_TO_DCLENV[env] : undefined
}

function mapHostnameToDclenv(hostname: string): string | undefined {
  if (hostname === 'decentraland.zone' || hostname.endsWith('.decentraland.zone')) return 'zone'
  if (hostname === 'decentraland.today' || hostname.endsWith('.decentraland.today')) return 'today'
  return undefined
}

// Read the active @dcl/ui-env env (`dev`/`stg`/`prd`) through the env barrel
// so jest specs can stub it via the existing `../config/env` mock — `config.getEnv()`
// itself depends on `import.meta.env`, which isn't available under jest.
function mapConfigEnvToDclenv(): string | undefined {
  return mapEnvToDclenv(getCurrentEnv())
}

// Resolution order: explicit `?dclenv=` wins, then `?env=` mapped, then the
// current hostname (so opening decentraland.zone/jump implicitly targets the
// zone Explorer), then the @dcl/ui-env config (so `vite dev` against the
// zone config still produces zone deep-links even on localhost). Falls back
// to undefined (Explorer default = prod) only when the active env is `prod`.
function resolveExplorerEnv(
  searchParams: URLSearchParams,
  hostname: string = typeof window === 'undefined' ? '' : window.location.hostname
): string | undefined {
  return searchParams.get('dclenv') ?? mapEnvToDclenv(searchParams.get('env')) ?? mapHostnameToDclenv(hostname) ?? mapConfigEnvToDclenv()
}

export { mapConfigEnvToDclenv, mapEnvToDclenv, mapHostnameToDclenv, resolveExplorerEnv }
