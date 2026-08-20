const ENV_TO_DCLENV: Record<string, string> = {
  dev: 'zone',
  stg: 'today',
  prd: 'org',
  prod: 'org'
}

// The Explorer environments this site can target. `?dclenv` is matched against
// this set rather than forwarded verbatim: the value lands in the
// `decentraland://` deep link, and ui2's `buildDecentralandUrl` presence-checks
// it without validating, so an arbitrary `?dclenv` on any route that carries the
// navbar could redirect which Explorer environment the user opens.
const DCLENV_VALUES = new Set(Object.values(ENV_TO_DCLENV))

function mapEnvToDclenv(env: string | null | undefined): string | undefined {
  return env ? ENV_TO_DCLENV[env] : undefined
}

// `?env` goes through `mapEnvToDclenv`, which already drops unknown values.
// `?dclenv` names the target directly, so it needs the same gate.
function normalizeDclenv(dclenv: string | null | undefined): string | undefined {
  return dclenv && DCLENV_VALUES.has(dclenv) ? dclenv : undefined
}

export { mapEnvToDclenv, normalizeDclenv }
