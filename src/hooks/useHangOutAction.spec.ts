import { act, renderHook } from '@testing-library/react'
import { useAsyncMemo } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { collectCampaignParams } from '../modules/campaignParams'
import { detectDownloadOS } from '../modules/downloadConstants'
import { useAnonUserId } from './useAnonUserId'
import { useHangOutAction } from './useHangOutAction'
import { useWalletAddress } from './useWalletAddress'

jest.mock('@dcl/hooks', () => ({ useAsyncMemo: jest.fn() }))
jest.mock('decentraland-ui2', () => ({ launchDesktopApp: jest.fn() }))
jest.mock('./useWalletAddress', () => ({ useWalletAddress: jest.fn() }))
jest.mock('./useAnonUserId', () => ({ ANON_USER_ID_PARAM: 'anon_user_id', useAnonUserId: jest.fn() }))
jest.mock('../modules/campaignParams', () => ({ collectCampaignParams: jest.fn(() => ({})) }))
jest.mock('../modules/explorerDownloads', () => ({ ExplorerDownloads: { get: () => ({ getTotalDownloads: jest.fn() }) } }))
jest.mock('../modules/number', () => ({ formatToShorthand: (n: number) => `${n}` }))
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

const mockedUseAsyncMemo = useAsyncMemo as jest.MockedFunction<typeof useAsyncMemo>
const mockedLaunchDesktopApp = launchDesktopApp as jest.MockedFunction<typeof launchDesktopApp>
const mockedUseWalletAddress = useWalletAddress as jest.MockedFunction<typeof useWalletAddress>
const mockedUseAnonUserId = useAnonUserId as jest.MockedFunction<typeof useAnonUserId>
const mockedCollectCampaignParams = collectCampaignParams as jest.MockedFunction<typeof collectCampaignParams>
const mockedDetectDownloadOS = detectDownloadOS as jest.MockedFunction<typeof detectDownloadOS>

const clickEvent = () => ({ preventDefault: jest.fn() }) as unknown as React.MouseEvent

describe('useHangOutAction', () => {
  beforeEach(() => {
    // Invoke the thunk so the total-downloads fetcher itself is exercised, then
    // return the "not loaded yet" tuple by default.
    mockedUseAsyncMemo.mockImplementation(((fn: () => Promise<unknown>) => {
      void fn()
      return [null, { loading: false, loaded: false }]
    }) as unknown as typeof useAsyncMemo)
    mockedUseWalletAddress.mockReturnValue({ isConnected: false } as unknown as ReturnType<typeof useWalletAddress>)
    mockedUseAnonUserId.mockReturnValue(undefined)
    mockedCollectCampaignParams.mockReturnValue({})
    mockedDetectDownloadOS.mockReturnValue('apple')
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

    it('should default the total downloads label when the count has not loaded', () => {
      const { result } = renderHook(() => useHangOutAction())

      expect(result.current.totalDownloads).toBe('+400K')
    })

    it('should format the loaded total downloads count', () => {
      mockedUseAsyncMemo.mockImplementation(((fn: () => Promise<unknown>) => {
        void fn()
        return [42000, { loading: false, loaded: true }]
      }) as unknown as typeof useAsyncMemo)
      const { result } = renderHook(() => useHangOutAction())

      expect(result.current.totalDownloads).toBe('42000')
    })

    it('should close the modal via closeDownloadModal', async () => {
      mockedUseWalletAddress.mockReturnValue({ isConnected: false } as unknown as ReturnType<typeof useWalletAddress>)
      const { result } = renderHook(() => useHangOutAction())

      await act(async () => result.current.handleClick(clickEvent()))
      expect(result.current.isDownloadModalOpen).toBe(true)

      act(() => result.current.closeDownloadModal())
      expect(result.current.isDownloadModalOpen).toBe(false)
    })
  })
})
