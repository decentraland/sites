import { useSearchParams } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAdvancedUserAgentData, useAnalytics } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { detectDownloadOS } from '../../../modules/downloadConstants'
import { buildTrackedDownloadUrl } from '../../../modules/url'
import { JumpInButton } from './JumpInButton'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn()
}))

jest.mock('@dcl/hooks', () => ({
  useAdvancedUserAgentData: jest.fn(),
  useAnalytics: jest.fn()
}))

jest.mock('decentraland-ui2', () => {
  const Button = ({
    children,
    onClick,
    'aria-label': ariaLabel
  }: {
    children?: React.ReactNode
    onClick?: () => void
    'aria-label'?: string
  }) => (
    <button onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  )
  return {
    Button,
    IconButton: Button,
    DownloadModal: ({ open }: { open: boolean }) => (open ? <div data-testid="download-modal" /> : null),
    JumpInIcon: () => <span data-testid="jump-in-icon" />,
    launchDesktopApp: jest.fn(),
    styled: (tag: unknown) => () => tag
  }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))
jest.mock('../../../modules/downloadConstants', () => ({
  DOWNLOAD_URLS: {
    apple: 'https://dl.test',
    windows: 'https://dl.test',
    epic: 'https://epic',
    googlePlay: 'https://google',
    appStore: 'https://apple'
  },
  detectDownloadOS: jest.fn(() => 'apple')
}))
jest.mock('../../../modules/segment', () => ({
  SegmentEvent: { GO_TO_EXPLORER: 'Go To Explorer', CLICK: 'Click' }
}))
jest.mock('../../../features/places/places.helpers', () => ({
  DEFAULT_POSITION: '0,0',
  DEFAULT_REALM: 'main',
  // Mirrors the real helper's default-filtering so the hook's deep-link
  // params stay empty on default position/realm (like production).
  buildDeepLinkOptions: (input: { position?: string; realm?: string; env?: string } = {}) => ({
    ...(input.realm && input.realm !== 'main' ? { realm: input.realm } : {}),
    ...(input.position && input.position !== '0,0' ? { position: input.position } : {}),
    ...(input.env ? { dclenv: input.env } : {})
  })
}))
jest.mock('../../../modules/url', () => ({
  buildTrackedDownloadUrl: jest.fn()
}))
jest.mock('../../../config/env', () => ({ getEnv: jest.fn() }))
jest.mock('../../../hooks/useTotalDownloads', () => ({ useTotalDownloads: jest.fn(() => '+400K') }))

const mockBuildTrackedDownloadUrl = jest.mocked(buildTrackedDownloadUrl)
const mockUseSearchParams = jest.mocked(useSearchParams)
const mockUseAdvancedUserAgentData = jest.mocked(useAdvancedUserAgentData)
const mockUseAnalytics = jest.mocked(useAnalytics)
const mockDetectDownloadOS = jest.mocked(detectDownloadOS)
const mockLaunchDesktopApp = jest.mocked(launchDesktopApp)

describe('JumpInButton', () => {
  beforeEach(() => {
    mockBuildTrackedDownloadUrl.mockImplementation((base: string, params: Record<string, string | undefined | null>) => {
      const urlObj = new URL(base, window.location.origin)
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlObj.searchParams.append(key, value)
        }
      })
      return urlObj.toString()
    })
    mockUseSearchParams.mockReturnValue([new URLSearchParams(''), jest.fn()] as unknown as ReturnType<typeof useSearchParams>)
    mockUseAnalytics.mockReturnValue({ track: jest.fn() } as unknown as ReturnType<typeof useAnalytics>)
    mockUseAdvancedUserAgentData.mockReturnValue([
      true,
      { os: { name: 'macOS' }, cpu: { architecture: 'arm64' }, mobile: false }
    ] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when it is rendered with children', () => {
    it('should render the children as the button label', () => {
      render(<JumpInButton position="0,0">Jump</JumpInButton>)
      expect(screen.getByText('Jump')).toBeInTheDocument()
    })
  })

  describe('when it is rendered without children', () => {
    it('should fall back to the i18n label', () => {
      render(<JumpInButton position="0,0" />)
      expect(screen.getByText('component.jump.jump_in_button.jump_in')).toBeInTheDocument()
    })
  })

  describe('when the URL contains dclenv', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('dclenv=zone'), jest.fn()] as unknown as ReturnType<typeof useSearchParams>)
      mockLaunchDesktopApp.mockResolvedValue(true)
    })

    it('should forward dclenv to launchDesktopApp', async () => {
      render(<JumpInButton position="75,-9" realm="sdk7testscenes.dcl.eth" />)
      await userEvent.click(screen.getByRole('button'))
      expect(mockLaunchDesktopApp).toHaveBeenCalledWith(expect.objectContaining({ dclenv: 'zone' }))
    })
  })

  describe.each([
    ['dev', 'zone'],
    ['stg', 'today'],
    ['prd', 'org'],
    ['prod', 'org']
  ])('when the URL contains env=%s but no dclenv', (envValue, expectedDclenv) => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams(`env=${envValue}`), jest.fn()] as unknown as ReturnType<
        typeof useSearchParams
      >)
      mockLaunchDesktopApp.mockResolvedValue(true)
    })

    it(`should map env=${envValue} to dclenv=${expectedDclenv}`, async () => {
      render(<JumpInButton position="75,-9" realm="sdk7testscenes.dcl.eth" />)
      await userEvent.click(screen.getByRole('button'))
      expect(mockLaunchDesktopApp).toHaveBeenCalledWith(expect.objectContaining({ dclenv: expectedDclenv }))
    })
  })

  describe('when the URL contains an unknown env value and no dclenv', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('env=bogus'), jest.fn()] as unknown as ReturnType<typeof useSearchParams>)
      mockLaunchDesktopApp.mockResolvedValue(true)
    })

    it('should not include dclenv in launchDesktopApp options', async () => {
      render(<JumpInButton position="75,-9" realm="sdk7testscenes.dcl.eth" />)
      await userEvent.click(screen.getByRole('button'))
      expect(mockLaunchDesktopApp).toHaveBeenCalledWith(expect.not.objectContaining({ dclenv: expect.anything() }))
    })
  })

  describe('when the URL contains both dclenv and env', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('env=dev&dclenv=today'), jest.fn()] as unknown as ReturnType<
        typeof useSearchParams
      >)
      mockLaunchDesktopApp.mockResolvedValue(true)
    })

    it('should prefer dclenv over env', async () => {
      render(<JumpInButton position="75,-9" realm="sdk7testscenes.dcl.eth" />)
      await userEvent.click(screen.getByRole('button'))
      expect(mockLaunchDesktopApp).toHaveBeenCalledWith(expect.objectContaining({ dclenv: 'today' }))
    })
  })

  describe('when the URL contains neither dclenv nor env', () => {
    beforeEach(() => {
      mockLaunchDesktopApp.mockResolvedValue(true)
    })

    it('should not include dclenv in launchDesktopApp options', async () => {
      render(<JumpInButton position="75,-9" realm="sdk7testscenes.dcl.eth" />)
      await userEvent.click(screen.getByRole('button'))
      expect(mockLaunchDesktopApp).toHaveBeenCalledWith(expect.not.objectContaining({ dclenv: expect.anything() }))
    })
  })

  describe('when it is clicked on a mobile device', () => {
    const windowOpenMock = jest.fn()

    beforeEach(() => {
      mockUseAdvancedUserAgentData.mockReturnValue([
        true,
        { os: { name: 'iOS' }, cpu: { architecture: 'arm64' }, mobile: true }
      ] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
      Object.defineProperty(window, 'open', { configurable: true, value: windowOpenMock })
    })

    afterEach(() => {
      windowOpenMock.mockReset()
    })

    describe('and the device is iOS', () => {
      beforeEach(() => {
        mockDetectDownloadOS.mockReturnValue('ios')
      })

      it('should redirect to the Apple App Store', async () => {
        render(<JumpInButton position="0,0" />)
        await userEvent.click(screen.getByRole('button'))
        expect(windowOpenMock).toHaveBeenCalledWith('https://apple', '_self')
      })
    })

    describe('and the device is Android', () => {
      beforeEach(() => {
        mockDetectDownloadOS.mockReturnValue('android')
      })

      it('should redirect to Google Play', async () => {
        render(<JumpInButton position="0,0" />)
        await userEvent.click(screen.getByRole('button'))
        expect(windowOpenMock).toHaveBeenCalledWith('https://google', '_self')
      })
    })

    describe('and the device reports a desktop OS (e.g. iPadOS desktop-mode)', () => {
      beforeEach(() => {
        mockDetectDownloadOS.mockReturnValue('apple')
      })

      it('should redirect to the Apple App Store by default', async () => {
        render(<JumpInButton position="0,0" />)
        await userEvent.click(screen.getByRole('button'))
        expect(windowOpenMock).toHaveBeenCalledWith('https://apple', '_self')
      })
    })
  })

  describe('when running on desktop', () => {
    const windowOpenMock = jest.fn()

    beforeEach(() => {
      Object.defineProperty(window, 'open', { configurable: true, value: windowOpenMock })
      windowOpenMock.mockReset()
      mockLaunchDesktopApp.mockReset()
    })

    describe('and the launcher is already installed', () => {
      it('should not open any fallback', async () => {
        mockLaunchDesktopApp.mockResolvedValue(true)
        render(<JumpInButton position="0,0" />)
        await userEvent.click(screen.getByRole('button'))
        expect(windowOpenMock).not.toHaveBeenCalled()
      })
    })

    describe('and the launcher is missing', () => {
      it('should open the download modal without redirecting', async () => {
        mockLaunchDesktopApp.mockResolvedValue(false)
        render(<JumpInButton position="0,0" />)
        await userEvent.click(screen.getByRole('button'))
        expect(screen.getByTestId('download-modal')).toBeInTheDocument()
        expect(windowOpenMock).not.toHaveBeenCalled()
      })
    })

    describe('and launchDesktopApp throws', () => {
      it('should open the download modal', async () => {
        mockLaunchDesktopApp.mockRejectedValue(new Error('protocol blocked'))
        render(<JumpInButton position="0,0" />)
        await userEvent.click(screen.getByRole('button'))
        expect(screen.getByTestId('download-modal')).toBeInTheDocument()
      })
    })
  })

  describe('when rendered with onlyIcon', () => {
    it('should render the icon-only variant', async () => {
      render(<JumpInButton position="0,0" onlyIcon />)
      expect(screen.getByLabelText('component.jump.jump_in_button.jump_in')).toBeInTheDocument()
    })
  })
})
