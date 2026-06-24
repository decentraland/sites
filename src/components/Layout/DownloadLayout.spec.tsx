import { useInView } from 'react-intersection-observer'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { redirectToAuth } from '../../utils/authRedirect'
import { DownloadLayout } from './DownloadLayout'

jest.mock('react-intersection-observer', () => ({ useInView: jest.fn() }))

jest.mock('@dcl/hooks', () => ({ useAdvancedUserAgentData: jest.fn(() => [false, undefined]) }))

jest.mock('decentraland-ui2', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { styled, Box, keyframes } = require('../../__test-utils__/styledMock')
  const passthrough = (tag: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ReactLib.forwardRef(({ children, ...rest }: any, ref: any) => ReactLib.createElement(tag, { ref, ...rest }, children))
  return {
    styled,
    keyframes,
    Box,
    Link: passthrough('a'),
    Logo: passthrough('span'),
    Typography: passthrough('p'),
    Button: passthrough('button'),
    dclColors: { base: { primary: '#ff2d55' }, neutral: { softWhite: '#fcfcfc' } },
    dclModal: { Modal: passthrough('div') },
    launchDesktopApp: jest.fn(),
    useDesktopMediaQuery: jest.fn(() => true)
  }
})

jest.mock('decentraland-ui2/dist/components/WearablePreview/WearablePreview', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  WearablePreview: (props: any) => <iframe title={props.title ?? ''} data-testid="wearable-preview" />
}))

jest.mock('../../config/env', () => ({ getEnv: jest.fn(() => 'https://wearable.example') }))

jest.mock('../../features/profile/profile.client', () => ({ useGetProfileQuery: jest.fn() }))

jest.mock('../../hooks/useWalletAddress', () => ({ useWalletAddress: jest.fn() }))

jest.mock('../../utils/authRedirect', () => ({ redirectToAuth: jest.fn() }))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage:
    () =>
    (id: string, values?: Record<string, unknown>): string =>
      values && 'name' in values ? `${id}|${values.name}` : id
}))

jest.mock('../DownloadOptions', () => ({ DownloadOptions: () => <div data-testid="download-options" /> }))
jest.mock('../LandingFooter', () => ({ LandingFooter: () => <div data-testid="footer" /> }))
jest.mock('../LandingNavbar', () => ({ LandingNavbarConnected: () => <nav data-testid="connected-navbar" /> }))
jest.mock('@mui/icons-material/CheckCircle', () => ({ __esModule: true, default: () => <span data-testid="check-icon" /> }))
jest.mock('@mui/icons-material/FileDownloadOutlined', () => ({ __esModule: true, default: () => <span /> }))

const mockUseInView = jest.mocked(useInView)
const mockUseAdvancedUserAgentData = jest.mocked(useAdvancedUserAgentData)
const mockUseWalletAddress = jest.mocked(useWalletAddress)
const mockUseGetProfileQuery = jest.mocked(useGetProfileQuery)
const mockLaunchDesktopApp = jest.mocked(launchDesktopApp)
const mockRedirectToAuth = jest.mocked(redirectToAuth)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockUseDesktopMediaQuery = require('decentraland-ui2').useDesktopMediaQuery as jest.Mock

const TITLE = 'Download Decentraland and Come Hang Out!'

const setWallet = (address: string | null) =>
  mockUseWalletAddress.mockReturnValue({ address, isConnected: address !== null, disconnect: jest.fn() })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setProfile = (data: any) => mockUseGetProfileQuery.mockReturnValue({ data } as any)

describe('DownloadLayout', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/download')
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false } as unknown as ReturnType<typeof useInView>)
    mockUseDesktopMediaQuery.mockReturnValue(true)
    mockUseAdvancedUserAgentData.mockReturnValue([false, undefined] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
    setWallet(null)
    setProfile(undefined)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the user is not signed in', () => {
    beforeEach(() => {
      setWallet(null)
      setProfile(undefined)
    })

    it('should render the Sign In button', () => {
      render(<DownloadLayout title={TITLE} />)
      expect(screen.getByText('component.landing.navbar.sign_in')).toBeInTheDocument()
    })

    it('should not render the "is ready" pre-title', () => {
      render(<DownloadLayout title={TITLE} />)
      expect(screen.queryByText(/page\.download\.pre_title/)).not.toBeInTheDocument()
    })

    it('should not render the wearable preview', () => {
      render(<DownloadLayout title={TITLE} />)
      expect(screen.queryByTestId('wearable-preview')).not.toBeInTheDocument()
    })

    it('should not render the homepage navbar', () => {
      render(<DownloadLayout title={TITLE} />)
      expect(screen.queryByTestId('connected-navbar')).not.toBeInTheDocument()
    })

    it('should redirect to auth when the Sign In button is clicked', async () => {
      render(<DownloadLayout title={TITLE} />)
      await userEvent.click(screen.getByText('component.landing.navbar.sign_in'))
      expect(mockRedirectToAuth).toHaveBeenCalledTimes(1)
    })

    it('should navigate to decentraland.org when the logo is clicked', async () => {
      const assignSpy = jest.fn()
      const original = window.location
      // Redefine location so the assignment in the click handler is observable
      // and does not trigger jsdom's "navigation not implemented" warning.
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
          ...original,
          set href(value: string) {
            assignSpy(value)
          },
          get href() {
            return original.href
          }
        }
      })
      try {
        render(<DownloadLayout title={TITLE} />)
        // DclLogo is the label-less clickable element rendered immediately before
        // the Sign In button in the signed-out chrome.
        const signIn = screen.getByText('component.landing.navbar.sign_in')
        const logo = signIn.previousElementSibling as HTMLElement
        expect(logo).not.toBeNull()
        await userEvent.click(logo)
        expect(assignSpy).toHaveBeenCalledWith('https://decentraland.org')
      } finally {
        Object.defineProperty(window, 'location', { configurable: true, value: original })
      }
    })
  })

  describe('when the user is signed in', () => {
    beforeEach(() => {
      setWallet('0xabc')
      setProfile({ avatars: [{ name: 'Tesla', ethAddress: '0xabc' }] })
    })

    it('should render the "is ready" pre-title with the profile name', () => {
      render(<DownloadLayout title={TITLE} />)
      expect(screen.getByText('page.download.pre_title|Tesla')).toBeInTheDocument()
    })

    it('should not render the minimal Sign In button', () => {
      render(<DownloadLayout title={TITLE} />)
      expect(screen.queryByText('component.landing.navbar.sign_in')).not.toBeInTheDocument()
    })

    it('should render the homepage navbar', () => {
      render(<DownloadLayout title={TITLE} />)
      expect(screen.getByTestId('connected-navbar')).toBeInTheDocument()
    })

    it('should fall back to the generic account label when the profile has no name', () => {
      setProfile({ avatars: [{ ethAddress: '0xabc' }] })
      render(<DownloadLayout title={TITLE} />)
      expect(screen.getByText('page.download.pre_title|page.download.your_account')).toBeInTheDocument()
    })

    it('should mount the wearable preview once it scrolls into view', async () => {
      mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true } as unknown as ReturnType<typeof useInView>)
      render(<DownloadLayout title={TITLE} />)
      await waitFor(() => expect(screen.getByTestId('wearable-preview')).toBeInTheDocument())
    })

    it('should set an accessible title on the preview iframe once it is present in the container', async () => {
      // The ref callback wires the container; once the WearablePreview iframe is
      // rendered the effect's `existing` branch runs and labels it for a11y.
      mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true } as unknown as ReturnType<typeof useInView>)
      render(<DownloadLayout title={TITLE} />)
      await waitFor(() => expect(screen.getByTestId('wearable-preview')).toHaveAttribute('title', 'page.download.avatar_preview'))
    })

    it('should label an iframe that the WearablePreview injects asynchronously via MutationObserver', async () => {
      // Render the preview wrapper but with NO iframe yet, then inject one into
      // the container after mount so the MutationObserver branch (not the
      // synchronous `existing` branch) sets the title.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const wpModule = require('decentraland-ui2/dist/components/WearablePreview/WearablePreview')
      const originalPreview = wpModule.WearablePreview
      // Replace the preview with an empty container so no iframe exists initially.
      wpModule.WearablePreview = () => <div data-testid="empty-preview" />
      try {
        mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true } as unknown as ReturnType<typeof useInView>)
        const { container } = render(<DownloadLayout title={TITLE} />)
        await waitFor(() => expect(screen.getByTestId('empty-preview')).toBeInTheDocument())

        const host = screen.getByTestId('empty-preview').parentElement as HTMLElement
        const injected = document.createElement('iframe')
        host.appendChild(injected)

        await waitFor(() => expect(injected).toHaveAttribute('title', 'page.download.avatar_preview'))
        expect(container).toBeTruthy()
      } finally {
        wpModule.WearablePreview = originalPreview
      }
    })

    it('should label an iframe nested inside an element the WearablePreview injects', async () => {
      // Same MutationObserver path, but the added node is a wrapper element that
      // contains the iframe rather than the iframe itself.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const wpModule = require('decentraland-ui2/dist/components/WearablePreview/WearablePreview')
      const originalPreview = wpModule.WearablePreview
      wpModule.WearablePreview = () => <div data-testid="empty-preview-nested" />
      try {
        mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true } as unknown as ReturnType<typeof useInView>)
        render(<DownloadLayout title={TITLE} />)
        await waitFor(() => expect(screen.getByTestId('empty-preview-nested')).toBeInTheDocument())

        const host = screen.getByTestId('empty-preview-nested').parentElement as HTMLElement
        const wrapper = document.createElement('div')
        const nestedIframe = document.createElement('iframe')
        wrapper.appendChild(nestedIframe)
        host.appendChild(wrapper)

        await waitFor(() => expect(nestedIframe).toHaveAttribute('title', 'page.download.avatar_preview'))
      } finally {
        wpModule.WearablePreview = originalPreview
      }
    })
  })

  describe('when the Jump In link is clicked', () => {
    beforeEach(() => {
      setWallet('0xabc')
      setProfile({ avatars: [{ name: 'Tesla', ethAddress: '0xabc' }] })
    })

    it('should attempt to launch the desktop app', async () => {
      mockLaunchDesktopApp.mockResolvedValue(true)
      render(<DownloadLayout title={TITLE} />)
      await userEvent.click(screen.getByText('page.download.jump_in'))
      await waitFor(() => expect(mockLaunchDesktopApp).toHaveBeenCalledWith({}))
    })

    it('should surface the fallback modal when the launcher is unavailable', async () => {
      mockLaunchDesktopApp.mockResolvedValue(false)
      render(<DownloadLayout title={TITLE} />)
      await userEvent.click(screen.getByText('page.download.jump_in'))
      await waitFor(() => expect(mockLaunchDesktopApp).toHaveBeenCalled())
      // Dismissing via the modal CTA exercises the close handler without throwing.
      await userEvent.click(screen.getByText('page.download.modal.cta'))
    })
  })

  describe('when the URL carries onboarding identifiers', () => {
    it('should strip the email and user params and resolve the profile from the user param', () => {
      window.history.pushState({}, '', '/download?email=jane.doe@example.com&user=0xuser')
      setWallet(null)
      setProfile({ avatars: [{ name: 'Jane', ethAddress: '0xuser' }] })
      render(<DownloadLayout title={TITLE} />)
      expect(window.location.search).not.toContain('email')
      expect(window.location.search).not.toContain('user')
      expect(screen.getByText('page.download.pre_title|Jane')).toBeInTheDocument()
    })
  })

  describe('when rendered on a mobile device', () => {
    beforeEach(() => {
      mockUseDesktopMediaQuery.mockReturnValue(false)
    })

    it('should show the App Store badge on iOS', () => {
      mockUseAdvancedUserAgentData.mockReturnValue([false, { os: { name: 'iOS' }, mobile: true }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
      render(<DownloadLayout title={TITLE} />)
      expect(screen.getByAltText('Download on the App Store')).toBeInTheDocument()
    })

    it('should show the Google Play badge on Android', () => {
      mockUseAdvancedUserAgentData.mockReturnValue([false, { os: { name: 'Android' }, mobile: true }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
      render(<DownloadLayout title={TITLE} />)
      expect(screen.getByAltText('Get it on Google Play')).toBeInTheDocument()
    })
  })
})
