import { render, screen } from '@testing-library/react'
import { useAdvancedUserAgentData, useAnalytics } from '@dcl/hooks'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
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
  detectDownloadOS: () => 'apple'
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
})
