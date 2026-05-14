import { buildAuthRedirectUrl, redirectToAuth } from './authRedirect'

jest.mock('../config/env', () => ({
  getEnv: jest.fn((key: string) => {
    if (key === 'AUTH_URL') return 'https://decentraland.org/auth'
    return undefined
  })
}))

describe('buildAuthRedirectUrl', () => {
  const originalLocation = window.location

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, origin: 'https://decentraland.org', hostname: 'decentraland.org' }
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  })

  describe('when called with a simple path', () => {
    it('should return the same-origin path without any host prefix', () => {
      expect(buildAuthRedirectUrl('/whats-on')).toBe('/whats-on')
    })
  })

  describe('when called with a path that includes a query string', () => {
    it('should preserve the existing query parameters', () => {
      expect(buildAuthRedirectUrl('/whats-on?tab=my')).toBe('/whats-on?tab=my')
    })
  })

  describe('when called with additional query params', () => {
    it('should append them to the query string', () => {
      expect(buildAuthRedirectUrl('/whats-on', { loginMethod: 'METAMASK' })).toBe('/whats-on?loginMethod=METAMASK')
    })

    it('should merge with an existing query string', () => {
      expect(buildAuthRedirectUrl('/whats-on?tab=my', { loginMethod: 'METAMASK' })).toBe('/whats-on?tab=my&loginMethod=METAMASK')
    })
  })

  describe('when the JS bundle is served from cdn.decentraland.org (production)', () => {
    // In CI/prod builds, scripts/prebuild.cjs sets VITE_BASE_URL to the CDN URL so asset
    // imports resolve to cdn.decentraland.org. Earlier versions of authRedirect prefixed
    // this base onto the redirect path, producing a redirectTo pointing at the raw bundle
    // host instead of decentraland.org. The function MUST ignore that asset base.
    it('should not leak the CDN base URL into the redirect path', () => {
      expect(buildAuthRedirectUrl('/whats-on')).not.toMatch(/^https?:\/\//)
      expect(buildAuthRedirectUrl('/whats-on')).not.toContain('cdn.decentraland.org')
    })
  })

  describe('when called with an absolute URL on a different origin', () => {
    it('should keep only the pathname and search, dropping the foreign origin', () => {
      expect(buildAuthRedirectUrl('https://evil.example.com/whats-on?foo=bar')).toBe('/whats-on?foo=bar')
    })
  })
})

describe('redirectToAuth', () => {
  let replaceMock: jest.Mock
  const originalLocation = window.location

  beforeEach(() => {
    replaceMock = jest.fn()
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, origin: 'https://decentraland.org', hostname: 'decentraland.org', replace: replaceMock }
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
    jest.clearAllMocks()
  })

  describe('when called from a same-origin page', () => {
    it('should call window.location.replace with a same-origin redirectTo', () => {
      redirectToAuth('/whats-on', { loginMethod: 'METAMASK' })

      expect(replaceMock).toHaveBeenCalledTimes(1)
      const [calledWith] = replaceMock.mock.calls[0] as [string]
      const url = new URL(calledWith)
      const redirectTo = url.searchParams.get('redirectTo')
      expect(redirectTo).toBe('/whats-on?loginMethod=METAMASK')
      expect(redirectTo).not.toContain('cdn.decentraland.org')
    })
  })
})
