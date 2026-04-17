import { fireEvent, render, screen } from '@testing-library/react'
import { createMockEvent } from '../../__test-utils__/factories'
import { FutureCard } from './FutureCard'

const mockHasValidIdentity = jest.fn()
jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({
    hasValidIdentity: mockHasValidIdentity(),
    identity: undefined,
    address: undefined
  })
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'all_experiences.coming_soon': 'Coming soon',
        'all_experiences.remind_me': 'Remind me',
        'all_experiences.add_to_calendar': 'Add to calendar',
        'all_experiences.copy_link': 'Copy link',
        'all_experiences.copied': 'Copied!',
        'upcoming.by_prefix': 'By '
      }
      return translations[key] ?? key
    }
  })
}))

jest.mock('../../features/profile/profile.client', () => ({
  useGetProfileQuery: () => ({ data: null })
}))

const mockHandleCopy = jest.fn()
const mockHandleCalendar = jest.fn()
jest.mock('../../hooks/useCardActions', () => ({
  useCardActions: () => ({
    eventUrl: 'https://decentraland.org/jump/event?position=10,20',
    copied: false,
    handleCopy: mockHandleCopy,
    handleAddToCalendar: mockHandleCalendar
  })
}))

const mockHandleRemindToggle = jest.fn()
jest.mock('../../hooks/useRemindMe', () => ({
  useRemindMe: () => ({
    isReminded: false,
    isLoading: false,
    isShaking: false,
    handleToggle: mockHandleRemindToggle
  })
}))

jest.mock('../common/RemindMeButton', () => ({
  RemindMeButton: ({ isReminded, onClick }: { isReminded: boolean; onClick: React.MouseEventHandler }) => (
    <button data-testid="remind-me-button" data-reminded={isReminded} onClick={onClick} />
  )
}))

jest.mock('decentraland-ui2', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

jest.mock('../common/CardActions.styled', () => ({
  ActionButton: ({ children, onClick }: { children: React.ReactNode; onClick?: React.MouseEventHandler }) => (
    <button data-testid="action-button" onClick={onClick}>
      {children}
    </button>
  ),
  ActionTextButton: ({
    children,
    onClick,
    disabled
  }: {
    children: React.ReactNode
    onClick?: React.MouseEventHandler
    disabled?: boolean
  }) => (
    <button data-testid="action-text-button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  ActionTextLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  CalendarIcon: () => <span data-testid="calendar-icon" />,
  CopyIcon: () => <span data-testid="copy-icon" />,
  AvatarImage: () => <img data-testid="avatar-image" />,
  AvatarFallback: () => <div data-testid="avatar-fallback" />,
  CreatorName: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  CreatorNameHighlight: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  CreatorRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TimePill: ({ children }: Record<string, unknown>) => <div data-testid="time-pill">{children as React.ReactNode}</div>,
  TimeIcon: () => <span />,
  TimeLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  HoverActions: ({ children }: Record<string, unknown>) => <div data-testid="hover-actions">{children as React.ReactNode}</div>
}))

jest.mock('./AllExperiencesCard.styled', () => ({
  FutureCardContainer: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div data-testid="future-card" onClick={onClick}>
      {children}
    </div>
  ),
  CardImageWrapper: ({ children }: { children: React.ReactNode }) => <div data-testid="card-image-wrapper">{children}</div>,
  CardImage: (props: Record<string, unknown>) => <img data-testid="card-image" src={props.src as string} alt={props.alt as string} />,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <span data-testid="card-title">{children}</span>
}))

describe('FutureCard', () => {
  let mockOnClick: jest.Mock

  beforeEach(() => {
    mockOnClick = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the user is signed out', () => {
    let event: ReturnType<typeof createMockEvent>

    beforeEach(() => {
      mockHasValidIdentity.mockReturnValue(false)
      event = createMockEvent({ name: 'Future Concert', live: false, image: 'https://example.com/img.png' })
    })

    it('should render the event title', () => {
      render(<FutureCard event={event} onClick={mockOnClick} />)

      expect(screen.getByTestId('card-title')).toHaveTextContent('Future Concert')
    })

    it('should render the event image', () => {
      render(<FutureCard event={event} onClick={mockOnClick} />)

      expect(screen.getByTestId('card-image')).toHaveAttribute('src', 'https://example.com/img.png')
    })

    it('should render the time pill', () => {
      render(<FutureCard event={event} onClick={mockOnClick} />)

      expect(screen.getByTestId('time-pill')).toBeInTheDocument()
    })

    it('should show Add to Calendar as a text button', () => {
      render(<FutureCard event={event} onClick={mockOnClick} />)

      expect(screen.getByText('Add to calendar')).toBeInTheDocument()
    })

    it('should not show Remind Me', () => {
      render(<FutureCard event={event} onClick={mockOnClick} />)

      expect(screen.queryByText('Remind me')).not.toBeInTheDocument()
    })

    it('should render a copy button', () => {
      render(<FutureCard event={event} onClick={mockOnClick} />)

      expect(screen.getByTestId('copy-icon')).toBeInTheDocument()
    })
  })

  describe('when the user is signed in', () => {
    let event: ReturnType<typeof createMockEvent>

    beforeEach(() => {
      mockHasValidIdentity.mockReturnValue(true)
      event = createMockEvent({ live: false })
    })

    it('should show Remind Me button', () => {
      render(<FutureCard event={event} onClick={mockOnClick} />)

      expect(screen.getByTestId('remind-me-button')).toBeInTheDocument()
    })

    it('should show a Calendar icon button', () => {
      render(<FutureCard event={event} onClick={mockOnClick} />)

      expect(screen.getAllByTestId('calendar-icon').length).toBeGreaterThanOrEqual(1)
    })

    it('should show a copy button', () => {
      render(<FutureCard event={event} onClick={mockOnClick} />)

      expect(screen.getByTestId('copy-icon')).toBeInTheDocument()
    })
  })

  describe('when the event has no image', () => {
    let event: ReturnType<typeof createMockEvent>

    beforeEach(() => {
      mockHasValidIdentity.mockReturnValue(false)
      event = createMockEvent({ live: false, image: null })
    })

    it('should not render the image wrapper', () => {
      render(<FutureCard event={event} onClick={mockOnClick} />)

      expect(screen.queryByTestId('card-image-wrapper')).not.toBeInTheDocument()
    })
  })

  describe('when the card is clicked', () => {
    let event: ReturnType<typeof createMockEvent>

    beforeEach(() => {
      mockHasValidIdentity.mockReturnValue(false)
      event = createMockEvent({ live: false })
    })

    it('should call onClick with the event', () => {
      render(<FutureCard event={event} onClick={mockOnClick} />)

      fireEvent.click(screen.getByTestId('future-card'))
      expect(mockOnClick).toHaveBeenCalledWith(event)
    })
  })
})
