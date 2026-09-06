import { buildAuthRedirectUrl, redirectToAuth } from './authRedirect'

const mockGetEnv = jest.fn<string | undefined, [string]>((key: string) => {
  if (key === 'AUTH_URL') return 'https://decentraland.org/auth'
  return undefined
})

jest.mock('../config/env', () => ({
  getEnv: (key: string) => mockGetEnv(key)
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
      expect(buildAuthRedirectUrl('/events')).toBe('/events')
    })
  })

  describe('when called with a path that includes a query string', () => {
    it('should preserve the existing query parameters', () => {
      expect(buildAuthRedirectUrl('/events?tab=my')).toBe('/events?tab=my')
    })
  })

  describe('when called with additional query params', () => {
    it('should append them to the query string', () => {
      expect(buildAuthRedirectUrl('/events', { loginMethod: 'METAMASK' })).toBe('/events?loginMethod=METAMASK')
    })

    it('should merge with an existing query string', () => {
      expect(buildAuthRedirectUrl('/events?tab=my', { loginMethod: 'METAMASK' })).toBe('/events?tab=my&loginMethod=METAMASK')
    })
  })

  describe('when the JS bundle is served from cdn.decentraland.org (production)', () => {
    // In CI/prod builds, scripts/prebuild.cjs sets VITE_BASE_URL to the CDN URL so asset
    // imports resolve to cdn.decentraland.org. Earlier versions of authRedirect prefixed
    // this base onto the redirect path, producing a redirectTo pointing at the raw bundle
    // host instead of decentraland.org. The function MUST ignore that asset base.
    it('should not leak the CDN base URL into the redirect path', () => {
      expect(buildAuthRedirectUrl('/events')).not.toMatch(/^https?:\/\//)
      expect(buildAuthRedirectUrl('/events')).not.toContain('cdn.decentraland.org')
    })
  })

  describe('when called with an absolute URL on a different origin', () => {
    it('should keep only the pathname and search, dropping the foreign origin', () => {
      expect(buildAuthRedirectUrl('https://evil.example.com/events?foo=bar')).toBe('/events?foo=bar')
    })
  })
})

describe('redirectToAuth', () => {
  let assignMock: jest.Mock
  let replaceMock: jest.Mock
  const originalLocation = window.location

  beforeEach(() => {
    mockGetEnv.mockImplementation((key: string) => (key === 'AUTH_URL' ? 'https://decentraland.org/auth' : undefined))
    assignMock = jest.fn()
    replaceMock = jest.fn()
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        origin: 'https://decentraland.org',
        hostname: 'decentraland.org',
        assign: assignMock,
        replace: replaceMock
      }
    })
    localStorage.removeItem('dcl:sign-in-pending')
    localStorage.removeItem('dcl:sign-in-pending-snapshot')
    // Seed an SSO key so we can assert the snapshot captures it.
    localStorage.removeItem('single-sign-on-0xprev')
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
    jest.clearAllMocks()
  })

  describe('sign-in pending flag', () => {
    it('should mark a sign-in as pending before redirecting', () => {
      redirectToAuth('/events')

      const written = localStorage.getItem('dcl:sign-in-pending')
      expect(written).not.toBeNull()
      expect(Number(written)).toBeGreaterThan(0)
    })

    it('should snapshot an address→ephemeral-fingerprint map of known wallets before redirecting', () => {
      // Pretend the user already had MetaMask connected before clicking Sign In.
      localStorage.setItem('single-sign-on-0xprev', '{}')
      redirectToAuth('/events')

      const snapshot = JSON.parse(localStorage.getItem('dcl:sign-in-pending-snapshot') ?? '{}') as Record<string, string>
      expect(Object.keys(snapshot)).toEqual(['0xprev'])
    })
  })

  describe('when called from a same-origin page', () => {
    it('should push a history entry (location.assign) with a same-origin redirectTo so Back returns here', () => {
      redirectToAuth('/events', { loginMethod: 'METAMASK' })

      expect(assignMock).toHaveBeenCalledTimes(1)
      expect(replaceMock).not.toHaveBeenCalled()
      const [calledWith] = assignMock.mock.calls[0] as [string]
      const url = new URL(calledWith)
      const redirectTo = url.searchParams.get('redirectTo')
      expect(redirectTo).toBe('/events?loginMethod=METAMASK')
      expect(redirectTo).not.toContain('cdn.decentraland.org')
    })
  })

  describe('when called from a pure redirector page with { replace: true }', () => {
    it('should replace the current history entry so Back skips the redirector', () => {
      redirectToAuth('/events', undefined, { replace: true })

      expect(replaceMock).toHaveBeenCalledTimes(1)
      expect(assignMock).not.toHaveBeenCalled()
      const [calledWith] = replaceMock.mock.calls[0] as [string]
      const url = new URL(calledWith)
      expect(url.searchParams.get('redirectTo')).toBe('/events')
    })
  })

  describe('when AUTH_URL is relative on a Vercel preview deploy', () => {
    beforeEach(() => {
      mockGetEnv.mockImplementation((key: string) => (key === 'AUTH_URL' ? '/auth' : undefined))
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          ...originalLocation,
          origin: 'https://nautilus-preview.vercel.app',
          hostname: 'nautilus-preview.vercel.app',
          assign: assignMock,
          replace: replaceMock
        }
      })
    })

    it('should target the preview origin so the Vercel rewrite proxies /auth same-origin', () => {
      redirectToAuth('/events')

      expect(assignMock).toHaveBeenCalledTimes(1)
      const [calledWith] = assignMock.mock.calls[0] as [string]
      const url = new URL(calledWith)
      expect(url.origin).toBe('https://nautilus-preview.vercel.app')
      expect(url.pathname).toBe('/auth/login')
      expect(url.searchParams.get('redirectTo')).toBe('/events')
    })
  })

  describe('when AUTH_URL is unset', () => {
    beforeEach(() => {
      mockGetEnv.mockImplementation(() => undefined)
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          ...originalLocation,
          origin: 'http://localhost:5173',
          hostname: 'localhost',
          assign: assignMock,
          replace: replaceMock
        }
      })
    })

    it('should fall back to the relative /auth path', () => {
      redirectToAuth('/events')

      expect(assignMock).toHaveBeenCalledTimes(1)
      const [calledWith] = assignMock.mock.calls[0] as [string]
      expect(calledWith.startsWith('/auth/login?')).toBe(true)
    })
  })

  describe('when AUTH_URL is relative on localhost', () => {
    beforeEach(() => {
      mockGetEnv.mockImplementation((key: string) => (key === 'AUTH_URL' ? '/auth' : undefined))
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          ...originalLocation,
          origin: 'http://localhost:5173',
          hostname: 'localhost',
          assign: assignMock,
          replace: replaceMock
        }
      })
    })

    it('should use the relative /auth path so the Vite proxy handles the request', () => {
      redirectToAuth('/events')

      expect(assignMock).toHaveBeenCalledTimes(1)
      const [calledWith] = assignMock.mock.calls[0] as [string]
      expect(calledWith.startsWith('/auth/login?')).toBe(true)
    })
  })
})
