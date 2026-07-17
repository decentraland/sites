import { useSearchParams } from 'react-router-dom'
import { act, renderHook } from '@testing-library/react'
import { useAdvancedUserAgentData, useAnalytics } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { getEnv } from '../config/env'
import { detectDownloadOS } from '../modules/downloadConstants'
import { addQueryParamsToUrlString } from '../modules/url'
import { useAuthIdentity } from './useAuthIdentity'
import { useLaunchExplorer } from './useLaunchExplorer'

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
jest.mock('./useAuthIdentity', () => ({ useAuthIdentity: jest.fn() }))
jest.mock('../config/env')
jest.mock('../modules/url', () => ({
  addQueryParamsToUrlString: jest.fn()
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
const mockedUseAuthIdentity = useAuthIdentity as jest.MockedFunction<typeof useAuthIdentity>
const mockedLaunchDesktopApp = launchDesktopApp as jest.MockedFunction<typeof launchDesktopApp>
const mockedDetectDownloadOS = detectDownloadOS as jest.MockedFunction<typeof detectDownloadOS>
const mockedAddQueryParams = addQueryParamsToUrlString as jest.MockedFunction<typeof addQueryParamsToUrlString>
const mockedGetEnv = getEnv as jest.MockedFunction<typeof getEnv>

describe('useLaunchExplorer', () => {
  let track: jest.Mock
  let windowOpenSpy: jest.SpyInstance

  beforeEach(() => {
    track = jest.fn()
    windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
    mockedUseSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()] as unknown as ReturnType<typeof useSearchParams>)
    mockedUseAnalytics.mockReturnValue({ track } as unknown as ReturnType<typeof useAnalytics>)
    mockedUseAuthIdentity.mockReturnValue({ hasValidIdentity: false } as unknown as ReturnType<typeof useAuthIdentity>)
    mockedUseAdvancedUserAgentData.mockReturnValue([
      true,
      { os: { name: 'macOS' }, cpu: { architecture: 'arm64' }, mobile: false }
    ] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
    mockedDetectDownloadOS.mockReturnValue('apple')
    mockedAddQueryParams.mockImplementation((url: string, params: Record<string, string | undefined | null>) => {
      const urlObj = new URL(url)
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlObj.searchParams.append(key, value)
        }
      })
      return urlObj.toString()
    })
    mockedGetEnv.mockReturnValue(undefined)
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
  })

  describe('when the desktop client is not installed', () => {
    beforeEach(() => {
      mockedLaunchDesktopApp.mockResolvedValue(false)
    })

    describe('and the user has a valid identity', () => {
      beforeEach(() => {
        mockedUseAuthIdentity.mockReturnValue({ hasValidIdentity: true } as unknown as ReturnType<typeof useAuthIdentity>)
        mockedGetEnv.mockImplementation(key => (key === 'DOWNLOAD_URL' ? 'https://dl.test/direct' : undefined))
      })

      it('should open the direct download url', async () => {
        const { result } = renderHook(() => useLaunchExplorer({ position: '0,0' }))

        await act(() => result.current.launchExplorer())

        expect(windowOpenSpy).toHaveBeenCalledWith('https://dl.test/direct', '_self')
      })

      it('should append position and realm to the download url when non-default', async () => {
        const { result } = renderHook(() => useLaunchExplorer({ position: '42,-5', realm: 'myworld.dcl.eth' }))

        await act(() => result.current.launchExplorer())

        expect(windowOpenSpy).toHaveBeenCalledWith('https://dl.test/direct?realm=myworld.dcl.eth&position=42%2C-5', '_self')
      })

      it('should not append default position or realm to the download url', async () => {
        const { result } = renderHook(() => useLaunchExplorer({ position: '0,0', realm: 'main' }))

        await act(() => result.current.launchExplorer())

        expect(windowOpenSpy).toHaveBeenCalledWith('https://dl.test/direct', '_self')
      })

      it('should drop an empty position and keep the non-default realm', async () => {
        const { result } = renderHook(() => useLaunchExplorer({ position: '', realm: 'myworld.dcl.eth' }))

        await act(() => result.current.launchExplorer())

        expect(windowOpenSpy).toHaveBeenCalledWith('https://dl.test/direct?realm=myworld.dcl.eth', '_self')
      })
    })

    describe('and the user has no identity but an onboarding url with a redirectTo', () => {
      const onboardingUrl = 'https://decentraland.org/auth/login/?newUser&redirectTo=https%3A%2F%2Fdecentraland.org%2Fdownload'

      beforeEach(() => {
        mockedGetEnv.mockImplementation(key => (key === 'ONBOARDING_URL' ? onboardingUrl : undefined))
      })

      it('should append position and realm to the inner redirectTo target, not the outer login url', async () => {
        const { result } = renderHook(() => useLaunchExplorer({ position: '42,-5', realm: 'myworld.dcl.eth' }))

        await act(() => result.current.launchExplorer())

        const openedUrl = new URL(windowOpenSpy.mock.calls[0][0])
        expect(openedUrl.origin + openedUrl.pathname).toBe('https://decentraland.org/auth/login/')
        expect(openedUrl.searchParams.get('position')).toBeNull()
        expect(openedUrl.searchParams.get('realm')).toBeNull()

        const redirectTo = new URL(openedUrl.searchParams.get('redirectTo') as string)
        expect(redirectTo.origin + redirectTo.pathname).toBe('https://decentraland.org/download')
        expect(redirectTo.searchParams.get('position')).toBe('42,-5')
        expect(redirectTo.searchParams.get('realm')).toBe('myworld.dcl.eth')
      })

      it('should open the onboarding url untouched when position and realm are the defaults', async () => {
        const { result } = renderHook(() => useLaunchExplorer({ position: '0,0', realm: 'main' }))

        await act(() => result.current.launchExplorer())

        expect(windowOpenSpy).toHaveBeenCalledWith(onboardingUrl, '_self')
      })
    })

    describe('and the user has no identity nor onboarding url', () => {
      it('should open the download modal', async () => {
        const { result } = renderHook(() => useLaunchExplorer({ position: '0,0' }))

        await act(() => result.current.launchExplorer())

        expect(result.current.isDownloadModalOpen).toBe(true)

        act(() => result.current.closeDownloadModal())
        expect(result.current.isDownloadModalOpen).toBe(false)
      })

      it('should include position and realm in the download modal url when non-default', async () => {
        const { result } = renderHook(() => useLaunchExplorer({ position: '10,20', realm: 'custom.dcl.eth' }))

        expect(result.current.downloadModalProps.downloadUrl).toBe('https://dl.test/apple?realm=custom.dcl.eth&position=10%2C20')
      })
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
