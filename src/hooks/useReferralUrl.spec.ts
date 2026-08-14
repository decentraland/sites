import { renderHook } from '@testing-library/react'
import { useReferralUrl } from './useReferralUrl'

const mockGetEnv = jest.fn()

jest.mock('../config/env', () => ({
  getEnv: (key: string) => mockGetEnv(key)
}))

const REFERRER = '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd'

describe('when the auth and download URLs are configured', () => {
  beforeEach(() => {
    mockGetEnv.mockImplementation((key: string) => {
      if (key === 'AUTH_URL') return 'https://decentraland.org/auth'
      if (key === 'DOWNLOAD_URL') return 'https://decentraland.org/download'
      return ''
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and direct download is disabled', () => {
    it('should attach the referrer and the download redirect', () => {
      const { result } = renderHook(() => useReferralUrl(REFERRER))

      const url = new URL(result.current)
      expect(url.pathname).toBe('/auth/login')
      expect(url.searchParams.get('referrer')).toBe(REFERRER)
      expect(url.searchParams.get('redirectTo')).toBe(`https://decentraland.org/download?referrer=${REFERRER}`)
    })

    it('should keep the referrer on redirectTo so it survives an auth bounce', () => {
      // Auth forwards the visitor to `redirectTo` verbatim. When there is nothing
      // to do on auth (existing session, complete profile) the visitor lands on
      // /download directly, so the referrer has to be inside that URL or the
      // installer chain loses the attribution.
      const { result } = renderHook(() => useReferralUrl(REFERRER))

      const redirectTo = new URL(new URL(result.current).searchParams.get('redirectTo') as string)
      expect(redirectTo.pathname).toBe('/download')
      expect(redirectTo.searchParams.get('referrer')).toBe(REFERRER)
    })

    it('should omit the referrer param when no referrer is given', () => {
      const { result } = renderHook(() => useReferralUrl(undefined))

      const url = new URL(result.current)
      expect(url.searchParams.has('referrer')).toBe(false)
      expect(url.searchParams.get('redirectTo')).toBe('https://decentraland.org/download')
    })

    it('should pick up a referrer that resolves after the first render', () => {
      const { result, rerender } = renderHook(({ referrer }: { referrer?: string }) => useReferralUrl(referrer), {
        initialProps: {} as { referrer?: string }
      })

      expect(new URL(result.current).searchParams.has('referrer')).toBe(false)

      rerender({ referrer: REFERRER })

      expect(new URL(result.current).searchParams.get('referrer')).toBe(REFERRER)
    })
  })

  describe('and direct download is enabled', () => {
    it('should point to the download page carrying the referrer', () => {
      const { result } = renderHook(() => useReferralUrl(REFERRER, true))

      const url = new URL(result.current)
      expect(url.pathname).toBe('/download')
      expect(url.searchParams.get('referrer')).toBe(REFERRER)
      expect(url.searchParams.get('redirectTo')).toBeNull()
    })

    it('should omit the referrer param when there is no referrer', () => {
      const { result } = renderHook(() => useReferralUrl(undefined, true))

      const url = new URL(result.current)
      expect(url.pathname).toBe('/download')
      expect(url.searchParams.has('referrer')).toBe(false)
    })
  })
})

describe('when the env vars are missing', () => {
  beforeEach(() => {
    mockGetEnv.mockReturnValue('')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should fall back to the relative auth and download paths', () => {
    const { result } = renderHook(() => useReferralUrl(REFERRER))

    const url = new URL(result.current)
    expect(url.pathname).toBe('/auth/login')
    expect(url.searchParams.get('redirectTo')).toBe(`/download?referrer=${REFERRER}`)
  })

  it('should leave the relative redirect untouched when there is no referrer', () => {
    const { result } = renderHook(() => useReferralUrl(undefined))

    expect(new URL(result.current).searchParams.get('redirectTo')).toBe('/download')
  })
})
