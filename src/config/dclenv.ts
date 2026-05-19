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

// Resolution order: explicit `?dclenv=` wins, then `?env=` mapped, then the
// current hostname (so opening decentraland.zone/jump implicitly targets the
// zone Explorer). Falls back to undefined (Explorer default = prod).
function resolveExplorerEnv(
  searchParams: URLSearchParams,
  hostname: string = typeof window === 'undefined' ? '' : window.location.hostname
): string | undefined {
  return searchParams.get('dclenv') ?? mapEnvToDclenv(searchParams.get('env')) ?? mapHostnameToDclenv(hostname)
}

export { mapEnvToDclenv, mapHostnameToDclenv, resolveExplorerEnv }
