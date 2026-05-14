import { getEnv } from '../config/env'

/**
 * Builds a same-origin redirect path for after authentication, preserving query params.
 *
 * IMPORTANT: returns ONLY pathname + search (e.g. `/whats-on?foo=bar`) — never an
 * absolute URL. In production the JS bundle is served from `cdn.decentraland.org/@dcl/sites/<version>/`
 * (Vite's `base` / `import.meta.env.BASE_URL` points there so asset URLs resolve correctly),
 * but the USER is browsing `decentraland.org/...`. Mixing those two — e.g. prefixing the
 * CDN base onto a navigation path — produces a `redirectTo` like
 * `https://cdn.decentraland.org/@dcl/sites/0.18.0/whats-on`, which sends the user to the
 * raw bundle host after auth instead of back to the app. The auth dapp resolves the
 * relative `redirectTo` against the user's origin via the request referer, so a same-origin
 * path is exactly what we want here.
 */
function buildAuthRedirectUrl(path: string, queryParams?: Record<string, string>): string {
  const url = new URL(path, window.location.origin)

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  return url.pathname + url.search
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
