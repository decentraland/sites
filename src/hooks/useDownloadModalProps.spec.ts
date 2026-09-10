import { renderHook } from '@testing-library/react'
import { getEnv } from '../config/env'
import { detectDownloadOS } from '../modules/downloadConstants'
import { useAnonUserId } from './useAnonUserId'
import { useDownloadModalProps } from './useDownloadModalProps'
import { useTotalDownloads } from './useTotalDownloads'

jest.mock('./useAnonUserId', () => ({ useAnonUserId: jest.fn() }))
jest.mock('./useTotalDownloads', () => ({ useTotalDownloads: jest.fn(() => '+400K') }))
jest.mock('../config/env', () => ({ getEnv: jest.fn() }))
// The real builder is used on purpose: the referral `referrer` it picks off the
// URL only earns its keep if it reaches the modal's CTA href, and a stubbed
// builder would assert nothing about that hop.
jest.mock('../modules/campaignParams', () => ({ collectCampaignParams: () => ({}) }))
jest.mock('../modules/url', () => ({
  buildTrackedDownloadUrl: (base: string, params: Record<string, string | undefined | null>) => {
    const url = new URL(base, 'https://sites.test')
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.append(key, value)
    })
    return url.toString()
  }
}))
jest.mock('../modules/downloadConstants', () => ({
  DOWNLOAD_URLS: {
    apple: 'https://dl.test/apple',
    windows: 'https://dl.test/windows',
    epic: 'https://epic',
    googlePlay: 'https://gplay',
    appStore: 'https://appstore'
  },
  detectDownloadOS: jest.fn(() => 'apple')
}))

const mockedAnonUserId = useAnonUserId as jest.MockedFunction<typeof useAnonUserId>
const mockedTotalDownloads = useTotalDownloads as jest.MockedFunction<typeof useTotalDownloads>
const mockedGetEnv = getEnv as jest.MockedFunction<typeof getEnv>
const mockedDetectOS = detectDownloadOS as jest.MockedFunction<typeof detectDownloadOS>

const REFERRER = '0x1234567890abcdef1234567890abcdef12345678'

describe('useDownloadModalProps', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
    mockedAnonUserId.mockReturnValue('anon-9')
    mockedTotalDownloads.mockReturnValue('+400K')
    mockedGetEnv.mockReturnValue(undefined as never)
    mockedDetectOS.mockReturnValue('apple')
  })

  afterEach(() => jest.resetAllMocks())

  it('should build the store URLs, OS, and total-downloads label', () => {
    const { result } = renderHook(() => useDownloadModalProps({}))

    expect(result.current).toMatchObject({
      os: 'apple',
      epicUrl: 'https://epic',
      googlePlayUrl: 'https://gplay',
      appStoreUrl: 'https://appstore',
      i18n: { totalDownloads: 'Total Downloads: +400K' }
    })
  })

  it('should thread the deep-link params and anon id into the download URL', () => {
    const { result } = renderHook(() => useDownloadModalProps({ position: '-3,-2' }))

    expect(result.current.downloadUrl).toContain('position=-3%2C-2')
    expect(result.current.downloadUrl).toContain('anon_user_id=anon-9')
  })

  it('should thread the referral referrer from the current URL into the download URL', () => {
    window.history.replaceState({}, '', `/jump?position=-3,-2&referrer=${REFERRER}`)
    const { result } = renderHook(() => useDownloadModalProps({ position: '-3,-2' }))

    expect(result.current.downloadUrl).toContain(`referrer=${REFERRER}`)
    expect(result.current.downloadUrl).toContain('position=-3%2C-2')
  })

  it('should prefer the env DOWNLOAD_URL when set', () => {
    mockedGetEnv.mockReturnValue('https://custom.test/dl' as never)
    const { result } = renderHook(() => useDownloadModalProps({}))

    expect(result.current.downloadUrl).toContain('https://custom.test/dl')
  })

  it('should fall back to the Windows installer on Windows when no env URL is set', () => {
    mockedDetectOS.mockReturnValue('windows')
    const { result } = renderHook(() => useDownloadModalProps({}))

    expect(result.current.os).toBe('windows')
    expect(result.current.downloadUrl).toContain('dl.test/windows')
  })
})
