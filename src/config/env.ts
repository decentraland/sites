import { config } from './index'

function getEnv(key: string): string | undefined {
  return config.get(key)
}

export { config, getEnv }
