import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMockModalData } from '../../../__test-utils__/factories'
import { EventDetailModalHero } from './EventDetailModalHero'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) => {
      if (!values) return key
      return `${key}:${Object.entries(values)
        .map(([k, v]) => `${k}=${v}`)
        .join(',')}`
    },
    locale: 'en-US'
  })
}))

jest.mock('../../../hooks/useCanEditEvent', () => ({
  useCanEditEvent: () => ({ canEdit: false, isLoading: false })
}))

const mockUseAuthIdentity = jest.fn()
jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => mockUseAuthIdentity()
}))

const mockBuildEventShareUrl = jest.fn()
jest.mock('../../../utils/whatsOnUrl', () => ({
  buildCalendarUrl: jest.fn(() => 'https://calendar.google.com/test'),
  buildEventShareUrl: (...args: unknown[]) => mockBuildEventShareUrl(...args),
  normalizeRecurrence: (frequency: string | null, interval: number | null) => ({
    frequency: frequency ?? 'WEEKLY',
    interval: interval ?? 1
  })
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

jest.mock('../common/LocalDateTimeTooltip', () => ({
  LocalDateTimeTooltip: ({ children, startIso, finishIso }: { children: React.ReactNode; startIso: string; finishIso?: string | null }) => (
    <span data-testid="local-datetime-tooltip" data-start={startIso} data-finish={finishIso ?? ''}>
      {children}
    </span>
  )
}))

jest.mock('decentraland-ui2', () => ({
  LiveBadge: () => <span data-testid="live-badge">LIVE</span>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ breakpoints: { down: () => '(max-width:600px)' } })
}))

jest.mock('../DetailModal', () => ({
  DetailModalCreator: ({ address, name, prefixLabel }: { address?: string; name?: string; prefixLabel: string }) => {
    if (!address && !name) return null
    return (
      <div data-testid="creator-row">
        <span data-testid="creator-name">
          {prefixLabel}
          <strong>{name}</strong>
        </span>
      </div>
    )
  }
}))

jest.mock('../DetailModal/DetailModal.styled', () => ({
  HeroSection: ({ children }: { children: React.ReactNode }) => <div data-testid="hero-section">{children}</div>,
  HeroImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img data-testid="hero-image" {...props} />,
  HeroOverlay: () => <div data-testid="hero-overlay" />,
  CloseButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="close-button" {...props} />,
  CloseIconStyled: () => <span>X</span>,
  HeroContent: ({ children }: { children: React.ReactNode }) => <div data-testid="hero-content">{children}</div>,
  ModalTitle: ({ children, ...props }: { children: React.ReactNode; id?: string }) => (
    <h2 data-testid="modal-title" {...props}>
      {children}
    </h2>
  ),
  ActionsRow: ({ children }: { children: React.ReactNode }) => <div data-testid="actions-row">{children}</div>,
  PrimaryActionButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="primary-action-button" {...props} />,
  SecondaryButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="secondary-button" {...props} />,
  CopyButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="copy-button" {...props} />,
  CopyIconStyled: () => <span>Copy</span>
}))

jest.mock('./EventDetailModal.styled', () => ({
  ScheduleSubtitle: ({ children }: { children: React.ReactNode }) => <span data-testid="schedule-subtitle">{children}</span>,
  LiveBadgeWrapper: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => <span {...props}>{children}</span>,
  EditButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="edit-button" {...props} />,
  CreatorLocationRow: ({ children }: { children: React.ReactNode }) => <div data-testid="creator-location-row">{children}</div>,
  LocationRow: ({ children }: { children: React.ReactNode }) => <div data-testid="location-row">{children}</div>,
  LocationText: ({ children }: { children: React.ReactNode }) => <span data-testid="location-text">{children}</span>
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

jest.mock('@mui/icons-material/LocationOnOutlined', () => ({
  __esModule: true,
  default: () => <span data-testid="location-icon" />
}))

jest.mock('@mui/icons-material/PublicRounded', () => ({
  __esModule: true,
  default: () => <span data-testid="world-icon" />
}))

const createMockData = createMockModalData

describe('EventDetailModalHero', () => {
  let mockOnClose: jest.Mock

  beforeEach(() => {
    mockOnClose = jest.fn()
    jest.spyOn(window, 'open').mockImplementation(jest.fn())
    mockUseAuthIdentity.mockReset()
    mockUseAuthIdentity.mockReturnValue({ hasValidIdentity: false, identity: undefined, address: undefined })
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

    it('should render the schedule subtitle with the local start date and time', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      // Loose regex so the test survives CLDR/ICU bumps that tweak separators or AM/PM casing.
      expect(screen.getByTestId('schedule-subtitle')).toHaveTextContent(/Tue,?\s+Apr\s+7\s*-\s*10:00\s*AM/i)
    })

    it('should wrap the schedule subtitle in the LocalDateTimeTooltip with start and finish', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      const tooltip = screen.getByTestId('local-datetime-tooltip')
      expect(tooltip).toHaveAttribute('data-start', '2026-04-07T10:00:00Z')
      expect(tooltip).toHaveAttribute('data-finish', '2026-04-07T12:00:00Z')
    })

    it('should render the close button', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      expect(screen.getByTestId('close-button')).toBeInTheDocument()
    })

    it('should not render the jump in button when the event is not live', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      expect(screen.queryByTestId('jump-in-button')).not.toBeInTheDocument()
    })
  })

  describe('when the close button is clicked', () => {
    it('should call onClose', () => {
      render(<EventDetailModalHero data={createMockData()} onClose={mockOnClose} />)

      fireEvent.click(screen.getByTestId('close-button'))

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('when rendering a live event', () => {
    it('should render the jump in button with the event position', () => {
      render(<EventDetailModalHero data={createMockData({ live: true })} onClose={mockOnClose} />)

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
    it('should show the live badge instead of the schedule subtitle', () => {
      render(<EventDetailModalHero data={createMockData({ live: true })} onClose={mockOnClose} />)

      expect(screen.getByTestId('live-badge')).toBeInTheDocument()
      expect(screen.queryByTestId('schedule-subtitle')).not.toBeInTheDocument()
    })

    it('should not render the remind me button', () => {
      render(<EventDetailModalHero data={createMockData({ live: true })} onClose={mockOnClose} />)

      expect(screen.queryByTestId('remind-me-icon')).not.toBeInTheDocument()
    })

    it('should render the jump in button as the primary CTA', () => {
      render(<EventDetailModalHero data={createMockData({ live: true })} onClose={mockOnClose} />)

      expect(screen.getByTestId('jump-in-button')).toBeInTheDocument()
    })
  })

  describe('when the event is a future event and the user is signed in', () => {
    beforeEach(() => {
      mockUseAuthIdentity.mockReturnValue({ hasValidIdentity: true, identity: {}, address: '0xUser' })
    })

    it('should hide the jump in button and render remind-me as the primary labeled CTA', () => {
      render(<EventDetailModalHero data={createMockData({ live: false, isEvent: true })} onClose={mockOnClose} />)

      expect(screen.queryByTestId('jump-in-button')).not.toBeInTheDocument()
      const primary = screen.getByTestId('primary-action-button')
      expect(primary).toHaveTextContent('event_detail.remind_me')
      expect(primary.querySelector('[data-testid="remind-me-icon"]')).not.toBeNull()
    })
  })

  describe('when the event is a future event and the user is signed out', () => {
    describe('and the event has a start date', () => {
      it('should render add-to-calendar as the primary labeled CTA and keep remind-me as a secondary icon to trigger the auth redirect', () => {
        render(<EventDetailModalHero data={createMockData({ live: false, isEvent: true })} onClose={mockOnClose} />)

        expect(screen.queryByTestId('jump-in-button')).not.toBeInTheDocument()
        const primary = screen.getByTestId('primary-action-button')
        expect(primary).toHaveTextContent('event_detail.add_to_calendar')
        expect(primary.querySelector('[data-testid="calendar-icon"]')).not.toBeNull()
        const secondaryButtons = screen.getAllByTestId('secondary-button')
        expect(secondaryButtons.some(btn => btn.querySelector('[data-testid="remind-me-icon"]'))).toBe(true)
      })
    })

    describe('and the event has no start date', () => {
      it('should not render any primary action and keep remind-me as a secondary icon', () => {
        render(<EventDetailModalHero data={createMockData({ live: false, isEvent: true, startAt: null })} onClose={mockOnClose} />)

        expect(screen.queryByTestId('primary-action-button')).not.toBeInTheDocument()
        const secondaryButtons = screen.getAllByTestId('secondary-button')
        expect(secondaryButtons.some(btn => btn.querySelector('[data-testid="remind-me-icon"]'))).toBe(true)
      })
    })
  })

  describe('when the event has no startAt and is not live', () => {
    it('should not render the schedule subtitle', () => {
      render(<EventDetailModalHero data={createMockData({ startAt: null, live: false })} onClose={mockOnClose} />)

      expect(screen.queryByTestId('schedule-subtitle')).not.toBeInTheDocument()
    })
  })

  describe('when the event is hosted in Genesis City', () => {
    it('should render the location icon with place name and coordinates', () => {
      render(
        <EventDetailModalHero data={createMockData({ isWorld: false, placeName: 'Liberty Square', x: 10, y: 20 })} onClose={mockOnClose} />
      )

      expect(screen.getByTestId('location-icon')).toBeInTheDocument()
      expect(screen.getByTestId('location-text')).toHaveTextContent('event_detail.location_with_coords:place=Liberty Square,x=10,y=20')
    })

    it('should fall back to coordinates only when the place name is missing', () => {
      render(<EventDetailModalHero data={createMockData({ isWorld: false, placeName: null, x: 5, y: -7 })} onClose={mockOnClose} />)

      expect(screen.getByTestId('location-icon')).toBeInTheDocument()
      expect(screen.getByTestId('location-text')).toHaveTextContent('event_detail.location_coords:x=5,y=-7')
    })
  })

  describe('when the event is hosted in a world', () => {
    it('should render the world icon with the realm name', () => {
      render(<EventDetailModalHero data={createMockData({ isWorld: true, realm: 'myworld.dcl.eth' })} onClose={mockOnClose} />)

      expect(screen.getByTestId('world-icon')).toBeInTheDocument()
      expect(screen.getByTestId('location-text')).toHaveTextContent('myworld.dcl.eth')
    })

    it('should not render the location row when the realm is missing', () => {
      render(<EventDetailModalHero data={createMockData({ isWorld: true, realm: undefined })} onClose={mockOnClose} />)

      expect(screen.queryByTestId('location-row')).not.toBeInTheDocument()
    })
  })

  describe('when the event is weekly recurrent', () => {
    it('should render an "every weekday" schedule subtitle derived from local time', () => {
      render(
        <EventDetailModalHero
          data={createMockData({ recurrent: true, recurrentFrequency: 'WEEKLY', recurrentInterval: 1 })}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByTestId('schedule-subtitle')).toHaveTextContent(
        /event_detail\.hero_every_weekday:weekday=Tuesday\s*-\s*10:00\s*AM/i
      )
    })
  })

  describe('when the event has no startAt', () => {
    it('should not render the calendar button in either primary or secondary slots', () => {
      render(<EventDetailModalHero data={createMockData({ startAt: null })} onClose={mockOnClose} />)

      expect(screen.queryByTestId('calendar-icon')).not.toBeInTheDocument()
    })
  })

  describe('when the modal data is a live place without a matching event', () => {
    it('should not render the remind me button', () => {
      render(<EventDetailModalHero data={createMockData({ isEvent: false, startAt: null })} onClose={mockOnClose} />)

      expect(screen.queryByTestId('remind-me-icon')).not.toBeInTheDocument()
    })
  })

  describe('when the event has no creator', () => {
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

  describe('when the copy button is clicked', () => {
    let mockWriteText: jest.Mock
    let originalClipboard: Clipboard

    beforeEach(() => {
      mockBuildEventShareUrl.mockReset()
      originalClipboard = navigator.clipboard
      mockWriteText = jest.fn().mockResolvedValue(undefined)
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

    describe('and the modal data is a future event', () => {
      beforeEach(() => {
        mockBuildEventShareUrl.mockReturnValue('http://localhost/whats-on?id=event-1')
      })

      it('should copy the deep link back into the whats-on modal', async () => {
        render(<EventDetailModalHero data={createMockData({ live: false, isEvent: true, id: 'event-1' })} onClose={mockOnClose} />)

        await act(async () => {
          fireEvent.click(screen.getByTestId('copy-button'))
        })

        expect(mockBuildEventShareUrl).toHaveBeenCalledWith('event-1', false)
        expect(mockWriteText).toHaveBeenCalledWith('http://localhost/whats-on?id=event-1')
      })
    })

    describe('and the modal data is a live event', () => {
      beforeEach(() => {
        mockBuildEventShareUrl.mockReturnValue('http://localhost/jump/events?id=event-1')
      })

      it('should copy the jump-events deep link so the destination opens the launcher flow', async () => {
        render(<EventDetailModalHero data={createMockData({ live: true, isEvent: true, id: 'event-1' })} onClose={mockOnClose} />)

        await act(async () => {
          fireEvent.click(screen.getByTestId('copy-button'))
        })

        expect(mockBuildEventShareUrl).toHaveBeenCalledWith('event-1', true)
        expect(mockWriteText).toHaveBeenCalledWith('http://localhost/jump/events?id=event-1')
      })
    })

    describe('and the modal data is a live place without a matching event', () => {
      it('should fall back to the place jump url because there is no event id to deep link', async () => {
        render(<EventDetailModalHero data={createMockData({ isEvent: false })} onClose={mockOnClose} />)

        await act(async () => {
          fireEvent.click(screen.getByTestId('copy-button'))
        })

        expect(mockBuildEventShareUrl).not.toHaveBeenCalled()
        expect(mockWriteText).toHaveBeenCalledWith('https://decentraland.org/jump/event?position=10,20')
      })
    })
  })

  describe('when the modal data is an unsaved event preview', () => {
    it('should not render the copy link button because there is no event page to link to yet', () => {
      render(<EventDetailModalHero data={createMockData({ id: 'preview', isEvent: false })} onClose={mockOnClose} />)

      expect(screen.queryByTestId('copy-button')).not.toBeInTheDocument()
    })
  })
})
