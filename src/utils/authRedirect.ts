import { getEnv } from '../config/env'

/**
 * Returns the base path the app is served from (Vite BASE_URL without trailing slash).
 */
function getBasePath(): string {
  const base = (import.meta as unknown as { env?: { ['BASE_URL']?: string } })?.env?.BASE_URL ?? '/'
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base
  return normalized === '' ? '' : normalized
}

/**
 * Builds a redirect path for after authentication, preserving query params.
 */
function buildAuthRedirectUrl(path: string, queryParams?: Record<string, string>): string {
  const basePath = getBasePath()
  const url = new URL(path, window.location.origin)

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  const pathWithQuery = url.pathname + url.search
  return `${basePath}${pathWithQuery}`
}

/**
 * Resolves auth URL:
 * - If AUTH_URL is absolute (http/https), use it directly
 * - If AUTH_URL is relative and we're on localhost, use relative path (for Vite proxy)
 * - If AUTH_URL is relative and we're NOT on localhost (e.g. preview deploy), use staging auth
 */
function resolveAuthUrl(): string {
  const authUrl = getEnv('AUTH_URL') ?? '/auth'

  if (authUrl.startsWith('http')) {
    return authUrl
  }

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  if (isLocalhost) {
    return authUrl
  }

  return 'https://decentraland.zone/auth'
}

/**
 * Clear wagmi's "disconnected" flags so connectors will attempt reconnection
 * after the user comes back from auth. Wagmi persists these flags when
 * disconnect() is called and refuses to auto-reconnect if they exist.
 * We preserve wagmi.store and connector-specific storage (magicChainId, etc).
 */
function clearDisconnectedFlags(): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.includes('.disconnected')) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
}

function redirectToAuth(path: string, queryParams?: Record<string, string>): void {
  const redirectTo = buildAuthRedirectUrl(path, queryParams)
  const authUrl = resolveAuthUrl()

  // Clear "disconnected" flags so wagmi will try to reconnect when returning
  // from auth. We do NOT clear wagmi.store or connector storage.
  clearDisconnectedFlags()

  window.location.replace(`${authUrl}/login?redirectTo=${encodeURIComponent(redirectTo)}`)
}

export { buildAuthRedirectUrl, redirectToAuth }
