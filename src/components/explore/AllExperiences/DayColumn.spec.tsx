import { forwardRef } from 'react'
import { render, screen } from '@testing-library/react'
import { createMockEvent } from '../../../__test-utils__/factories'
import { DayColumn } from './DayColumn'

jest.mock('./DayColumn.styled', () => ({
  DayColumnContainer: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="day-column-container" role={props.role as string} aria-label={props['aria-label'] as string}>
      {children as React.ReactNode}
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CardScrollArea: forwardRef(({ children, ...props }: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) => (
    <div data-testid="card-scroll-area" ref={ref} {...props}>
      {children as React.ReactNode}
    </div>
  )),
  ColumnFiller: (props: Record<string, unknown>) => <div data-testid="column-filler" aria-hidden={props['aria-hidden'] as boolean} />,
  SkeletonCard: (props: Record<string, unknown>) => <div data-testid="skeleton-card" aria-hidden={props['aria-hidden'] as boolean} />
}))

describe('DayColumn', () => {
  let mockRenderCard: jest.Mock

  beforeEach(() => {
    mockRenderCard = jest.fn((event: { id: string; name: string }) => <div data-testid={`card-${event.id}`}>{event.name}</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when loading', () => {
    it('should render skeleton cards', () => {
      render(<DayColumn events={[]} isLoading={true} dateLabel="Today" renderCard={mockRenderCard} />)

      expect(screen.getAllByTestId('skeleton-card')).toHaveLength(3)
    })

    it('should not render event cards', () => {
      let events: ReturnType<typeof createMockEvent>[]
      events = [createMockEvent({ id: 'e1', name: 'Event 1' })]
      render(<DayColumn events={events} isLoading={true} dateLabel="Today" renderCard={mockRenderCard} />)

      expect(screen.queryByTestId('card-e1')).not.toBeInTheDocument()
    })
  })

  describe('when loaded with events', () => {
    let events: ReturnType<typeof createMockEvent>[]

    beforeEach(() => {
      events = [createMockEvent({ id: 'e1', name: 'Event 1' }), createMockEvent({ id: 'e2', name: 'Event 2' })]
    })

    it('should render each event card', () => {
      render(<DayColumn events={events} isLoading={false} dateLabel="Today" renderCard={mockRenderCard} />)

      expect(screen.getByTestId('card-e1')).toBeInTheDocument()
      expect(screen.getByTestId('card-e2')).toBeInTheDocument()
    })

    it('should call renderCard for each event', () => {
      render(<DayColumn events={events} isLoading={false} dateLabel="Today" renderCard={mockRenderCard} />)

      expect(mockRenderCard).toHaveBeenCalledTimes(2)
    })

    it('should render the column filler below the cards', () => {
      render(<DayColumn events={events} isLoading={false} dateLabel="Today" renderCard={mockRenderCard} />)

      expect(screen.getByTestId('column-filler')).toBeInTheDocument()
    })
  })

  describe('when loaded with no events', () => {
    it('should render the column filler', () => {
      render(<DayColumn events={[]} isLoading={false} dateLabel="Today" renderCard={mockRenderCard} />)

      expect(screen.getByTestId('column-filler')).toBeInTheDocument()
    })
  })

  describe('when checking accessibility attributes', () => {
    it('should set role="list" on the container', () => {
      render(<DayColumn events={[]} isLoading={false} dateLabel="Today" renderCard={mockRenderCard} />)

      expect(screen.getByTestId('day-column-container')).toHaveAttribute('role', 'list')
    })

    it('should set aria-label from dateLabel prop', () => {
      render(<DayColumn events={[]} isLoading={false} dateLabel="Tuesday, September 15, 2026" renderCard={mockRenderCard} />)

      expect(screen.getByTestId('day-column-container')).toHaveAttribute('aria-label', 'Tuesday, September 15, 2026')
    })
  })
})
