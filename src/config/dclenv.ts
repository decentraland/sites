const ENV_TO_DCLENV: Record<string, string> = {
  dev: 'zone',
  stg: 'today',
  prd: 'org',
  prod: 'org'
}

function mapEnvToDclenv(env: string | null | undefined): string | undefined {
  return env ? ENV_TO_DCLENV[env] : undefined
}

export { mapEnvToDclenv }
