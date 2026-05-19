import { MemoryRouter, useLocation } from 'react-router-dom'
import { act, render, renderHook, screen } from '@testing-library/react'
import { useAsyncMemo } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { detectDownloadOS } from '../modules/downloadConstants'
import { useHangOutAction } from './useHangOutAction'
import { useWalletAddress } from './useWalletAddress'

jest.mock('../config/env', () => ({
  getEnv: jest.fn(),
  getCurrentEnv: jest.fn()
}))

jest.mock('@dcl/hooks', () => ({
  useAsyncMemo: jest.fn(() => [null, { loading: false, loaded: false }])
}))

jest.mock('decentraland-ui2', () => ({
  launchDesktopApp: jest.fn()
}))

jest.mock('../modules/explorerDownloads', () => ({
  ExplorerDownloads: {
    get: () => ({ getTotalDownloads: jest.fn() })
  }
}))

jest.mock('../modules/downloadConstants', () => ({
  DOWNLOAD_URLS: {
    apple: 'https://dl.test/apple',
    windows: 'https://dl.test/windows',
    epic: 'https://epic',
    googlePlay: 'https://google',
    appStore: 'https://apple'
  },
  detectDownloadOS: jest.fn(() => 'apple')
}))

jest.mock('./useWalletAddress', () => ({
  useWalletAddress: jest.fn()
}))

const mockUseAsyncMemo = jest.mocked(useAsyncMemo)
const mockLaunchDesktopApp = jest.mocked(launchDesktopApp)
const mockDetectDownloadOS = jest.mocked(detectDownloadOS)
const mockUseWalletAddress = jest.mocked(useWalletAddress)

function wrapper(initialEntries: string[] = ['/']) {
  return ({ children }: { children: React.ReactNode }) => <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
}

describe('useHangOutAction', () => {
  beforeEach(() => {
    mockUseAsyncMemo.mockReturnValue([null, { loading: false, loaded: false }] as unknown as ReturnType<typeof useAsyncMemo>)
    mockUseWalletAddress.mockReturnValue({ isConnected: true } as never)
    mockDetectDownloadOS.mockReturnValue('apple')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the user is not connected', () => {
    beforeEach(() => {
      mockUseWalletAddress.mockReturnValue({ isConnected: false } as never)
    })

    it('should open the download modal without calling launchDesktopApp', async () => {
      const { result } = renderHook(useHangOutAction, { wrapper: wrapper() })
      await act(async () => {
        await result.current.handleClick({ preventDefault: jest.fn() } as unknown as React.MouseEvent)
      })
      expect(result.current.isDownloadModalOpen).toBe(true)
      expect(mockLaunchDesktopApp).not.toHaveBeenCalled()
    })
  })

  describe('when the user is connected and launchDesktopApp succeeds', () => {
    beforeEach(() => {
      mockLaunchDesktopApp.mockResolvedValue(true)
    })

    it('should not open the download modal', async () => {
      const { result } = renderHook(useHangOutAction, { wrapper: wrapper() })
      await act(async () => {
        await result.current.handleClick({ preventDefault: jest.fn() } as unknown as React.MouseEvent)
      })
      expect(result.current.isDownloadModalOpen).toBe(false)
    })
  })

  describe('when the URL contains ?dclenv=zone', () => {
    beforeEach(() => {
      mockLaunchDesktopApp.mockResolvedValue(true)
    })

    it('should forward dclenv to launchDesktopApp', async () => {
      const { result } = renderHook(useHangOutAction, { wrapper: wrapper(['/?dclenv=zone']) })
      await act(async () => {
        await result.current.handleClick({ preventDefault: jest.fn() } as unknown as React.MouseEvent)
      })
      expect(mockLaunchDesktopApp).toHaveBeenCalledWith(expect.objectContaining({ dclenv: 'zone' }))
    })
  })

  describe('when hosted on decentraland.zone with no query', () => {
    const originalLocation = window.location

    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...originalLocation, hostname: 'decentraland.zone' }
      })
      mockLaunchDesktopApp.mockResolvedValue(true)
    })

    afterEach(() => {
      Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    })

    it('should default dclenv to zone', async () => {
      const { result } = renderHook(useHangOutAction, { wrapper: wrapper() })
      await act(async () => {
        await result.current.handleClick({ preventDefault: jest.fn() } as unknown as React.MouseEvent)
      })
      expect(mockLaunchDesktopApp).toHaveBeenCalledWith(expect.objectContaining({ dclenv: 'zone' }))
    })
  })

  describe('when launchDesktopApp throws', () => {
    beforeEach(() => {
      mockLaunchDesktopApp.mockRejectedValue(new Error('protocol blocked'))
    })

    it('should open the download modal', async () => {
      const { result } = renderHook(useHangOutAction, { wrapper: wrapper() })
      await act(async () => {
        await result.current.handleClick({ preventDefault: jest.fn() } as unknown as React.MouseEvent)
      })
      expect(result.current.isDownloadModalOpen).toBe(true)
    })
  })

  describe('when launchDesktopApp returns false', () => {
    beforeEach(() => {
      mockLaunchDesktopApp.mockResolvedValue(false)
    })

    it('should open the download modal', async () => {
      const { result } = renderHook(useHangOutAction, { wrapper: wrapper() })
      await act(async () => {
        await result.current.handleClick({ preventDefault: jest.fn() } as unknown as React.MouseEvent)
      })
      expect(result.current.isDownloadModalOpen).toBe(true)
    })
  })

  describe('when closeDownloadModal is invoked', () => {
    beforeEach(() => {
      mockLaunchDesktopApp.mockResolvedValue(false)
    })

    it('should reset the modal flag to false', async () => {
      const { result } = renderHook(useHangOutAction, { wrapper: wrapper() })
      await act(async () => {
        await result.current.handleClick({ preventDefault: jest.fn() } as unknown as React.MouseEvent)
      })
      expect(result.current.isDownloadModalOpen).toBe(true)
      act(() => result.current.closeDownloadModal())
      expect(result.current.isDownloadModalOpen).toBe(false)
    })
  })

  describe('when running inside the router (smoke test)', () => {
    function Probe() {
      const { totalDownloads } = useHangOutAction()
      const location = useLocation()
      return (
        <div>
          <span data-testid="downloads">{totalDownloads}</span>
          <span data-testid="path">{location.pathname}</span>
        </div>
      )
    }

    it('should render without crashing under MemoryRouter', () => {
      render(
        <MemoryRouter initialEntries={['/?dclenv=zone']}>
          <Probe />
        </MemoryRouter>
      )
      expect(screen.getByTestId('downloads')).toBeInTheDocument()
      expect(screen.getByTestId('path')).toHaveTextContent('/')
    })
  })
})
