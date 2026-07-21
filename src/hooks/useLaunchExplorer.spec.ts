import { useSearchParams } from 'react-router-dom'
import { act, renderHook } from '@testing-library/react'
import { useAdvancedUserAgentData, useAnalytics } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { getEnv } from '../config/env'
import { collectCampaignParams } from '../modules/campaignParams'
import { detectDownloadOS } from '../modules/downloadConstants'
import { useAnonUserId } from './useAnonUserId'
import { useLaunchExplorer } from './useLaunchExplorer'
import { useTotalDownloads } from './useTotalDownloads'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn()
}))
jest.mock('@dcl/hooks', () => ({
  useAdvancedUserAgentData: jest.fn(),
  useAnalytics: jest.fn()
}))
jest.mock('decentraland-ui2', () => ({
  launchDesktopApp: jest.fn()
}))
jest.mock('./useAnonUserId', () => ({ ANON_USER_ID_PARAM: 'anon_user_id', useAnonUserId: jest.fn() }))
jest.mock('./useTotalDownloads', () => ({ useTotalDownloads: jest.fn(() => '+400K') }))
jest.mock('../config/env', () => ({ getEnv: jest.fn() }))
jest.mock('../modules/campaignParams', () => ({ collectCampaignParams: jest.fn(() => ({})) }))
jest.mock('../modules/url', () => ({
  // Mirror the real helper: resolve relative bases against the origin, append
  // the params, and fall back to the raw base if the URL can't be parsed.
  buildTrackedDownloadUrl: (base: string, params: Record<string, string | undefined | null>) => {
    try {
      const url = new URL(base, window.location.origin)
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.append(key, value)
      })
      return url.toString()
    } catch {
      return base
    }
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

const mockedUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>
const mockedUseAdvancedUserAgentData = useAdvancedUserAgentData as jest.MockedFunction<typeof useAdvancedUserAgentData>
const mockedUseAnalytics = useAnalytics as jest.MockedFunction<typeof useAnalytics>
const mockedLaunchDesktopApp = launchDesktopApp as jest.MockedFunction<typeof launchDesktopApp>
const mockedDetectDownloadOS = detectDownloadOS as jest.MockedFunction<typeof detectDownloadOS>
const mockedUseAnonUserId = useAnonUserId as jest.MockedFunction<typeof useAnonUserId>
const mockedUseTotalDownloads = useTotalDownloads as jest.MockedFunction<typeof useTotalDownloads>
const mockedGetEnv = getEnv as jest.MockedFunction<typeof getEnv>
const mockedCollectCampaignParams = collectCampaignParams as jest.MockedFunction<typeof collectCampaignParams>

describe('useLaunchExplorer', () => {
  let track: jest.Mock
  let windowOpenSpy: jest.SpyInstance

  beforeEach(() => {
    track = jest.fn()
    windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
    mockedUseSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()] as unknown as ReturnType<typeof useSearchParams>)
    mockedUseAnalytics.mockReturnValue({ track } as unknown as ReturnType<typeof useAnalytics>)
    mockedUseAdvancedUserAgentData.mockReturnValue([
      true,
      { os: { name: 'macOS' }, cpu: { architecture: 'arm64' }, mobile: false }
    ] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
    mockedDetectDownloadOS.mockReturnValue('apple')
    mockedUseAnonUserId.mockReturnValue(undefined)
    mockedUseTotalDownloads.mockReturnValue('+400K')
    mockedGetEnv.mockReturnValue(undefined)
    mockedCollectCampaignParams.mockReturnValue({})
  })

  afterEach(() => {
    windowOpenSpy.mockRestore()
    jest.resetAllMocks()
  })

  describe('when the desktop client launches successfully', () => {
    beforeEach(() => {
      mockedLaunchDesktopApp.mockResolvedValue(true)
    })

    it('should track the explorer launch and not open any fallback', async () => {
      const { result } = renderHook(() => useLaunchExplorer({ position: '0,0' }))

      await act(() => result.current.launchExplorer())

      expect(mockedLaunchDesktopApp).toHaveBeenCalled()
      expect(track).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ position: '0,0' }))
      expect(windowOpenSpy).not.toHaveBeenCalled()
      expect(result.current.isDownloadModalOpen).toBe(false)
    })

    it('should forward the scene-console url param into the deep link options', async () => {
      mockedUseSearchParams.mockReturnValue([new URLSearchParams('scene-console=true'), jest.fn()] as unknown as ReturnType<
        typeof useSearchParams
      >)

      const { result } = renderHook(() => useLaunchExplorer({ position: '0,0' }))

      await act(() => result.current.launchExplorer())

      expect(mockedLaunchDesktopApp).toHaveBeenCalledWith(expect.objectContaining({ sceneConsole: 'true' }))
    })

    it('should not include sceneConsole in the deep link options when absent from the url', async () => {
      const { result } = renderHook(() => useLaunchExplorer({ position: '0,0' }))

      await act(() => result.current.launchExplorer())

      const options = mockedLaunchDesktopApp.mock.calls[0][0]
      expect(options).not.toHaveProperty('sceneConsole')
    })
  })

  describe('when the desktop client is not installed', () => {
    beforeEach(() => {
      mockedLaunchDesktopApp.mockResolvedValue(false)
    })

    it('should open the download modal instead of redirecting', async () => {
      const { result } = renderHook(() => useLaunchExplorer({ position: '0,0' }))

      await act(() => result.current.launchExplorer())

      expect(result.current.isDownloadModalOpen).toBe(true)
      expect(windowOpenSpy).not.toHaveBeenCalled()

      act(() => result.current.closeDownloadModal())
      expect(result.current.isDownloadModalOpen).toBe(false)
    })

    it('should open the modal when launchDesktopApp throws', async () => {
      mockedLaunchDesktopApp.mockRejectedValue(new Error('boom'))
      const { result } = renderHook(() => useLaunchExplorer({ position: '0,0' }))

      await act(() => result.current.launchExplorer())

      expect(result.current.isDownloadModalOpen).toBe(true)
    })

    it('should carry non-default position and realm into the modal download url', () => {
      const { result } = renderHook(() => useLaunchExplorer({ position: '42,-5', realm: 'myworld.dcl.eth' }))

      const url = new URL(result.current.downloadModalProps.downloadUrl)
      expect(url.searchParams.get('position')).toBe('42,-5')
      expect(url.searchParams.get('realm')).toBe('myworld.dcl.eth')
    })

    it('should not carry default position or realm into the modal download url', () => {
      const { result } = renderHook(() => useLaunchExplorer({ position: '0,0', realm: 'main' }))

      const url = new URL(result.current.downloadModalProps.downloadUrl)
      expect(url.searchParams.get('position')).toBeNull()
      expect(url.searchParams.get('realm')).toBeNull()
    })

    it('should drop an empty position and keep the non-default realm', () => {
      const { result } = renderHook(() => useLaunchExplorer({ position: '', realm: 'myworld.dcl.eth' }))

      const url = new URL(result.current.downloadModalProps.downloadUrl)
      expect(url.searchParams.get('position')).toBeNull()
      expect(url.searchParams.get('realm')).toBe('myworld.dcl.eth')
    })

    it('should carry campaign params and anon_user_id into the modal download url', () => {
      mockedUseAnonUserId.mockReturnValue('11111111-1111-4111-8111-111111111111')

      mockedCollectCampaignParams.mockReturnValue({ utm_source: 'shefi' })
      const { result } = renderHook(() => useLaunchExplorer({ position: '10,20', realm: 'custom.dcl.eth' }))

      const url = new URL(result.current.downloadModalProps.downloadUrl)
      expect(url.searchParams.get('utm_source')).toBe('shefi')
      expect(url.searchParams.get('anon_user_id')).toBe('11111111-1111-4111-8111-111111111111')
      expect(url.searchParams.get('position')).toBe('10,20')
    })

    it('should keep the modal download url on the current origin for a relative DOWNLOAD_URL (dev/zone)', () => {
      // On dev/zone DOWNLOAD_URL is relative ("/download"); the modal must stay
      // on the zone origin instead of jumping to the prod constant.
      mockedGetEnv.mockReturnValue('/download')
      const { result } = renderHook(() => useLaunchExplorer({ position: '42,-5', realm: 'myworld.dcl.eth' }))

      const url = new URL(result.current.downloadModalProps.downloadUrl)
      expect(url.origin).toBe(window.location.origin)
      expect(url.pathname).toBe('/download')
      expect(url.searchParams.get('position')).toBe('42,-5')
    })

    it('should surface the total downloads label on the modal props', () => {
      mockedUseTotalDownloads.mockReturnValue('42000')
      const { result } = renderHook(() => useLaunchExplorer({ position: '0,0' }))

      expect(result.current.downloadModalProps.i18n.totalDownloads).toBe('Total Downloads: 42000')
    })
  })

  describe('when the user is on mobile', () => {
    beforeEach(() => {
      mockedUseAdvancedUserAgentData.mockReturnValue([
        true,
        { os: { name: 'iOS' }, cpu: { architecture: 'arm64' }, mobile: true }
      ] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
    })

    it('should open the mobile store instead of launching the desktop app', async () => {
      const { result } = renderHook(() => useLaunchExplorer({ position: '0,0' }))

      await act(() => result.current.launchExplorer())

      expect(result.current.isMobile).toBe(true)
      expect(windowOpenSpy).toHaveBeenCalledWith('https://app-store', '_self')
      expect(mockedLaunchDesktopApp).not.toHaveBeenCalled()
    })
  })
})
