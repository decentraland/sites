import { act, renderHook } from '@testing-library/react'
import { launchDesktopApp } from 'decentraland-ui2'
import { getEnv } from '../config/env'
import { collectCampaignParams } from '../modules/campaignParams'
import { detectDownloadOS } from '../modules/downloadConstants'
import { useAnonUserId } from './useAnonUserId'
import { useDeepLinkQueryParams } from './useDeepLinkQueryParams'
import { useHangOutAction } from './useHangOutAction'
import { useTotalDownloads } from './useTotalDownloads'
import { useWalletAddress } from './useWalletAddress'

jest.mock('decentraland-ui2', () => ({ launchDesktopApp: jest.fn() }))
jest.mock('../config/env', () => ({ getEnv: jest.fn() }))
jest.mock('./useWalletAddress', () => ({ useWalletAddress: jest.fn() }))
jest.mock('./useTotalDownloads', () => ({ useTotalDownloads: jest.fn(() => '+400K') }))
jest.mock('./useAnonUserId', () => ({ ANON_USER_ID_PARAM: 'anon_user_id', useAnonUserId: jest.fn() }))
jest.mock('./useDeepLinkQueryParams', () => ({ useDeepLinkQueryParams: jest.fn(() => ({})) }))
jest.mock('../modules/campaignParams', () => ({ collectCampaignParams: jest.fn(() => ({})) }))
jest.mock('../modules/url', () => ({
  buildTrackedDownloadUrl: (base: string, params: Record<string, string | undefined | null>) => {
    const url = new URL(base, window.location.origin)
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
    googlePlay: 'https://google-play',
    appStore: 'https://app-store'
  },
  detectDownloadOS: jest.fn(() => 'apple')
}))

const mockedLaunchDesktopApp = launchDesktopApp as jest.MockedFunction<typeof launchDesktopApp>
const mockedDeepLinkQueryParams = useDeepLinkQueryParams as jest.MockedFunction<typeof useDeepLinkQueryParams>
const mockedGetEnv = getEnv as jest.MockedFunction<typeof getEnv>
const mockedUseWalletAddress = useWalletAddress as jest.MockedFunction<typeof useWalletAddress>
const mockedUseTotalDownloads = useTotalDownloads as jest.MockedFunction<typeof useTotalDownloads>
const mockedUseAnonUserId = useAnonUserId as jest.MockedFunction<typeof useAnonUserId>
const mockedCollectCampaignParams = collectCampaignParams as jest.MockedFunction<typeof collectCampaignParams>
const mockedDetectDownloadOS = detectDownloadOS as jest.MockedFunction<typeof detectDownloadOS>

const clickEvent = () => ({ preventDefault: jest.fn() }) as unknown as React.MouseEvent

describe('useHangOutAction', () => {
  beforeEach(() => {
    mockedUseWalletAddress.mockReturnValue({ isConnected: false } as unknown as ReturnType<typeof useWalletAddress>)
    mockedUseTotalDownloads.mockReturnValue('+400K')
    mockedUseAnonUserId.mockReturnValue(undefined)
    mockedCollectCampaignParams.mockReturnValue({})
    mockedDetectDownloadOS.mockReturnValue('apple')
    mockedGetEnv.mockReturnValue(undefined)
    mockedDeepLinkQueryParams.mockReturnValue({})
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the user is not connected', () => {
    it('should open the download modal without launching the desktop app', async () => {
      const { result } = renderHook(() => useHangOutAction())

      await act(async () => result.current.handleClick(clickEvent()))

      expect(result.current.isDownloadModalOpen).toBe(true)
      expect(mockedLaunchDesktopApp).not.toHaveBeenCalled()
    })
  })

  describe('when the user is connected', () => {
    beforeEach(() => {
      mockedUseWalletAddress.mockReturnValue({ isConnected: true } as unknown as ReturnType<typeof useWalletAddress>)
    })

    it('should not open the modal when the launcher is installed', async () => {
      mockedLaunchDesktopApp.mockResolvedValue(true)
      const { result } = renderHook(() => useHangOutAction())

      await act(async () => result.current.handleClick(clickEvent()))

      expect(result.current.isDownloadModalOpen).toBe(false)
    })

    it('should open the modal when the launcher is missing', async () => {
      mockedLaunchDesktopApp.mockResolvedValue(false)
      const { result } = renderHook(() => useHangOutAction())

      await act(async () => result.current.handleClick(clickEvent()))

      expect(result.current.isDownloadModalOpen).toBe(true)
    })

    it('should open the modal when launchDesktopApp throws', async () => {
      mockedLaunchDesktopApp.mockRejectedValue(new Error('blocked'))
      const { result } = renderHook(() => useHangOutAction())

      await act(async () => result.current.handleClick(clickEvent()))

      expect(result.current.isDownloadModalOpen).toBe(true)
    })

    it('should forward the deep-link query params into the launch', async () => {
      mockedDeepLinkQueryParams.mockReturnValue({ dclenv: 'zone', sceneConsole: 'true', multiInstance: 'true' })
      mockedLaunchDesktopApp.mockResolvedValue(true)
      const { result } = renderHook(() => useHangOutAction())

      await act(async () => result.current.handleClick(clickEvent()))

      expect(mockedLaunchDesktopApp).toHaveBeenCalledWith({ dclenv: 'zone', sceneConsole: 'true', multiInstance: 'true' })
    })
  })

  describe('the download modal props', () => {
    it('should carry campaign params and anon_user_id on the download url', () => {
      mockedUseAnonUserId.mockReturnValue('11111111-1111-4111-8111-111111111111')

      mockedCollectCampaignParams.mockReturnValue({ utm_source: 'shefi' })
      const { result } = renderHook(() => useHangOutAction())

      const url = new URL(result.current.downloadModalProps.downloadUrl)
      expect(url.searchParams.get('utm_source')).toBe('shefi')
      expect(url.searchParams.get('anon_user_id')).toBe('11111111-1111-4111-8111-111111111111')
    })

    it('should resolve a relative DOWNLOAD_URL against the origin instead of the prod constant', () => {
      mockedGetEnv.mockReturnValue('/download')
      const { result } = renderHook(() => useHangOutAction())

      const url = new URL(result.current.downloadModalProps.downloadUrl)
      expect(url.origin).toBe(window.location.origin)
      expect(url.pathname).toBe('/download')
    })

    it('should surface the total downloads label from useTotalDownloads', () => {
      mockedUseTotalDownloads.mockReturnValue('42000')
      const { result } = renderHook(() => useHangOutAction())

      expect(result.current.downloadModalProps.i18n?.totalDownloads).toBe('Total Downloads: 42000')
      expect(result.current.totalDownloads).toBe('42000')
    })

    it('should close the modal via closeDownloadModal', async () => {
      const { result } = renderHook(() => useHangOutAction())

      await act(async () => result.current.handleClick(clickEvent()))
      expect(result.current.isDownloadModalOpen).toBe(true)

      act(() => result.current.closeDownloadModal())
      expect(result.current.isDownloadModalOpen).toBe(false)
    })
  })
})
