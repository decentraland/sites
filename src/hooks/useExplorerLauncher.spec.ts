import { useSearchParams } from 'react-router-dom'
import { act, renderHook } from '@testing-library/react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { buildMobileDeepLink } from '../features/places/places.helpers'
import { detectDownloadOS } from '../modules/downloadConstants'
import { launchMobileApp } from '../utils/mobileAppLaunch'
import { isClientNotInstalled, shouldPromptDownload, useExplorerLauncher } from './useExplorerLauncher'

jest.mock('react-router-dom', () => ({ useSearchParams: jest.fn() }))
jest.mock('@dcl/hooks', () => ({ useAdvancedUserAgentData: jest.fn() }))
jest.mock('decentraland-ui2', () => ({ launchDesktopApp: jest.fn() }))
jest.mock('../features/places/places.helpers', () => ({
  buildDeepLinkOptions: (input: { position?: string; realm?: string; dclenv?: string; sceneConsole?: string; multiInstance?: string }) => ({
    ...(input.position ? { position: input.position } : {}),
    ...(input.realm ? { realm: input.realm } : {}),
    ...(input.dclenv ? { dclenv: input.dclenv } : {}),
    ...(input.sceneConsole ? { sceneConsole: input.sceneConsole } : {}),
    ...(input.multiInstance ? { multiInstance: input.multiInstance } : {})
  }),
  buildMobileDeepLink: jest.fn()
}))
jest.mock('../modules/downloadConstants', () => ({
  DOWNLOAD_URLS: { googlePlay: 'https://gplay', appStore: 'https://appstore' },
  detectDownloadOS: jest.fn(() => 'apple')
}))
jest.mock('../utils/mobileAppLaunch', () => ({ launchMobileApp: jest.fn() }))

const mockedSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>
const mockedUserAgent = useAdvancedUserAgentData as jest.MockedFunction<typeof useAdvancedUserAgentData>
const mockedLaunch = launchDesktopApp as jest.MockedFunction<typeof launchDesktopApp>
const mockedBuildMobileDeepLink = buildMobileDeepLink as jest.MockedFunction<typeof buildMobileDeepLink>
const mockedDetectOS = detectDownloadOS as jest.MockedFunction<typeof detectDownloadOS>
const mockedLaunchMobileApp = launchMobileApp as jest.MockedFunction<typeof launchMobileApp>

describe('useExplorerLauncher', () => {
  let originalOpen: typeof window.open

  beforeEach(() => {
    mockedSearchParams.mockReturnValue([new URLSearchParams(''), jest.fn()])
    mockedUserAgent.mockReturnValue([false, { mobile: false, os: { name: 'macOS' }, cpu: { architecture: 'arm64' } }] as never)
    mockedBuildMobileDeepLink.mockReturnValue('decentraland://open?position=1%2C2')
    mockedDetectOS.mockReturnValue('apple')
    mockedLaunchMobileApp.mockResolvedValue(true)
    originalOpen = window.open
    window.open = jest.fn()
  })

  afterEach(() => {
    window.open = originalOpen
    jest.resetAllMocks()
  })

  describe('on desktop', () => {
    it('should resolve "launched" and pass the deep link when the client opens', async () => {
      mockedLaunch.mockResolvedValue(true)
      const { result } = renderHook(() => useExplorerLauncher())

      let outcome: string | undefined
      await act(async () => {
        outcome = await result.current.launch({ position: '-3,-2' })
      })

      expect(outcome).toBe('launched')
      expect(mockedLaunch).toHaveBeenCalledWith(expect.objectContaining({ position: '-3,-2' }))
      expect(window.open).not.toHaveBeenCalled()
    })

    it('should resolve "not-installed" when the client does not open', async () => {
      mockedLaunch.mockResolvedValue(false)
      const { result } = renderHook(() => useExplorerLauncher())

      let outcome: string | undefined
      await act(async () => {
        outcome = await result.current.launch({ realm: 'aliceworld' })
      })

      expect(outcome).toBe('not-installed')
    })

    it('should resolve "launch-error" when launchDesktopApp rejects', async () => {
      mockedLaunch.mockRejectedValue(new Error('blocked'))
      const { result } = renderHook(() => useExplorerLauncher())

      let outcome: string | undefined
      await act(async () => {
        outcome = await result.current.launch({ position: '1,2' })
      })

      expect(outcome).toBe('launch-error')
    })

    it('should thread the ?env deep-link param into the launch', async () => {
      mockedSearchParams.mockReturnValue([new URLSearchParams('env=stg'), jest.fn()])
      mockedLaunch.mockResolvedValue(true)
      const { result } = renderHook(() => useExplorerLauncher())

      await act(async () => {
        await result.current.launch({ position: '1,2' })
      })

      expect(mockedLaunch).toHaveBeenCalledWith(expect.objectContaining({ dclenv: 'today' }))
    })

    it('should thread the ?multi-instance deep-link param into the launch', async () => {
      mockedSearchParams.mockReturnValue([new URLSearchParams('multi-instance=true'), jest.fn()])
      mockedLaunch.mockResolvedValue(true)
      const { result } = renderHook(() => useExplorerLauncher())

      await act(async () => {
        await result.current.launch({ position: '1,2' })
      })

      expect(mockedLaunch).toHaveBeenCalledWith(expect.objectContaining({ multiInstance: 'true' }))
    })

    it('should thread the ?scene-console deep-link param into the launch', async () => {
      mockedSearchParams.mockReturnValue([new URLSearchParams('scene-console=true'), jest.fn()])
      mockedLaunch.mockResolvedValue(true)
      const { result } = renderHook(() => useExplorerLauncher())

      await act(async () => {
        await result.current.launch({ position: '1,2' })
      })

      expect(mockedLaunch).toHaveBeenCalledWith(expect.objectContaining({ sceneConsole: 'true' }))
    })

    it('should not enable multi-instance when the param says false', async () => {
      mockedSearchParams.mockReturnValue([new URLSearchParams('multi-instance=false'), jest.fn()])
      mockedLaunch.mockResolvedValue(true)
      const { result } = renderHook(() => useExplorerLauncher())

      await act(async () => {
        await result.current.launch({ position: '1,2' })
      })

      expect(mockedLaunch).toHaveBeenCalledWith(expect.not.objectContaining({ multiInstance: expect.anything() }))
    })
  })

  describe('on mobile', () => {
    beforeEach(() => {
      mockedUserAgent.mockReturnValue([false, { mobile: true }] as never)
      mockedDetectOS.mockReturnValue('ios')
    })

    it('should fire the protocol deep link with the jump target and never launch the desktop client', async () => {
      const { result } = renderHook(() => useExplorerLauncher())

      let outcome: string | undefined
      await act(async () => {
        outcome = await result.current.launch({ position: '1,2', realm: 'myworld.dcl.eth' })
      })

      expect(outcome).toBe('mobile-launched')
      expect(mockedBuildMobileDeepLink).toHaveBeenCalledWith({ position: '1,2', realm: 'myworld.dcl.eth', dclenv: undefined })
      expect(mockedLaunchMobileApp).toHaveBeenCalledWith({
        deepLink: 'decentraland://open?position=1%2C2',
        storeUrl: 'https://appstore',
        isAndroid: false
      })
      expect(window.open).not.toHaveBeenCalled()
      expect(mockedLaunch).not.toHaveBeenCalled()
    })

    it('should send an android device to google play when the protocol does not take', async () => {
      mockedDetectOS.mockReturnValue('android')
      mockedLaunchMobileApp.mockResolvedValue(false)
      const { result } = renderHook(() => useExplorerLauncher())

      let outcome: string | undefined
      await act(async () => {
        outcome = await result.current.launch({ position: '1,2' })
      })

      expect(outcome).toBe('mobile-store')
      expect(mockedLaunchMobileApp).toHaveBeenCalledWith(expect.objectContaining({ storeUrl: 'https://gplay', isAndroid: true }))
      expect(window.open).toHaveBeenCalledWith('https://gplay', '_self')
    })

    it('should send an ios device to the app store when the protocol does not take', async () => {
      mockedLaunchMobileApp.mockResolvedValue(false)
      const { result } = renderHook(() => useExplorerLauncher())

      await act(async () => {
        await result.current.launch({ position: '1,2' })
      })

      expect(window.open).toHaveBeenCalledWith('https://appstore', '_self')
    })

    it('should thread the ?env deep-link param into the protocol url', async () => {
      mockedSearchParams.mockReturnValue([new URLSearchParams('env=dev'), jest.fn()])
      const { result } = renderHook(() => useExplorerLauncher())

      await act(async () => {
        await result.current.launch({ position: '1,2' })
      })

      expect(mockedBuildMobileDeepLink).toHaveBeenCalledWith({ position: '1,2', realm: undefined, dclenv: 'zone' })
    })
  })

  it('should expose the resolved os/arch/mobile flags for callers to track', () => {
    const { result } = renderHook(() => useExplorerLauncher())

    expect(result.current).toMatchObject({ isMobile: false, osName: 'macOS', arch: 'arm64' })
  })
})

describe('shouldPromptDownload', () => {
  it('should be true only when the launch did not take', () => {
    expect(shouldPromptDownload('not-installed')).toBe(true)
    expect(shouldPromptDownload('launch-error')).toBe(true)
    expect(shouldPromptDownload('launched')).toBe(false)
    expect(shouldPromptDownload('mobile-launched')).toBe(false)
    expect(shouldPromptDownload('mobile-store')).toBe(false)
  })
})

describe('isClientNotInstalled', () => {
  it('should be true only for the explicit not-installed outcome, not a rejection', () => {
    expect(isClientNotInstalled('not-installed')).toBe(true)
    expect(isClientNotInstalled('launch-error')).toBe(false)
    expect(isClientNotInstalled('launched')).toBe(false)
    expect(isClientNotInstalled('mobile-launched')).toBe(false)
    expect(isClientNotInstalled('mobile-store')).toBe(false)
  })
})
