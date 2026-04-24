import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMockModalData } from '../../../__test-utils__/factories'
import { EventDetailModalHero } from './EventDetailModalHero'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../../../hooks/useCanEditEvent', () => ({
  useCanEditEvent: () => ({ canEdit: false, isLoading: false })
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

jest.mock('../../../hooks/useCreatorAvatar', () => ({
  useCreatorAvatar: (address?: string, name?: string) => ({
    avatar: address ? { name: name ?? '', ethAddress: address, avatar: { snapshots: { face256: '', body: '' } } } : undefined,
    avatarFace: undefined
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
  LiveNowLabel: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => <span {...props}>{children}</span>,
  LiveNowIconStyled: () => <span data-testid="live-now-icon" />,
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
  SecondaryButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="secondary-button" {...props} />,
  CopyButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="copy-button" {...props} />,
  CopyIconStyled: () => <span>Copy</span>,
  EditButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="edit-button" {...props} />
}))

jest.mock('../../jump/JumpInButton', () => ({
  JumpInButton: ({ children, position, realm }: { children: React.ReactNode; position: string; realm?: string }) => (
    <button data-testid="jump-in-button" data-position={position} data-realm={realm}>
      {children}
    </button>
  )
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

  beforeEach(() => {
    mockOnClose = jest.fn()
    jest.spyOn(window, 'open').mockImplementation(jest.fn())
    mockUseCreatorProfile.mockReset()
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

  describe('when rendering the jump in button', () => {
    it('should pass the event position to the jump in button', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      expect(screen.getByTestId('jump-in-button')).toHaveAttribute('data-position', '10,20')
    })
  })

  describe('when the event has no image', () => {
    it('should not render the hero image', () => {
      render(<EventDetailModalHero data={createMockData({ image: null })} onClose={mockOnClose} />)

      expect(screen.queryByTestId('hero-image')).not.toBeInTheDocument()
    })
  })

  describe('when the event is live', () => {
    it('should show the live now label instead of the category', () => {
      render(<EventDetailModalHero data={createMockData({ live: true })} onClose={mockOnClose} />)

      expect(screen.getByText('event_detail.live_now')).toBeInTheDocument()
      expect(screen.queryByTestId('category-label')).not.toBeInTheDocument()
    })

    it('should render the pulsing live icon', () => {
      render(<EventDetailModalHero data={createMockData({ live: true })} onClose={mockOnClose} />)

      expect(screen.getByTestId('live-now-icon')).toBeInTheDocument()
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

  describe('when the event has a creator address but no creator name', () => {
    beforeEach(() => {
      mockUseCreatorProfile.mockReturnValue({
        isDclFoundation: false,
        creatorName: '0xabcd…ef12',
        avatarFace: undefined
      })
    })

    it('should render an abbreviated address instead of an empty byline', () => {
      render(
        <EventDetailModalHero
          data={createMockData({ creatorAddress: '0xabcdef1234567890abcdef1234567890abcdef12', creatorName: undefined })}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByTestId('creator-name')).toHaveTextContent('0xabcd…ef12')
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

      expect(mockUseCreatorProfile).toHaveBeenCalledWith('0xFoundation', 'Decentraland Foundation', expect.any(String))
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

    it('should copy the event URL to clipboard', async () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      await act(async () => {
        fireEvent.click(screen.getByTestId('copy-button'))
      })

      expect(mockWriteText).toHaveBeenCalledWith('https://decentraland.org/jump/event?position=10,20')
    })
  })
})
