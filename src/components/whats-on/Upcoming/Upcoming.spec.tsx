import { render, screen } from '@testing-library/react'
import { createMockEvent } from '../../../__test-utils__/factories'
import type { EventEntry } from '../../../features/whats-on-events'
import { Upcoming } from './Upcoming'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: undefined, hasValidIdentity: false, address: undefined })
}))

const mockUseGetUpcomingEventsQuery = jest.fn()
jest.mock('../../../features/whats-on-events', () => ({
  useGetUpcomingEventsQuery: () => mockUseGetUpcomingEventsQuery()
}))

jest.mock('../EventDetailModal', () => ({
  EventDetailModal: () => <div data-testid="event-detail-modal" />,
  normalizeEventEntry: jest.fn()
}))

jest.mock('./UpcomingCard', () => ({
  UpcomingCard: ({ event, onClick }: { event: EventEntry; onClick: (event: EventEntry) => void }) => (
    <div data-testid="upcoming-card" data-id={event.id} onClick={() => onClick(event)}>
      {event.name}
    </div>
  )
}))

jest.mock('./Upcoming.styled', () => ({
  UpcomingSection: ({ children }: { children: React.ReactNode }) => <section data-testid="upcoming-section">{children}</section>,
  UpcomingTitle: ({ children }: { children: React.ReactNode }) => <h5 data-testid="upcoming-title">{children}</h5>,
  DesktopGrid: ({ children }: { children: React.ReactNode }) => <div data-testid="desktop-grid">{children}</div>,
  MobileCarousel: ({ children }: { children: React.ReactNode }) => <div data-testid="mobile-carousel">{children}</div>,
  MobileCarouselTrack: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="mobile-track" {...props}>
      {children}
    </div>
  ),
  MobileCarouselPage: ({ children }: { children: React.ReactNode }) => <div data-testid="mobile-page">{children}</div>
}))

jest.mock('../common/PaginationDots.styled', () => ({
  PaginationDots: ({ children }: { children: React.ReactNode }) => <div data-testid="pagination-dots">{children}</div>,
  PaginationDot: (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) => (
    <button data-testid="pagination-dot" data-active={props.active} {...props} />
  )
}))

// removed — using shared createMockEvent from __test-utils__/factories

describe('Upcoming', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when there are no events', () => {
    beforeEach(() => {
      mockUseGetUpcomingEventsQuery.mockReturnValue({ data: [] })
    })

    it('should return null', () => {
      const { container } = render(<Upcoming />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('when there are events', () => {
    let events: EventEntry[]

    beforeEach(() => {
      events = [
        createMockEvent({ id: 'ev-1', name: 'Event 1' }),
        createMockEvent({ id: 'ev-2', name: 'Event 2' }),
        createMockEvent({ id: 'ev-3', name: 'Event 3' })
      ]
      mockUseGetUpcomingEventsQuery.mockReturnValue({ data: events })
    })

    it('should render the upcoming section', () => {
      render(<Upcoming />)

      expect(screen.getByTestId('upcoming-section')).toBeInTheDocument()
    })

    it('should render the title', () => {
      render(<Upcoming />)

      expect(screen.getByTestId('upcoming-title')).toHaveTextContent('upcoming.title')
    })

    it('should render the desktop grid with all events', () => {
      render(<Upcoming />)

      const desktopGrid = screen.getByTestId('desktop-grid')
      expect(desktopGrid).toBeInTheDocument()
    })

    it('should render the event detail modal', () => {
      render(<Upcoming />)

      expect(screen.getByTestId('event-detail-modal')).toBeInTheDocument()
    })

    it('should render event cards', () => {
      render(<Upcoming />)

      const cards = screen.getAllByTestId('upcoming-card')
      expect(cards.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('when query returns undefined data', () => {
    beforeEach(() => {
      mockUseGetUpcomingEventsQuery.mockReturnValue({ data: undefined })
    })

    it('should return null since default is empty array', () => {
      const { container } = render(<Upcoming />)

      expect(container.firstChild).toBeNull()
    })
  })
})
