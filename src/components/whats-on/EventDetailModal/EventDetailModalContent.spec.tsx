import { fireEvent, render, screen } from '@testing-library/react'
import { createMockModalData } from '../../../__test-utils__/factories'
import { EventDetailModalContent } from './EventDetailModalContent'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../../../utils/whatsOnUrl', () => ({
  buildCalendarUrl: jest.fn(() => 'https://calendar.google.com/test')
}))

jest.mock('./EventDetailModal.styled', () => ({
  ContentSection: ({ children }: { children: React.ReactNode }) => <div data-testid="content-section">{children}</div>,
  SectionLabel: ({ children }: { children: React.ReactNode }) => <div data-testid="section-label">{children}</div>,
  DescriptionText: ({ children }: { children: React.ReactNode }) => <p data-testid="description">{children}</p>,
  ContentDivider: () => <hr data-testid="divider" />,
  ScheduleRow: ({ children }: { children: React.ReactNode }) => <div data-testid="schedule-row">{children}</div>,
  ScheduleText: ({ children }: { children: React.ReactNode }) => <span data-testid="schedule-text">{children}</span>,
  ScheduleIconButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="calendar-btn" {...props} />,
  RecurrenceText: ({ children }: { children: React.ReactNode }) => <span data-testid="recurrence">{children}</span>
}))

jest.mock('@mui/icons-material/CalendarToday', () => ({
  __esModule: true,
  default: () => <span data-testid="calendar-icon" />
}))

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}))

function createMockData(overrides: Partial<ReturnType<typeof createMockModalData>> = {}) {
  return createMockModalData({
    image: null,
    creatorAddress: undefined,
    creatorName: undefined,
    totalAttendees: 0,
    categories: [],
    ...overrides
  })
}

describe('EventDetailModalContent', () => {
  beforeEach(() => {
    jest.spyOn(window, 'open').mockImplementation(jest.fn())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when data has description and schedule', () => {
    it('should render the content section', () => {
      render(<EventDetailModalContent data={createMockData()} />)

      expect(screen.getByTestId('content-section')).toBeInTheDocument()
    })

    it('should render the description', () => {
      render(<EventDetailModalContent data={createMockData()} />)

      expect(screen.getByTestId('description')).toHaveTextContent('A great event')
    })

    it('should render the schedule', () => {
      render(<EventDetailModalContent data={createMockData()} />)

      expect(screen.getByTestId('schedule-row')).toBeInTheDocument()
    })

    it('should render a divider between sections', () => {
      render(<EventDetailModalContent data={createMockData()} />)

      expect(screen.getByTestId('divider')).toBeInTheDocument()
    })
  })

  describe('when data has only description', () => {
    it('should render description but no schedule', () => {
      render(<EventDetailModalContent data={createMockData({ startAt: null })} />)

      expect(screen.getByTestId('description')).toBeInTheDocument()
      expect(screen.queryByTestId('schedule-row')).not.toBeInTheDocument()
    })

    it('should not render the divider', () => {
      render(<EventDetailModalContent data={createMockData({ startAt: null })} />)

      expect(screen.queryByTestId('divider')).not.toBeInTheDocument()
    })
  })

  describe('when data has only schedule', () => {
    it('should render schedule but no description', () => {
      render(<EventDetailModalContent data={createMockData({ description: null })} />)

      expect(screen.queryByTestId('description')).not.toBeInTheDocument()
      expect(screen.getByTestId('schedule-row')).toBeInTheDocument()
    })
  })

  describe('when data has neither description nor schedule', () => {
    it('should return null', () => {
      const { container } = render(<EventDetailModalContent data={createMockData({ description: null, startAt: null })} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('when the event is recurrent', () => {
    describe('and frequency is DAILY', () => {
      it('should show the recurrence label', () => {
        render(<EventDetailModalContent data={createMockData({ recurrent: true, recurrentFrequency: 'DAILY' })} />)

        expect(screen.getByTestId('recurrence')).toBeInTheDocument()
      })
    })

    describe('and frequency is WEEKLY', () => {
      it('should show the recurrence label', () => {
        render(<EventDetailModalContent data={createMockData({ recurrent: true, recurrentFrequency: 'WEEKLY' })} />)

        expect(screen.getByTestId('recurrence')).toBeInTheDocument()
      })
    })

    describe('and frequency is MONTHLY', () => {
      it('should show the recurrence label', () => {
        render(<EventDetailModalContent data={createMockData({ recurrent: true, recurrentFrequency: 'MONTHLY' })} />)

        expect(screen.getByTestId('recurrence')).toBeInTheDocument()
      })
    })

    describe('and frequency is unsupported', () => {
      it('should not show the recurrence label', () => {
        render(<EventDetailModalContent data={createMockData({ recurrent: true, recurrentFrequency: 'YEARLY' })} />)

        expect(screen.queryByTestId('recurrence')).not.toBeInTheDocument()
      })
    })
  })

  describe('when the add to calendar button is clicked', () => {
    it('should call buildCalendarUrl', () => {
      const { buildCalendarUrl } = jest.requireMock('../../../utils/whatsOnUrl')
      render(<EventDetailModalContent data={createMockData()} />)

      fireEvent.click(screen.getByTestId('calendar-btn'))

      expect(buildCalendarUrl).toHaveBeenCalled()
    })
  })

  describe('when data has a finishAt time', () => {
    it('should display the end time in the schedule', () => {
      render(<EventDetailModalContent data={createMockData()} />)

      const scheduleText = screen.getByTestId('schedule-text')
      expect(scheduleText.textContent).toContain('–')
    })
  })

  describe('when data has no finishAt time', () => {
    it('should not display end time', () => {
      render(<EventDetailModalContent data={createMockData({ finishAt: null })} />)

      const scheduleText = screen.getByTestId('schedule-text')
      expect(scheduleText.textContent).not.toContain('–')
    })
  })
})
