import { fireEvent, render, screen } from '@testing-library/react'
import { createMockEvent } from '../../../__test-utils__/factories'
import { UpcomingCard } from './UpcomingCard'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../../../features/profile/profile.client', () => ({
  useGetProfileQuery: () => ({ data: undefined })
}))

jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: undefined, hasValidIdentity: false, address: undefined })
}))

jest.mock('../../../utils/whatsOnTime', () => ({
  getRelativeTimeLabel: () => 'Starts in 10 mins'
}))

const mockHandleCopy = jest.fn()
const mockHandleCalendar = jest.fn()
jest.mock('../../../hooks/useCardActions', () => ({
  useCardActions: () => ({
    eventUrl: 'https://decentraland.org/jump/event?position=10,20',
    copied: false,
    calendarAdded: false,
    handleCopy: mockHandleCopy,
    handleAddToCalendar: mockHandleCalendar
  })
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
  RemindMeIcon: () => <span data-testid="remind-me-icon" />
}))

jest.mock('../common/RemindMeButton', () => ({
  RemindMeButton: ({ isReminded, onClick }: { isReminded: boolean; onClick: React.MouseEventHandler }) => (
    <button data-testid="remind-me-button" data-reminded={isReminded} onClick={onClick} />
  )
}))

jest.mock('../common/CalendarAddIcon', () => ({
  CalendarAddIcon: () => <span data-testid="calendar-add-icon" />
}))

jest.mock('@mui/icons-material/CalendarMonth', () => ({
  __esModule: true,
  default: () => <span data-testid="calendar-month-icon" />
}))

jest.mock('decentraland-ui2', () => ({
  EventSmallCard: ({
    image,
    title,
    creatorName,
    timeLabel,
    onClick,
    action,
    hoverActions
  }: {
    image?: string
    title: string
    creatorName?: string
    timeLabel?: string
    onClick?: () => void
    action?: React.ReactNode
    hoverActions?: React.ReactNode
  }) => (
    <div data-testid="event-small-card" onClick={onClick}>
      {image && <img data-testid="thumbnail" src={image} alt={title} />}
      <span data-testid="event-title">{title}</span>
      {creatorName && <span data-testid="creator-name">{creatorName}</span>}
      {timeLabel && <span data-testid="time-label">{timeLabel}</span>}
      {action && <div data-testid="mobile-action-slot">{action}</div>}
      {hoverActions && <div data-testid="hover-actions-slot">{hoverActions}</div>}
    </div>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

jest.mock('../common/CardActions.styled', () => ({
  ActionButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="action-button" {...props} />,
  ActionTextButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="action-text-button" {...props} />,
  ActionTextLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  CalendarIcon: () => <span data-testid="calendar-icon" />,
  CopyIcon: () => <span data-testid="copy-icon" />
}))

jest.mock('./UpcomingCard.styled', () => ({
  MobileActionButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="mobile-action" {...props} />
}))

describe('UpcomingCard', () => {
  let mockOnClick: jest.Mock

  beforeEach(() => {
    mockOnClick = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered with an event', () => {
    it('should render the event title', () => {
      render(<UpcomingCard event={createMockEvent()} onClick={mockOnClick} />)

      expect(screen.getByTestId('event-title')).toHaveTextContent('Test Event')
    })

    it('should render the thumbnail', () => {
      render(<UpcomingCard event={createMockEvent()} onClick={mockOnClick} />)

      expect(screen.getByTestId('thumbnail')).toHaveAttribute('src', 'https://example.com/event.png')
    })

    it('should render the creator name', () => {
      render(<UpcomingCard event={createMockEvent()} onClick={mockOnClick} />)

      expect(screen.getByTestId('creator-name')).toBeInTheDocument()
    })

    it('should render the time label', () => {
      render(<UpcomingCard event={createMockEvent()} onClick={mockOnClick} />)

      expect(screen.getByTestId('time-label')).toHaveTextContent('Starts in 10 mins')
    })

    it('should forward the click to onClick', () => {
      const event = createMockEvent()
      render(<UpcomingCard event={event} onClick={mockOnClick} />)

      fireEvent.click(screen.getByTestId('event-small-card'))

      expect(mockOnClick).toHaveBeenCalledWith(event)
    })
  })

  describe('when event has no image', () => {
    it('should not render the thumbnail', () => {
      render(<UpcomingCard event={createMockEvent({ image: null })} onClick={mockOnClick} />)

      expect(screen.queryByTestId('thumbnail')).not.toBeInTheDocument()
    })
  })

  describe('when the copy button is clicked', () => {
    it('should call handleCopy from useCardActions', () => {
      render(<UpcomingCard event={createMockEvent()} onClick={mockOnClick} />)

      const actionButtons = screen.getAllByTestId('action-button')
      const copyButton = actionButtons[actionButtons.length - 1]
      fireEvent.click(copyButton)

      expect(mockHandleCopy).toHaveBeenCalled()
    })
  })

  describe('when the add to calendar button is clicked', () => {
    it('should call handleAddToCalendar from useCardActions', () => {
      render(<UpcomingCard event={createMockEvent()} onClick={mockOnClick} />)

      const calendarButton = screen.getByTestId('action-text-button')
      fireEvent.click(calendarButton)

      expect(mockHandleCalendar).toHaveBeenCalled()
    })
  })
})
