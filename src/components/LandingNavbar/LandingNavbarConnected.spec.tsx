import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePageNotifications } from '../../features/notifications/usePageNotifications'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { useLocale } from '../../intl/LocaleContext'
import { redirectToAuth } from '../../utils/authRedirect'
import { LandingNavbarConnected } from './LandingNavbarConnected'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockNavbarProps = jest.fn<void, [any]>()

jest.mock('./LandingNavbar', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LandingNavbar: (props: any) => {
    mockNavbarProps(props)
    return (
      <nav data-testid="navbar">
        <span data-testid="is-signed-in">{String(props.isSignedIn)}</span>
        <span data-testid="is-landing">{String(props.isLandingPage)}</span>
        <span data-testid="avatar-name">{props.avatar?.name ?? ''}</span>
        <button onClick={props.onClickSignIn}>signin</button>
        <button onClick={props.onClickSignOut}>signout</button>
      </nav>
    )
  }
}))

jest.mock('decentraland-ui2', () => ({
  DownloadModal: ({ open }: { open: boolean }) => (open ? <div data-testid="download-modal" /> : null)
}))

jest.mock('../../intl/LocaleContext', () => ({ useLocale: jest.fn(() => ({ locale: 'en' })) }))
jest.mock('../../hooks/useWalletAddress', () => ({ useWalletAddress: jest.fn() }))
jest.mock('../../features/profile/profile.client', () => ({ useGetProfileQuery: jest.fn() }))
jest.mock('../../hooks/useManaBalances', () => ({
  useManaBalances: jest.fn(() => ({ balances: undefined, isLoading: false, fetchBalances: jest.fn(), minDisplayBalance: 0 }))
}))
jest.mock('../../hooks/useAuthIdentity', () => ({ useAuthIdentity: jest.fn(() => ({ identity: undefined })) }))
jest.mock('../../features/notifications/usePageNotifications', () => ({ usePageNotifications: jest.fn(() => ({ notificationProps: {} })) }))
jest.mock('../../hooks/useHangOutAction', () => ({
  useHangOutAction: jest.fn(() => ({
    handleClick: jest.fn(),
    isDownloadModalOpen: false,
    closeDownloadModal: jest.fn(),
    downloadModalProps: {}
  }))
}))
jest.mock('../../utils/authRedirect', () => ({ redirectToAuth: jest.fn() }))

const mockUseLocale = jest.mocked(useLocale)
const mockUseWalletAddress = jest.mocked(useWalletAddress)
const mockUseGetProfileQuery = jest.mocked(useGetProfileQuery)
const mockUsePageNotifications = jest.mocked(usePageNotifications)
const mockRedirectToAuth = jest.mocked(redirectToAuth)
const mockDisconnect = jest.fn()

const setWallet = (address: string | null) =>
  mockUseWalletAddress.mockReturnValue({ address, isConnected: address !== null, disconnect: mockDisconnect })

describe('LandingNavbarConnected', () => {
  beforeEach(() => {
    mockUseLocale.mockReturnValue({ locale: 'en' } as unknown as ReturnType<typeof useLocale>)
    setWallet(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseGetProfileQuery.mockReturnValue({ data: undefined, isLoading: false } as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when there is no connected wallet', () => {
    it('should render the navbar in the signed-out state', () => {
      render(<LandingNavbarConnected />)
      expect(screen.getByTestId('is-signed-in')).toHaveTextContent('false')
    })

    it('should default isLandingPage to false', () => {
      render(<LandingNavbarConnected />)
      expect(screen.getByTestId('is-landing')).toHaveTextContent('false')
    })

    it('should redirect to auth when sign in is triggered', async () => {
      render(<LandingNavbarConnected />)
      await userEvent.click(screen.getByText('signin'))
      expect(mockRedirectToAuth).toHaveBeenCalledTimes(1)
    })
  })

  describe('when a wallet is connected', () => {
    beforeEach(() => {
      setWallet('0xabc')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseGetProfileQuery.mockReturnValue({ data: { avatars: [{ name: 'Tesla' }] }, isLoading: false } as any)
    })

    it('should render the navbar in the signed-in state with the avatar', () => {
      render(<LandingNavbarConnected isLandingPage />)
      expect(screen.getByTestId('is-signed-in')).toHaveTextContent('true')
      expect(screen.getByTestId('is-landing')).toHaveTextContent('true')
      expect(screen.getByTestId('avatar-name')).toHaveTextContent('Tesla')
    })

    it('should disconnect when sign out is triggered', async () => {
      render(<LandingNavbarConnected />)
      await userEvent.click(screen.getByText('signout'))
      expect(mockDisconnect).toHaveBeenCalledTimes(1)
    })
  })

  describe.each([
    ['es', 'es'],
    ['zh', 'zh'],
    ['ja', 'en'],
    ['fr', 'en']
  ])('when the locale is %s', (locale, expected) => {
    it(`should pass notification locale "${expected}"`, () => {
      mockUseLocale.mockReturnValue({ locale } as unknown as ReturnType<typeof useLocale>)
      render(<LandingNavbarConnected />)
      expect(mockUsePageNotifications).toHaveBeenCalledWith(expect.objectContaining({ locale: expected }))
    })
  })
})
