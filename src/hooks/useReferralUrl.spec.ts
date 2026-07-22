import { renderHook } from '@testing-library/react'
import { useReferralUrl } from './useReferralUrl'

jest.mock('../config/env', () => ({
  getEnv: jest.fn((key: string) => {
    if (key === 'AUTH_URL') return 'https://decentraland.org/auth'
    if (key === 'DOWNLOAD_URL') return 'https://decentraland.org/download'
    return undefined
  })
}))

const REFERRER = '0x24e5f44999c151f08609f8e27b2238c773c4d020'

describe('when building the referral url', () => {
  describe('and direct download is disabled', () => {
    it('should point to the auth login with the referrer and a download redirect', () => {
      const { result } = renderHook(() => useReferralUrl(REFERRER))
      const url = new URL(result.current)
      expect(url.pathname).toBe('/auth/login')
      expect(url.searchParams.get('referrer')).toBe(REFERRER)
      expect(url.searchParams.get('redirectTo')).toBe('https://decentraland.org/download')
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
