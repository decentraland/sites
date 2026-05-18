import { fireEvent, render, screen } from '@testing-library/react'
import { createMockEvent } from '../../../__test-utils__/factories'
import type { EventEntry } from '../../../features/events'
import { Upcoming } from './Upcoming'

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: undefined, hasValidIdentity: false, address: undefined })
}))

const mockUseGetUpcomingEventsQuery = jest.fn()
jest.mock('../../../features/events', () => {
  const helpers = jest.requireActual('../../../features/events/events.helpers')
  return {
    useGetUpcomingEventsQuery: () => mockUseGetUpcomingEventsQuery(),
    isPubliclyVisibleEvent: helpers.isPubliclyVisibleEvent
  }
})

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
  MobileCarouselTrack: jest
    .requireActual<typeof import('react')>('react')
    .forwardRef(({ children, ...props }: React.HTMLAttributes<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) => (
      <div data-testid="mobile-track" ref={ref} {...props}>
        {children}
      </div>
    )),
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

  describe('when the response includes pending and rejected events', () => {
    beforeEach(() => {
      // The events API returns the caller's own non-approved events when authenticated. Issue #482:
      // those pending/rejected drafts must NOT leak into the public Upcoming carousel.
      mockUseGetUpcomingEventsQuery.mockReturnValue({
        data: [
          createMockEvent({ id: 'approved', name: 'Approved', approved: true, rejected: false }),
          createMockEvent({ id: 'pending', name: 'Pending', approved: false, rejected: false }),
          createMockEvent({ id: 'rejected', name: 'Rejected', approved: false, rejected: true })
        ]
      })
    })

    it('should render only the approved event', () => {
      render(<Upcoming />)

      const ids = screen.getAllByTestId('upcoming-card').map(card => card.getAttribute('data-id'))
      expect(ids).toEqual(expect.arrayContaining(['approved']))
      expect(ids).not.toEqual(expect.arrayContaining(['pending']))
      expect(ids).not.toEqual(expect.arrayContaining(['rejected']))
    })
  })

  describe('when every event is pending or rejected', () => {
    beforeEach(() => {
      mockUseGetUpcomingEventsQuery.mockReturnValue({
        data: [
          createMockEvent({ id: 'pending', name: 'Pending', approved: false, rejected: false }),
          createMockEvent({ id: 'rejected', name: 'Rejected', approved: false, rejected: true })
        ]
      })
    })

    it('should return null because nothing is visible', () => {
      const { container } = render(<Upcoming />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('when an event card is clicked', () => {
    it('should open the event detail modal', () => {
      mockUseGetUpcomingEventsQuery.mockReturnValue({ data: [createMockEvent({ id: 'ev-1', name: 'Event 1' })] })
      render(<Upcoming />)
      fireEvent.click(screen.getAllByTestId('upcoming-card')[0])
      expect(screen.getByTestId('event-detail-modal')).toBeInTheDocument()
    })
  })

  describe('when the user paginates the mobile carousel', () => {
    let clientWidthSpy: jest.SpyInstance
    let scrollLeftSpy: jest.SpyInstance
    let scrollToMock: jest.Mock

    beforeEach(() => {
      const events = Array.from({ length: 10 }, (_, i) => createMockEvent({ id: `ev-${i}`, name: `Event ${i}` }))
      mockUseGetUpcomingEventsQuery.mockReturnValue({ data: events })
      clientWidthSpy = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
      scrollLeftSpy = jest.spyOn(HTMLElement.prototype, 'scrollLeft', 'get').mockReturnValue(300)
      scrollToMock = jest.fn()
      HTMLElement.prototype.scrollTo = scrollToMock as unknown as HTMLElement['scrollTo']
    })

    afterEach(() => {
      clientWidthSpy.mockRestore()
      scrollLeftSpy.mockRestore()
    })

    it('should call scrollTo when a dot is clicked', () => {
      render(<Upcoming />)
      const dots = screen.getAllByTestId('pagination-dot')
      fireEvent.click(dots[1])
      expect(scrollToMock).toHaveBeenCalled()
    })

    it('should navigate via ArrowRight and ArrowLeft', () => {
      render(<Upcoming />)
      const dots = screen.getAllByTestId('pagination-dot')
      fireEvent.keyDown(dots[0], { key: 'ArrowRight' })
      fireEvent.keyDown(dots[0], { key: 'ArrowLeft' })
      fireEvent.keyDown(dots[0], { key: 'Enter' })
      expect(scrollToMock).toHaveBeenCalled()
    })

    it('should update the active page on scroll', () => {
      render(<Upcoming />)
      const track = screen.getByTestId('mobile-track')
      fireEvent.scroll(track)
      // Default active is 0; after scroll with clientWidth=300 and scrollLeft=300, index becomes 1
      const dots = screen.getAllByTestId('pagination-dot')
      expect(dots[1]).toHaveAttribute('data-active', 'true')
    })

    it('should bail when track clientWidth is zero so the first pagination dot stays active', () => {
      clientWidthSpy.mockReturnValue(0)
      render(<Upcoming />)
      const track = screen.getByTestId('mobile-track')
      fireEvent.scroll(track)
      const dots = screen.getAllByTestId('pagination-dot')
      expect(dots[0]).toHaveAttribute('data-active', 'true')
    })
  })
})
