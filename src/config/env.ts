import { config } from './index'

export function getEnv(key: string): string | undefined {
  return config.get(key)
}
