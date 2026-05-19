import { config } from './index'

function getEnv(key: string): string | undefined {
  return config.get(key)
}

// Returns the active `@dcl/ui-env` Env (`dev`, `stg`, `prd`). Exposed as a
// thin wrapper so jest specs can stub it via the existing `../config/env`
// jest.mock — `config.getEnv()` itself relies on `import.meta.env`, which
// doesn't run under jest.
function getCurrentEnv(): string | undefined {
  try {
    return config.getEnv()
  } catch {
    return undefined
  }
}

export { getCurrentEnv, getEnv }
