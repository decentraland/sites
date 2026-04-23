import { fireEvent, render, screen } from '@testing-library/react'
import { createMockEvent } from '../../../__test-utils__/factories'
import { AllExperiences } from './AllExperiences'

let mockLocationState: { activeTab?: string } | null = null
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/whats-on', state: mockLocationState })
}))

const mockUseAuthIdentity = jest.fn()
jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => mockUseAuthIdentity()
}))

const mockUseGetEventsQuery = jest.fn()
jest.mock('../../../features/whats-on-events', () => ({
  useGetEventsQuery: (...args: unknown[]) => mockUseGetEventsQuery(...args)
}))

const mockColumnCount = jest.fn()
jest.mock('../../../hooks/useVisibleColumnCount', () => ({
  useVisibleColumnCount: () => mockColumnCount()
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'all_experiences.title': 'All Experiences',
        'all_experiences.tab_all': 'All Experiences',
        'all_experiences.tab_my': 'My Experiences',
        'all_experiences.today': 'Today',
        'all_experiences.tomorrow': 'Tomorrow',
        'all_experiences.navigate_previous': 'Navigate to previous dates',
        'all_experiences.navigate_next': 'Navigate to next dates',
        'my_experiences.empty_title': "You don't have any event created",
        'my_experiences.empty_cta': 'Create Event'
      }
      return translations[key] ?? key
    }
  })
}))

jest.mock('../HostBanner/HostBanner', () => ({
  HostBanner: () => <div data-testid="host-banner" />
}))

jest.mock('../Upcoming/UpcomingCard', () => ({
  UpcomingCard: ({ event }: { event: { id: string } }) => <div data-testid="mobile-event-card" data-id={event.id} />
}))

jest.mock('../EventDetailModal', () => ({
  EventDetailModal: ({ open }: { open: boolean }) => (open ? <div data-testid="event-detail-modal" /> : null),
  normalizeEventEntry: (event: { id: string }) => ({ ...event, normalized: true })
}))

jest.mock('./AllExperiences.styled', () => ({
  AllExperiencesSection: ({ children, ...props }: Record<string, unknown>) => (
    <section data-testid="all-experiences-section" aria-label={props['aria-label'] as string}>
      {children as React.ReactNode}
    </section>
  ),
  ColumnsContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="columns-container">{children}</div>,
  MobileEventsTrack: ({ children }: { children: React.ReactNode }) => <div data-testid="mobile-events-track">{children}</div>,
  MobileEventsPage: ({ children }: { children: React.ReactNode }) => <div data-testid="mobile-events-page">{children}</div>,
  SectionTitle: ({ children }: { children: React.ReactNode }) => <h4 data-testid="section-title">{children}</h4>
}))

jest.mock('./DateNavigation', () => ({
  DateNavigation: ({ startOffset, columnCount, onNavigateLeft, onNavigateRight }: Record<string, unknown>) => (
    <div data-testid="date-navigation" data-start-offset={startOffset} data-column-count={columnCount}>
      <button data-testid="nav-left" onClick={onNavigateLeft as React.MouseEventHandler}>
        Left
      </button>
      <button data-testid="nav-right" onClick={onNavigateRight as React.MouseEventHandler}>
        Right
      </button>
    </div>
  )
}))

jest.mock('./DayColumn', () => ({
  DayColumn: ({ dateLabel, isLoading, events }: Record<string, unknown>) => (
    <div data-testid="day-column" data-date-label={dateLabel} data-loading={isLoading} data-event-count={(events as unknown[]).length} />
  )
}))

jest.mock('./AllExperiencesCard', () => ({
  AllExperiencesCard: () => <div data-testid="all-experiences-card" />
}))

jest.mock('./ExperiencesTabs', () => ({
  ExperiencesTabs: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div data-testid="experiences-tabs" data-value={value}>
      <button data-testid="tab-all" onClick={() => onChange('all')}>
        All
      </button>
      <button data-testid="tab-my" onClick={() => onChange('my')}>
        My
      </button>
    </div>
  )
}))

jest.mock('./MyExperiencesEmptyState', () => ({
  MyExperiencesEmptyState: () => <div data-testid="my-experiences-empty" />
}))

jest.mock('./MyExperiencesGrid', () => ({
  MyExperiencesGrid: ({ events }: { events: { id: string }[] }) => (
    <div data-testid="my-experiences-grid" data-count={events.length}>
      {events.map(e => (
        <div key={e.id} data-testid="my-exp-grid-card" data-id={e.id} />
      ))}
    </div>
  )
}))

describe('AllExperiences', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2026, 8, 13, 10, 0, 0))
    mockUseAuthIdentity.mockReturnValue({ identity: undefined, hasValidIdentity: false, address: undefined })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
    mockLocationState = null
  })

  describe('when signed out with 3 columns', () => {
    beforeEach(() => {
      mockColumnCount.mockReturnValue(3)
      mockUseGetEventsQuery.mockReturnValue({ data: [], isLoading: false, isError: false })
    })

    it('should render the section title', () => {
      render(<AllExperiences />)

      expect(screen.getByTestId('section-title')).toHaveTextContent('All Experiences')
    })

    it('should not render the tabs switcher', () => {
      render(<AllExperiences />)

      expect(screen.queryByTestId('experiences-tabs')).not.toBeInTheDocument()
    })

    it('should render 3 day columns', () => {
      render(<AllExperiences />)

      expect(screen.getAllByTestId('day-column')).toHaveLength(3)
    })

    it('should set aria-label on the section', () => {
      render(<AllExperiences />)

      expect(screen.getByTestId('all-experiences-section')).toHaveAttribute('aria-label', 'All Experiences')
    })

    it('should pass startOffset=0 to DateNavigation initially', () => {
      render(<AllExperiences />)

      expect(screen.getByTestId('date-navigation')).toHaveAttribute('data-start-offset', '0')
    })

    it('should not show the modal initially', () => {
      render(<AllExperiences />)

      expect(screen.queryByTestId('event-detail-modal')).not.toBeInTheDocument()
    })

    it('should query events with list=active and no creator filter', () => {
      render(<AllExperiences />)

      expect(mockUseGetEventsQuery).toHaveBeenCalledWith(
        expect.objectContaining({ list: 'active', creator: undefined }),
        expect.any(Object)
      )
    })
  })

  describe('when rendered with 5 columns', () => {
    beforeEach(() => {
      mockColumnCount.mockReturnValue(5)
      mockUseGetEventsQuery.mockReturnValue({ data: [], isLoading: false, isError: false })
    })

    it('should render 5 day columns', () => {
      render(<AllExperiences />)

      expect(screen.getAllByTestId('day-column')).toHaveLength(5)
    })
  })

  describe('when rendered with 1 column (mobile)', () => {
    beforeEach(() => {
      mockColumnCount.mockReturnValue(1)
      mockUseGetEventsQuery.mockReturnValue({ data: [], isLoading: false, isError: false })
    })

    it('should render mobile track instead of day columns', () => {
      render(<AllExperiences />)

      expect(screen.queryByTestId('day-column')).not.toBeInTheDocument()
      expect(screen.getByTestId('mobile-events-track')).toBeInTheDocument()
    })
  })

  describe('when data is loading', () => {
    beforeEach(() => {
      mockColumnCount.mockReturnValue(2)
      mockUseGetEventsQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    })

    it('should pass isLoading=true to DayColumn', () => {
      render(<AllExperiences />)

      const columns = screen.getAllByTestId('day-column')
      expect(columns[0]).toHaveAttribute('data-loading', 'true')
    })
  })

  describe('when data has loaded with events on desktop', () => {
    beforeEach(() => {
      mockColumnCount.mockReturnValue(3)
      const events = [
        createMockEvent({ id: 'e1', start_at: '2026-09-13T14:00:00Z' }),
        createMockEvent({ id: 'e2', start_at: '2026-09-13T16:00:00Z' })
      ]
      mockUseGetEventsQuery.mockReturnValue({ data: events, isLoading: false, isError: false })
    })

    it('should pass the event count to DayColumn', () => {
      render(<AllExperiences />)

      expect(screen.getAllByTestId('day-column')[0]).toHaveAttribute('data-event-count', '2')
    })
  })

  describe('when data has loaded with events on mobile', () => {
    beforeEach(() => {
      mockColumnCount.mockReturnValue(1)
      const events = [
        createMockEvent({ id: 'e1', start_at: '2026-09-13T14:00:00Z' }),
        createMockEvent({ id: 'e2', start_at: '2026-09-13T16:00:00Z' })
      ]
      mockUseGetEventsQuery.mockReturnValue({ data: events, isLoading: false, isError: false })
    })

    it('should render mobile event cards instead of day columns', () => {
      render(<AllExperiences />)

      expect(screen.queryByTestId('day-column')).not.toBeInTheDocument()
      expect(screen.getAllByTestId('mobile-event-card')).toHaveLength(2)
    })
  })

  describe('when navigating right', () => {
    beforeEach(() => {
      mockColumnCount.mockReturnValue(3)
      mockUseGetEventsQuery.mockReturnValue({ data: [], isLoading: false, isError: false })
    })

    it('should update startOffset by columnCount', () => {
      render(<AllExperiences />)

      fireEvent.click(screen.getByTestId('nav-right'))
      expect(screen.getByTestId('date-navigation')).toHaveAttribute('data-start-offset', '3')
    })
  })

  describe('when navigating left after navigating right', () => {
    beforeEach(() => {
      mockColumnCount.mockReturnValue(3)
      mockUseGetEventsQuery.mockReturnValue({ data: [], isLoading: false, isError: false })
    })

    it('should return startOffset to 0', () => {
      render(<AllExperiences />)

      fireEvent.click(screen.getByTestId('nav-right'))
      fireEvent.click(screen.getByTestId('nav-left'))
      expect(screen.getByTestId('date-navigation')).toHaveAttribute('data-start-offset', '0')
    })
  })

  describe('when navigating left at startOffset 0', () => {
    beforeEach(() => {
      mockColumnCount.mockReturnValue(3)
      mockUseGetEventsQuery.mockReturnValue({ data: [], isLoading: false, isError: false })
    })

    it('should not go below 0', () => {
      render(<AllExperiences />)

      fireEvent.click(screen.getByTestId('nav-left'))
      expect(screen.getByTestId('date-navigation')).toHaveAttribute('data-start-offset', '0')
    })
  })

  describe('when fetching events', () => {
    beforeEach(() => {
      mockColumnCount.mockReturnValue(3)
      mockUseGetEventsQuery.mockReturnValue({ data: [], isLoading: false, isError: false })
    })

    it('should make a single API call for the entire visible date range', () => {
      render(<AllExperiences />)

      expect(mockUseGetEventsQuery).toHaveBeenCalledTimes(1)
    })
  })

  describe('when signed in', () => {
    beforeEach(() => {
      mockColumnCount.mockReturnValue(3)
      mockUseAuthIdentity.mockReturnValue({
        identity: { authChain: [] },
        hasValidIdentity: true,
        address: '0xCreator'
      })
      mockUseGetEventsQuery.mockReturnValue({ data: [], isLoading: false, isError: false })
    })

    it('should render the tabs switcher instead of the plain title', () => {
      render(<AllExperiences />)

      expect(screen.getByTestId('experiences-tabs')).toBeInTheDocument()
      expect(screen.queryByTestId('section-title')).not.toBeInTheDocument()
    })

    it('should default to the "all" tab', () => {
      render(<AllExperiences />)

      expect(screen.getByTestId('experiences-tabs')).toHaveAttribute('data-value', 'all')
    })

    describe('and navigation state requests the "my" tab', () => {
      beforeEach(() => {
        mockLocationState = { activeTab: 'my' }
      })

      it('should open on the "my" tab instead of "all"', () => {
        render(<AllExperiences />)

        expect(screen.getByTestId('experiences-tabs')).toHaveAttribute('data-value', 'my')
      })
    })

    describe('and the user switches to the "my" tab', () => {
      beforeEach(() => {
        const events = [
          createMockEvent({
            id: 'mine-past',
            start_at: '2024-01-01T00:00:00Z',
            finish_at: '2024-01-01T02:00:00Z',
            user: '0xCreator'
          }),
          createMockEvent({
            id: 'mine-soon',
            start_at: '2026-09-20T14:00:00Z',
            finish_at: '2026-09-20T16:00:00Z',
            user: '0xCreator'
          }),
          createMockEvent({
            id: 'mine-later',
            start_at: '2027-09-13T14:00:00Z',
            finish_at: '2027-09-13T16:00:00Z',
            user: '0xCreator'
          })
        ]
        mockUseGetEventsQuery.mockReturnValue({ data: events, isLoading: false, isError: false })
      })

      it('should query events filtered by creator with list=all', () => {
        render(<AllExperiences />)

        fireEvent.click(screen.getByTestId('tab-my'))

        expect(mockUseGetEventsQuery).toHaveBeenLastCalledWith(
          expect.objectContaining({ list: 'all', creator: '0xCreator' }),
          expect.any(Object)
        )
      })

      it('should force a refetch when mounting the my tab so newly created events are visible', () => {
        render(<AllExperiences />)

        fireEvent.click(screen.getByTestId('tab-my'))

        const lastOptions = mockUseGetEventsQuery.mock.calls.at(-1)?.[1] as { refetchOnMountOrArgChange?: boolean }
        expect(lastOptions.refetchOnMountOrArgChange).toBe(true)
      })

      it('should omit the date range so events outside the visible window still count', () => {
        render(<AllExperiences />)

        fireEvent.click(screen.getByTestId('tab-my'))

        const lastCall = mockUseGetEventsQuery.mock.calls.at(-1)?.[0] as { from?: string; to?: string }
        expect(lastCall.from).toBeUndefined()
        expect(lastCall.to).toBeUndefined()
      })

      it('should render the flat MyExperiencesGrid instead of the calendar columns', () => {
        render(<AllExperiences />)

        fireEvent.click(screen.getByTestId('tab-my'))

        expect(screen.getByTestId('my-experiences-grid')).toBeInTheDocument()
        expect(screen.queryByTestId('day-column')).not.toBeInTheDocument()
        expect(screen.queryByTestId('date-navigation')).not.toBeInTheDocument()
      })

      it('should hide events whose finish_at is already in the past', () => {
        render(<AllExperiences />)

        fireEvent.click(screen.getByTestId('tab-my'))

        expect(screen.getByTestId('my-experiences-grid')).toHaveAttribute('data-count', '2')
        const cardIds = screen.getAllByTestId('my-exp-grid-card').map(c => c.getAttribute('data-id'))
        expect(cardIds).not.toContain('mine-past')
      })

      it('should sort the upcoming my events by earliest start_at first', () => {
        render(<AllExperiences />)

        fireEvent.click(screen.getByTestId('tab-my'))

        const cards = screen.getAllByTestId('my-exp-grid-card')
        expect(cards[0]).toHaveAttribute('data-id', 'mine-soon')
        expect(cards[1]).toHaveAttribute('data-id', 'mine-later')
      })
    })

    describe('and "my" tab has no events', () => {
      beforeEach(() => {
        mockUseGetEventsQuery.mockReturnValue({ data: [], isLoading: false, isError: false })
      })

      it('should render the empty state and hide the grid', () => {
        render(<AllExperiences />)

        fireEvent.click(screen.getByTestId('tab-my'))

        expect(screen.getByTestId('my-experiences-empty')).toBeInTheDocument()
        expect(screen.queryByTestId('my-experiences-grid')).not.toBeInTheDocument()
        expect(screen.queryByTestId('day-column')).not.toBeInTheDocument()
      })
    })

    describe('and "my" tab has only past events', () => {
      beforeEach(() => {
        const events = [
          createMockEvent({
            id: 'mine-past',
            start_at: '2024-01-01T00:00:00Z',
            finish_at: '2024-01-01T02:00:00Z',
            user: '0xCreator'
          })
        ]
        mockUseGetEventsQuery.mockReturnValue({ data: events, isLoading: false, isError: false })
      })

      it('should render the empty state because no upcoming events remain after filtering', () => {
        render(<AllExperiences />)

        fireEvent.click(screen.getByTestId('tab-my'))

        expect(screen.getByTestId('my-experiences-empty')).toBeInTheDocument()
        expect(screen.queryByTestId('my-experiences-grid')).not.toBeInTheDocument()
      })
    })
  })
})
