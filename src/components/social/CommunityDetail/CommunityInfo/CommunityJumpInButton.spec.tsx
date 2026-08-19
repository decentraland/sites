import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { getEnv } from '../../../../config/env'
import { useAuthIdentity } from '../../../../hooks/useAuthIdentity'
import { useDeepLinkQueryParams } from '../../../../hooks/useDeepLinkQueryParams'
import { CommunityJumpInButton } from './CommunityJumpInButton'

jest.mock('@dcl/hooks', () => ({ useAdvancedUserAgentData: jest.fn() }))

jest.mock('decentraland-ui2', () => {
  const Button = ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  )
  return {
    Button,
    DownloadModal: ({ open, onClose }: { open: boolean; onClose?: () => void }) =>
      open ? (
        <div data-testid="download-modal">
          <button onClick={onClose}>close-modal</button>
        </div>
      ) : null,
    JumpInIcon: () => <span data-testid="jump-in-icon" />,
    launchDesktopApp: jest.fn(),
    styled: (tag: unknown) => () => tag
  }
})

jest.mock('../../../../config/env', () => ({ getEnv: jest.fn() }))
jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (id: string) => id }))
jest.mock('../../../../hooks/useAuthIdentity', () => ({ useAuthIdentity: jest.fn() }))
jest.mock('../../../../hooks/useDeepLinkQueryParams', () => ({ useDeepLinkQueryParams: jest.fn(() => ({})) }))
jest.mock('../../../../modules/downloadConstants', () => ({
  DOWNLOAD_URLS: {
    apple: 'https://dl.test/apple',
    windows: 'https://dl.test/windows',
    epic: 'https://epic',
    googlePlay: 'https://google-play',
    appStore: 'https://app-store'
  },
  detectDownloadOS: jest.fn(() => 'apple')
}))

const mockedUserAgent = useAdvancedUserAgentData as jest.MockedFunction<typeof useAdvancedUserAgentData>
const mockedLaunch = launchDesktopApp as jest.MockedFunction<typeof launchDesktopApp>
const mockedGetEnv = getEnv as jest.MockedFunction<typeof getEnv>
const mockedAuthIdentity = useAuthIdentity as jest.MockedFunction<typeof useAuthIdentity>
const mockedDeepLinkQueryParams = useDeepLinkQueryParams as jest.MockedFunction<typeof useDeepLinkQueryParams>

const COMMUNITY_ID = 'community-1'

const clickJumpIn = () => userEvent.click(screen.getByText('community.info.jump_in'))

describe('CommunityJumpInButton', () => {
  let originalOpen: typeof window.open

  beforeEach(() => {
    mockedUserAgent.mockReturnValue([false, { mobile: false }] as never)
    mockedAuthIdentity.mockReturnValue({ hasValidIdentity: false } as unknown as ReturnType<typeof useAuthIdentity>)
    mockedDeepLinkQueryParams.mockReturnValue({})
    mockedGetEnv.mockReturnValue(undefined)
    originalOpen = window.open
    window.open = jest.fn()
  })

  afterEach(() => {
    window.open = originalOpen
    jest.resetAllMocks()
  })

  describe('when clicked on desktop', () => {
    it('should launch the desktop app with the community id', async () => {
      mockedLaunch.mockResolvedValue(true)
      render(<CommunityJumpInButton communityId={COMMUNITY_ID} />)

      await clickJumpIn()

      expect(mockedLaunch).toHaveBeenCalledWith(expect.objectContaining({ communityId: COMMUNITY_ID, multiInstance: undefined }))
    })

    it('should forward the deep-link query params alongside the community id', async () => {
      mockedDeepLinkQueryParams.mockReturnValue({ dclenv: 'zone', sceneConsole: 'true', multiInstance: 'true' })
      mockedLaunch.mockResolvedValue(true)
      render(<CommunityJumpInButton communityId={COMMUNITY_ID} />)

      await clickJumpIn()

      expect(mockedLaunch).toHaveBeenCalledWith({
        communityId: COMMUNITY_ID,
        dclenv: 'zone',
        sceneConsole: 'true',
        multiInstance: 'true'
      })
    })

    it('should report the jump-in to the tracking callback', async () => {
      const onTrack = jest.fn()
      mockedLaunch.mockResolvedValue(true)
      render(<CommunityJumpInButton communityId={COMMUNITY_ID} onTrack={onTrack} />)

      await clickJumpIn()

      expect(onTrack).toHaveBeenCalledWith({ type: 'JUMP_IN' })
    })
  })

  describe('when the launch does not take', () => {
    beforeEach(() => {
      mockedLaunch.mockResolvedValue(false)
    })

    it('should send a signed-in user straight to the download url', async () => {
      mockedAuthIdentity.mockReturnValue({ hasValidIdentity: true } as unknown as ReturnType<typeof useAuthIdentity>)
      mockedGetEnv.mockImplementation(key => (key === 'DOWNLOAD_URL' ? 'https://dl.test/zone' : undefined))
      render(<CommunityJumpInButton communityId={COMMUNITY_ID} />)

      await clickJumpIn()

      expect(window.open).toHaveBeenCalledWith('https://dl.test/zone', '_self')
    })

    it('should send an anonymous user to onboarding when it is configured', async () => {
      mockedGetEnv.mockImplementation(key => (key === 'ONBOARDING_URL' ? 'https://onboarding.test' : undefined))
      render(<CommunityJumpInButton communityId={COMMUNITY_ID} />)

      await clickJumpIn()

      expect(window.open).toHaveBeenCalledWith('https://onboarding.test', '_self')
    })

    it('should fall back to the download modal without an onboarding url', async () => {
      render(<CommunityJumpInButton communityId={COMMUNITY_ID} />)

      await clickJumpIn()

      expect(await screen.findByTestId('download-modal')).toBeInTheDocument()
    })

    it('should dismiss the download modal again', async () => {
      render(<CommunityJumpInButton communityId={COMMUNITY_ID} />)

      await clickJumpIn()
      await userEvent.click(await screen.findByText('close-modal'))

      expect(screen.queryByTestId('download-modal')).not.toBeInTheDocument()
    })
  })

  describe('when the launch throws', () => {
    it('should still surface the download fallback', async () => {
      mockedLaunch.mockRejectedValue(new Error('blocked'))
      render(<CommunityJumpInButton communityId={COMMUNITY_ID} />)

      await clickJumpIn()

      expect(await screen.findByTestId('download-modal')).toBeInTheDocument()
    })
  })

  describe('when clicked on a mobile device', () => {
    beforeEach(() => {
      mockedUserAgent.mockReturnValue([false, { mobile: true }] as never)
    })

    it('should send the user to the store instead of launching', async () => {
      render(<CommunityJumpInButton communityId={COMMUNITY_ID} />)

      await clickJumpIn()

      expect(window.open).toHaveBeenCalledWith('https://app-store', '_self')
      expect(mockedLaunch).not.toHaveBeenCalled()
    })
  })
})
