import { fireEvent, render, screen } from '@testing-library/react'
import { createMockModalData } from '../../../__test-utils__/factories'
import { EventDetailModalHero } from './EventDetailModalHero'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const mockUseCreatorProfile = jest.fn()
const defaultCreatorProfile = { isDclFoundation: false, creatorName: 'CreatorName', avatarFace: undefined }
jest.mock('../../../hooks/useCreatorProfile', () => ({
  useCreatorProfile: (...args: unknown[]) => mockUseCreatorProfile(...(args as []))
}))

jest.mock('../../../utils/whatsOnUrl', () => ({
  buildCalendarUrl: jest.fn(() => 'https://calendar.google.com/test')
}))

let mockIsMobile = false
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: () => mockIsMobile
}))

const mockHandleRemindToggle = jest.fn()
jest.mock('../../../hooks/useRemindMe', () => ({
  useRemindMe: () => ({
    isReminded: false,
    isLoading: false,
    isShaking: false,
    handleToggle: mockHandleRemindToggle
  })
}))

jest.mock('../common/RemindMeIcon', () => ({
  RemindMeIcon: ({ active }: { active: boolean }) => <span data-testid="remind-me-icon" data-active={active} />
}))

jest.mock('decentraland-ui2', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ breakpoints: { down: () => '(max-width:600px)' } })
}))

jest.mock('./EventDetailModal.styled', () => ({
  HeroSection: ({ children }: { children: React.ReactNode }) => <div data-testid="hero-section">{children}</div>,
  HeroImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img data-testid="hero-image" {...props} />,
  HeroOverlay: () => <div data-testid="hero-overlay" />,
  CloseButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="close-button" {...props} />,
  CloseIconStyled: () => <span>X</span>,
  HeroContent: ({ children }: { children: React.ReactNode }) => <div data-testid="hero-content">{children}</div>,
  CategoryLabel: ({ children }: { children: React.ReactNode }) => <span data-testid="category-label">{children}</span>,
  ModalTitle: ({ children, ...props }: { children: React.ReactNode; id?: string }) => (
    <h2 data-testid="modal-title" {...props}>
      {children}
    </h2>
  ),
  CreatorRow: ({ children }: { children: React.ReactNode }) => <div data-testid="creator-row">{children}</div>,
  AvatarImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img data-testid="avatar-image" {...props} />,
  AvatarFallback: () => <div data-testid="avatar-fallback" />,
  CreatorName: ({ children }: { children: React.ReactNode }) => <span data-testid="creator-name">{children}</span>,
  CreatorNameHighlight: ({ children }: { children: React.ReactNode }) => <strong>{children}</strong>,
  ActionsRow: ({ children }: { children: React.ReactNode }) => <div data-testid="actions-row">{children}</div>,
  JumpInButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="jump-in-button" {...props} />,
  SecondaryButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="secondary-button" {...props} />,
  CopyButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="copy-button" {...props} />,
  CopyIconStyled: () => <span>Copy</span>
}))

jest.mock('@mui/icons-material/CalendarMonth', () => ({
  __esModule: true,
  default: () => <span data-testid="calendar-icon" />
}))

jest.mock('@mui/icons-material/NotificationsNone', () => ({
  __esModule: true,
  default: () => <span data-testid="notification-icon" />
}))

jest.mock('@mui/icons-material/ArrowBackIosNew', () => ({
  __esModule: true,
  default: () => <span data-testid="back-arrow-icon" />
}))

const createMockData = createMockModalData

describe('EventDetailModalHero', () => {
  let mockOnClose: jest.Mock
  let mockWindowOpen: jest.SpyInstance

  beforeEach(() => {
    mockOnClose = jest.fn()
    mockWindowOpen = jest.spyOn(window, 'open').mockImplementation(jest.fn())
    mockUseCreatorProfile.mockReturnValue(defaultCreatorProfile)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when rendered with complete data', () => {
    it('should render the event title', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      expect(screen.getByTestId('modal-title')).toHaveTextContent('Test Event')
    })

    it('should render the hero image', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      expect(screen.getByTestId('hero-image')).toHaveAttribute('src', 'https://example.com/event.png')
    })

    it('should render the category label', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      expect(screen.getByTestId('category-label')).toHaveTextContent('music')
    })

    it('should render the close button', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      expect(screen.getByTestId('close-button')).toBeInTheDocument()
    })

    it('should render the jump in button', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      expect(screen.getByTestId('jump-in-button')).toBeInTheDocument()
    })
  })

  describe('when the close button is clicked', () => {
    it('should call onClose', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      fireEvent.click(screen.getByTestId('close-button'))

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('when the jump in button is clicked', () => {
    it('should open the event URL', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      fireEvent.click(screen.getByTestId('jump-in-button'))

      expect(mockWindowOpen).toHaveBeenCalledWith('https://decentraland.org/jump/event?position=10,20', '_blank', 'noopener,noreferrer')
    })
  })

  describe('when the event has no image', () => {
    it('should not render the hero image', () => {
      render(<EventDetailModalHero data={createMockData({ image: null })} onClose={mockOnClose} />)

      expect(screen.queryByTestId('hero-image')).not.toBeInTheDocument()
    })
  })

  describe('when the event is live', () => {
    it('should show live_now as subtitle', () => {
      render(<EventDetailModalHero data={createMockData({ live: true })} onClose={mockOnClose} />)

      expect(screen.getByTestId('category-label')).toHaveTextContent('event_detail.live_now')
    })

    it('should not render the remind me button', () => {
      render(<EventDetailModalHero data={createMockData({ live: true })} onClose={mockOnClose} />)

      expect(screen.queryByTestId('remind-me-icon')).not.toBeInTheDocument()
    })
  })

  describe('when the event has no categories and is not live', () => {
    it('should not render the category label', () => {
      render(<EventDetailModalHero data={createMockData({ categories: [], live: false })} onClose={mockOnClose} />)

      expect(screen.queryByTestId('category-label')).not.toBeInTheDocument()
    })
  })

  describe('when the event has no startAt', () => {
    it('should not render the calendar button', () => {
      render(<EventDetailModalHero data={createMockData({ startAt: null })} onClose={mockOnClose} />)

      const buttons = screen.getAllByTestId('secondary-button')
      expect(buttons).toHaveLength(1)
    })
  })

  describe('when the modal data is a live place without a matching event', () => {
    it('should not render the remind me button', () => {
      render(<EventDetailModalHero data={createMockData({ isEvent: false, startAt: null })} onClose={mockOnClose} />)

      expect(screen.queryByTestId('remind-me-icon')).not.toBeInTheDocument()
    })
  })

  describe('when the event has no creator', () => {
    beforeEach(() => {
      mockUseCreatorProfile.mockReturnValue({ isDclFoundation: false, creatorName: undefined, avatarFace: undefined })
    })

    it('should not render the creator row', () => {
      render(<EventDetailModalHero data={createMockData({ creatorAddress: undefined, creatorName: undefined })} onClose={mockOnClose} />)

      expect(screen.queryByTestId('creator-row')).not.toBeInTheDocument()
    })
  })

  describe('when rendered on mobile', () => {
    beforeEach(() => {
      mockIsMobile = true
    })

    afterEach(() => {
      mockIsMobile = false
    })

    it('should render a back arrow instead of close icon', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      expect(screen.getByTestId('back-arrow-icon')).toBeInTheDocument()
    })

    it('should call onClose when back arrow is clicked', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      fireEvent.click(screen.getByTestId('close-button'))

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('when useCreatorProfile resolves the event as Decentraland Foundation', () => {
    beforeEach(() => {
      mockUseCreatorProfile.mockReturnValue({
        isDclFoundation: true,
        creatorName: 'Decentraland Foundation',
        avatarFace: '/dcl-logo.svg'
      })
    })

    it('should render the Foundation name in the creator row', () => {
      render(<EventDetailModalHero data={createMockData({ creatorName: 'Decentraland Foundation' })} onClose={mockOnClose} />)

      expect(screen.getByTestId('creator-name')).toHaveTextContent('Decentraland Foundation')
    })

    it('should render the Foundation logo as the avatar', () => {
      render(<EventDetailModalHero data={createMockData({ creatorName: 'Decentraland Foundation' })} onClose={mockOnClose} />)

      expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', '/dcl-logo.svg')
    })

    it('should forward the event address and name to useCreatorProfile', () => {
      render(
        <EventDetailModalHero
          data={createMockData({ creatorAddress: '0xFoundation', creatorName: 'Decentraland Foundation' })}
          onClose={mockOnClose}
        />
      )

      expect(mockUseCreatorProfile).toHaveBeenCalledWith('0xFoundation', 'Decentraland Foundation')
    })
  })

  describe('when the copy button is clicked', () => {
    let mockWriteText: jest.Mock
    let originalClipboard: Clipboard

    beforeEach(() => {
      originalClipboard = navigator.clipboard
      mockWriteText = jest.fn().mockResolvedValueOnce(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true
      })
    })

    afterEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true
      })
    })

    it('should copy the event URL to clipboard', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      fireEvent.click(screen.getByTestId('copy-button'))

      expect(mockWriteText).toHaveBeenCalledWith('https://decentraland.org/jump/event?position=10,20')
    })
  })
})
