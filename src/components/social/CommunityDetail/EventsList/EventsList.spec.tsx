import * as mockReact from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMockEvent } from '../../../../__test-utils__/factories'
import type { EventEntry } from '../../../../features/whats-on-events'
import { EventsList } from './EventsList'

jest.mock('decentraland-ui2', () => ({
  CircularProgress: () => <div role="progressbar" />,
  SvgIcon: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('../../../../hooks/useInfiniteScrollSentinel', () => ({
  useInfiniteScrollSentinel: () => ({ current: null })
}))

jest.mock('../../../whats-on/Upcoming/UpcomingCard', () => ({
  UpcomingCard: ({ event, onClick }: { event: { id: string; name: string }; onClick: (event: { id: string; name: string }) => void }) => (
    <button data-testid={`upcoming-card-${event.id}`} onClick={() => onClick(event)}>
      {event.name}
    </button>
  )
}))

jest.mock('./EventsList.styled', () => {
  const make = (testid: string) =>
    mockReact.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { color?: string }>(({ color: _color, ...props }, ref) =>
      mockReact.createElement('div', { 'data-testid': testid, ref, ...props })
    )
  return {
    EmptyState: make('empty-state'),
    EmptyStateText: make('empty-state-text'),
    EventsGrid: make('events-grid'),
    EventsSection: make('events-section'),
    InitialLoader: make('initial-loader'),
    LoadMoreSentinel: make('load-more-sentinel'),
    SectionTitle: make('section-title'),
    SentinelLoader: make('sentinel-loader')
  }
})

function renderEventsList(props: Partial<React.ComponentProps<typeof EventsList>> = {}) {
  const defaults = {
    events: [] as EventEntry[],
    onLoadMore: jest.fn(),
    onEventClick: jest.fn()
  }
  return render(<EventsList {...defaults} {...props} />)
}

describe('EventsList', () => {
  let events: EventEntry[]
  let mockOnEventClick: jest.Mock
  let mockOnLoadMore: jest.Mock

  beforeEach(() => {
    events = [createMockEvent({ id: 'event-1', name: 'First Event' }), createMockEvent({ id: 'event-2', name: 'Second Event' })]
    mockOnEventClick = jest.fn()
    mockOnLoadMore = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when loading', () => {
    it('should show the initial loader', () => {
      renderEventsList({ isLoading: true, onEventClick: mockOnEventClick, onLoadMore: mockOnLoadMore })

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('when there are no upcoming events', () => {
    it('should show the empty state message', () => {
      renderEventsList({ events: [], onEventClick: mockOnEventClick, onLoadMore: mockOnLoadMore })

      expect(screen.getByText('community.events.no_upcoming_events')).toBeInTheDocument()
    })
  })

  describe('when rendering events', () => {
    it('should show cards using the whats-on upcoming card', () => {
      renderEventsList({ events, onEventClick: mockOnEventClick, onLoadMore: mockOnLoadMore })

      expect(screen.getByTestId('upcoming-card-event-1')).toHaveTextContent('First Event')
    })
  })

  describe('when an event card is clicked', () => {
    it('should call onEventClick with the event', () => {
      renderEventsList({ events, onEventClick: mockOnEventClick, onLoadMore: mockOnLoadMore })

      fireEvent.click(screen.getByTestId('upcoming-card-event-1'))

      expect(mockOnEventClick).toHaveBeenCalledWith(events[0])
    })
  })

  describe('when the title is hidden', () => {
    it('should not render the section title', () => {
      renderEventsList({ events, hideTitle: true, onEventClick: mockOnEventClick, onLoadMore: mockOnLoadMore })

      expect(screen.queryByText('community.events.upcoming_events')).not.toBeInTheDocument()
    })
  })

  describe('when fetching more events', () => {
    it('should show the sentinel loader', () => {
      renderEventsList({ events, hasMore: true, isFetchingMore: true, onEventClick: mockOnEventClick, onLoadMore: mockOnLoadMore })

      expect(screen.getByTestId('sentinel-loader')).toBeInTheDocument()
    })
  })
})
