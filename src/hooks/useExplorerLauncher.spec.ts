import { useSearchParams } from 'react-router-dom'
import { act, renderHook } from '@testing-library/react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { isClientNotInstalled, shouldPromptDownload, useExplorerLauncher } from './useExplorerLauncher'

jest.mock('react-router-dom', () => ({ useSearchParams: jest.fn() }))
jest.mock('@dcl/hooks', () => ({ useAdvancedUserAgentData: jest.fn() }))
jest.mock('decentraland-ui2', () => ({ launchDesktopApp: jest.fn() }))
jest.mock('../config/dclenv', () => ({ mapEnvToDclenv: (v: string | null) => v ?? undefined }))
jest.mock('../features/places/places.helpers', () => ({
  buildDeepLinkOptions: (position?: string, realm?: string, env?: string) => ({
    ...(position ? { position } : {}),
    ...(realm ? { realm } : {}),
    ...(env ? { dclenv: env } : {})
  })
}))

const mockedSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>
const mockedUserAgent = useAdvancedUserAgentData as jest.MockedFunction<typeof useAdvancedUserAgentData>
const mockedLaunch = launchDesktopApp as jest.MockedFunction<typeof launchDesktopApp>

describe('useExplorerLauncher', () => {
  let originalOpen: typeof window.open

  beforeEach(() => {
    mockedSearchParams.mockReturnValue([new URLSearchParams(''), jest.fn()])
    mockedUserAgent.mockReturnValue([false, { mobile: false, os: { name: 'macOS' }, cpu: { architecture: 'arm64' } }] as never)
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

      expect(mockedLaunch).toHaveBeenCalledWith(expect.objectContaining({ dclenv: 'stg' }))
    })
  })

  describe('on mobile', () => {
    it('should open the universal-link handler with the position and never launch the desktop client', async () => {
      mockedUserAgent.mockReturnValue([false, { mobile: true }] as never)
      const { result } = renderHook(() => useExplorerLauncher())

      let outcome: string | undefined
      await act(async () => {
        outcome = await result.current.launch({ position: '1,2' })
      })

      expect(outcome).toBe('mobile-deep-link')
      expect(window.open).toHaveBeenCalledWith('https://mobile.dclexplorer.com/open?position=1%2C2', '_self')
      expect(mockedLaunch).not.toHaveBeenCalled()
    })

    it('should carry the realm into the universal link for world jumps', async () => {
      mockedUserAgent.mockReturnValue([false, { mobile: true }] as never)
      const { result } = renderHook(() => useExplorerLauncher())

      await act(async () => {
        await result.current.launch({ realm: 'aliceworld' })
      })

      expect(window.open).toHaveBeenCalledWith('https://mobile.dclexplorer.com/open?realm=aliceworld', '_self')
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
    expect(shouldPromptDownload('mobile-deep-link')).toBe(false)
  })
})

describe('isClientNotInstalled', () => {
  it('should be true only for the explicit not-installed outcome, not a rejection', () => {
    expect(isClientNotInstalled('not-installed')).toBe(true)
    expect(isClientNotInstalled('launch-error')).toBe(false)
    expect(isClientNotInstalled('launched')).toBe(false)
    expect(isClientNotInstalled('mobile-deep-link')).toBe(false)
  })
})
