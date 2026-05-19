import { useSearchParams } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { getEnv } from '../../../../config/env'
import { useAuthIdentity } from '../../../../hooks/useAuthIdentity'
import { detectDownloadOS } from '../../../../modules/downloadConstants'
import { CommunityJumpInButton } from './CommunityJumpInButton'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn()
}))

jest.mock('@dcl/hooks', () => ({
  useAdvancedUserAgentData: jest.fn()
}))

jest.mock('decentraland-ui2', () => {
  const Button = ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  )
  return {
    Button,
    DownloadModal: ({ open }: { open: boolean }) => (open ? <div data-testid="download-modal" /> : null),
    JumpInIcon: () => <span data-testid="jump-in-icon" />,
    launchDesktopApp: jest.fn(),
    styled: (tag: unknown) => () => tag
  }
})

jest.mock('../../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: jest.fn()
}))
jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))
jest.mock('../../../../config/env', () => ({
  getEnv: jest.fn(),
  getCurrentEnv: jest.fn()
}))
jest.mock('../../../../modules/downloadConstants', () => ({
  DOWNLOAD_URLS: {
    apple: 'https://dl.test',
    windows: 'https://dl.test',
    epic: 'https://epic',
    googlePlay: 'https://google',
    appStore: 'https://apple'
  },
  detectDownloadOS: jest.fn(() => 'apple')
}))

const mockUseSearchParams = jest.mocked(useSearchParams)
const mockUseAuthIdentity = jest.mocked(useAuthIdentity)
const mockUseAdvancedUserAgentData = jest.mocked(useAdvancedUserAgentData)
const mockDetectDownloadOS = jest.mocked(detectDownloadOS)
const mockLaunchDesktopApp = jest.mocked(launchDesktopApp)
const mockGetEnv = jest.mocked(getEnv)

describe('CommunityJumpInButton', () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams(''), jest.fn()] as unknown as ReturnType<typeof useSearchParams>)
    mockUseAuthIdentity.mockReturnValue({ identity: undefined, hasValidIdentity: false, address: undefined })
    mockUseAdvancedUserAgentData.mockReturnValue([
      true,
      { os: { name: 'macOS' }, cpu: { architecture: 'arm64' }, mobile: false }
    ] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
    mockGetEnv.mockImplementation((key: string) =>
      key === 'DOWNLOAD_URL' ? 'https://dl.test' : key === 'ONBOARDING_URL' ? 'https://onboarding.test' : undefined
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when it is clicked on desktop', () => {
    beforeEach(() => {
      mockLaunchDesktopApp.mockResolvedValue(true)
    })

    it('should call launchDesktopApp with the communityId', async () => {
      render(<CommunityJumpInButton communityId="c1" />)
      await userEvent.click(screen.getByRole('button'))
      expect(mockLaunchDesktopApp).toHaveBeenCalledWith(expect.objectContaining({ communityId: 'c1' }))
    })

    it('should fire onTrack with type JUMP_IN', async () => {
      const onTrack = jest.fn()
      render(<CommunityJumpInButton communityId="c1" onTrack={onTrack} />)
      await userEvent.click(screen.getByRole('button'))
      expect(onTrack).toHaveBeenCalledWith({ type: 'JUMP_IN' })
    })
  })

  describe('when the URL contains dclenv', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('dclenv=zone'), jest.fn()] as unknown as ReturnType<typeof useSearchParams>)
      mockLaunchDesktopApp.mockResolvedValue(true)
    })

    it('should forward dclenv to launchDesktopApp', async () => {
      render(<CommunityJumpInButton communityId="c1" />)
      await userEvent.click(screen.getByRole('button'))
      expect(mockLaunchDesktopApp).toHaveBeenCalledWith(expect.objectContaining({ communityId: 'c1', dclenv: 'zone' }))
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
      render(<CommunityJumpInButton communityId="c1" />)
      await userEvent.click(screen.getByRole('button'))
      expect(mockLaunchDesktopApp).toHaveBeenCalledWith(expect.objectContaining({ dclenv: 'zone' }))
    })
  })

  describe('when running on a mobile device', () => {
    const windowOpenMock = jest.fn()

    beforeEach(() => {
      mockUseAdvancedUserAgentData.mockReturnValue([
        true,
        { os: { name: 'iOS' }, cpu: { architecture: 'arm64' }, mobile: true }
      ] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
      mockDetectDownloadOS.mockReturnValue('android')
      Object.defineProperty(window, 'open', { configurable: true, value: windowOpenMock })
    })

    afterEach(() => {
      windowOpenMock.mockReset()
    })

    it('should redirect to the store and skip launchDesktopApp', async () => {
      render(<CommunityJumpInButton communityId="c1" />)
      await userEvent.click(screen.getByRole('button'))
      expect(windowOpenMock).toHaveBeenCalledWith('https://google', '_self')
      expect(mockLaunchDesktopApp).not.toHaveBeenCalled()
    })
  })

  describe('when launchDesktopApp returns false (no launcher installed)', () => {
    const windowOpenMock = jest.fn()

    beforeEach(() => {
      Object.defineProperty(window, 'open', { configurable: true, value: windowOpenMock })
      mockLaunchDesktopApp.mockResolvedValue(false)
    })

    afterEach(() => {
      windowOpenMock.mockReset()
    })

    it('should fall back to the onboarding URL when the user is anonymous', async () => {
      render(<CommunityJumpInButton communityId="c1" />)
      await userEvent.click(screen.getByRole('button'))
      expect(windowOpenMock).toHaveBeenCalledWith('https://onboarding.test', '_self')
    })

    it('should fall back to the download URL when the user has a valid identity', async () => {
      mockUseAuthIdentity.mockReturnValue({ identity: undefined, hasValidIdentity: true, address: '0xabc' })
      render(<CommunityJumpInButton communityId="c1" />)
      await userEvent.click(screen.getByRole('button'))
      expect(windowOpenMock).toHaveBeenCalledWith('https://dl.test', '_self')
    })

    it('should open the download modal when no ONBOARDING_URL is configured', async () => {
      mockGetEnv.mockImplementation((key: string) => (key === 'DOWNLOAD_URL' ? 'https://dl.test' : undefined))
      render(<CommunityJumpInButton communityId="c1" />)
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByTestId('download-modal')).toBeInTheDocument()
    })
  })

  describe('when launchDesktopApp throws', () => {
    const windowOpenMock = jest.fn()

    beforeEach(() => {
      Object.defineProperty(window, 'open', { configurable: true, value: windowOpenMock })
      mockLaunchDesktopApp.mockRejectedValue(new Error('protocol blocked'))
    })

    afterEach(() => {
      windowOpenMock.mockReset()
    })

    it('should fall through to the download fallback', async () => {
      render(<CommunityJumpInButton communityId="c1" />)
      await userEvent.click(screen.getByRole('button'))
      expect(windowOpenMock).toHaveBeenCalledWith('https://onboarding.test', '_self')
    })
  })
})
