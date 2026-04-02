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

function redirectToAuth(path: string, queryParams?: Record<string, string>): void {
  const redirectTo = buildAuthRedirectUrl(path, queryParams)
  const authUrl = resolveAuthUrl()

  window.location.replace(`${authUrl}/login?redirectTo=${encodeURIComponent(redirectTo)}`)
}

export { buildAuthRedirectUrl, redirectToAuth }
