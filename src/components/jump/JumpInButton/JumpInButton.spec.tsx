import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAdvancedUserAgentData, useAnalytics } from '@dcl/hooks'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { detectDownloadOS } from '../../../modules/downloadConstants'
import { JumpInButton } from './JumpInButton'

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

jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: jest.fn()
}))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))
jest.mock('../../../config/env', () => ({
  getEnv: (key: string) => (key === 'DOWNLOAD_URL' ? 'https://dl.test' : 'https://onboarding.test')
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
jest.mock('../../../features/jump/jump.helpers', () => ({
  buildDeepLinkOptions: (position: string, realm?: string) => ({ position, realm })
}))

const mockUseAuthIdentity = jest.mocked(useAuthIdentity)
const mockUseAdvancedUserAgentData = jest.mocked(useAdvancedUserAgentData)
const mockUseAnalytics = jest.mocked(useAnalytics)
const mockDetectDownloadOS = jest.mocked(detectDownloadOS)

describe('JumpInButton', () => {
  beforeEach(() => {
    mockUseAnalytics.mockReturnValue({ track: jest.fn() } as unknown as ReturnType<typeof useAnalytics>)
    mockUseAuthIdentity.mockReturnValue({ identity: undefined, hasValidIdentity: false, address: undefined })
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
})
