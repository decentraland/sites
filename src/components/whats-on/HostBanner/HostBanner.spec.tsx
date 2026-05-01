import { fireEvent, render, screen } from '@testing-library/react'
import { HostBanner } from './HostBanner'

jest.mock('./HostBanner.styled', () => ({
  AvatarImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img data-testid="avatar-image" {...props} />,
  BannerSection: ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { children: React.ReactNode }) => (
    <section {...props}>{children}</section>
  ),
  BannerSubtitle: ({ children }: { children: React.ReactNode }) => <p data-testid="banner-subtitle">{children}</p>,
  BannerTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="banner-title">{children}</h2>,
  ButtonRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CheckBoxIcon: () => <span data-testid="check-icon" />,
  CheckBoxShape: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  CheckText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  ChecklistItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChecklistWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ContentArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BannerButton: ({
    children,
    startIcon,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; startIcon?: React.ReactNode }) => (
    <button {...props}>
      {startIcon}
      {children}
    </button>
  ),
  SceneImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img data-testid="scene-image" {...props} />,
  SceneImageWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

jest.mock('@mui/icons-material/Add', () => ({
  __esModule: true,
  default: () => <span data-testid="add-icon" />
}))

jest.mock('../../../images/whats-on/images/host_avatar.webp', () => 'avatar.webp')
jest.mock('../../../images/whats-on/images/host_scene.webp', () => 'scene.webp')

const mockUseAuthIdentity = jest.fn()
jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => mockUseAuthIdentity()
}))

const mockRedirectToAuth = jest.fn()
jest.mock('../../../utils/authRedirect', () => ({
  redirectToAuth: (...args: unknown[]) => mockRedirectToAuth(...args)
}))

describe('HostBanner', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered', () => {
    beforeEach(() => {
      mockUseAuthIdentity.mockReturnValue({ hasValidIdentity: false, identity: undefined, address: undefined })
    })

    it('should render the banner title', () => {
      render(<HostBanner />)

      expect(screen.getByTestId('banner-title')).toHaveTextContent('host_banner.title')
    })

    it('should render the create event button', () => {
      render(<HostBanner />)

      expect(screen.getByTestId('create-button')).toHaveTextContent('host_banner.create_event')
    })
  })

  describe('when the create button is clicked', () => {
    describe('and the user is connected', () => {
      beforeEach(() => {
        mockUseAuthIdentity.mockReturnValue({ hasValidIdentity: true, identity: {}, address: '0x123' })
      })

      it('should navigate to /whats-on/new-hangout', () => {
        render(<HostBanner />)

        fireEvent.click(screen.getByTestId('create-button'))

        expect(mockNavigate).toHaveBeenCalledWith('/whats-on/new-hangout')
      })
    })

    describe('and the user is not connected', () => {
      beforeEach(() => {
        mockUseAuthIdentity.mockReturnValue({ hasValidIdentity: false, identity: undefined, address: undefined })
      })

      it('should redirect to auth with /whats-on/new-hangout as return path', () => {
        render(<HostBanner />)

        fireEvent.click(screen.getByTestId('create-button'))

        expect(mockRedirectToAuth).toHaveBeenCalledWith('/whats-on/new-hangout')
      })

      it('should not navigate', () => {
        render(<HostBanner />)

        fireEvent.click(screen.getByTestId('create-button'))

        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })

  describe('when the learn more button is clicked', () => {
    beforeEach(() => {
      mockUseAuthIdentity.mockReturnValue({ hasValidIdentity: false, identity: undefined, address: undefined })
    })

    it('should open the docs URL in a new tab', () => {
      const mockOpen = jest.spyOn(window, 'open').mockImplementation()

      render(<HostBanner />)

      fireEvent.click(screen.getByTestId('learn-more-button'))

      expect(mockOpen).toHaveBeenCalledWith(
        'https://decentraland.org/blog/about-decentraland/how-to-make-and-run-an-event-in-decentraland',
        '_blank',
        'noopener'
      )

      mockOpen.mockRestore()
    })
  })
})
