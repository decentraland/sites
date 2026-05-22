import { forwardRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMockEvent } from '../../../__test-utils__/factories'
import { DayColumn } from './DayColumn'

jest.mock('./DayColumn.styled', () => ({
  DayColumnContainer: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="day-column-container" role={props.role as string} aria-label={props['aria-label'] as string}>
      {children as React.ReactNode}
    </div>
  ),
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
      const events = [createMockEvent({ id: 'e1', name: 'Event 1' })]
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

  describe('when the user drags the scroll area', () => {
    let scrollHeightSpy: jest.SpyInstance
    let clientHeightSpy: jest.SpyInstance

    beforeEach(() => {
      scrollHeightSpy = jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(800)
      clientHeightSpy = jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400)
    })

    afterEach(() => {
      scrollHeightSpy.mockRestore()
      clientHeightSpy.mockRestore()
    })

    it('should hide the filler when content overflows the scroll area', () => {
      render(
        <DayColumn
          events={[createMockEvent({ id: 'e1', name: 'Event 1' })]}
          isLoading={false}
          dateLabel="Today"
          renderCard={mockRenderCard}
        />
      )
      expect(screen.queryByTestId('column-filler')).not.toBeInTheDocument()
    })

    it('should update scrollTop while dragging vertically', () => {
      const setSpy = jest.spyOn(HTMLElement.prototype, 'scrollTop', 'set')
      const getSpy = jest.spyOn(HTMLElement.prototype, 'scrollTop', 'get').mockReturnValue(200)
      try {
        render(
          <DayColumn
            events={[createMockEvent({ id: 'e1', name: 'Event 1' })]}
            isLoading={false}
            dateLabel="Today"
            renderCard={mockRenderCard}
          />
        )
        const area = screen.getByTestId('card-scroll-area')
        fireEvent.mouseDown(area, { clientY: 100 })
        const callsBefore = setSpy.mock.calls.length
        fireEvent.mouseMove(area, { clientY: 50 })
        fireEvent.mouseUp(area)
        // scrollTop should be assigned during the drag (startY=100, current=50, walk=-50, scrollTop=200-(-50)=250)
        expect(setSpy.mock.calls.length).toBeGreaterThan(callsBefore)
        expect(setSpy).toHaveBeenCalledWith(250)
      } finally {
        setSpy.mockRestore()
        getSpy.mockRestore()
      }
    })

    it('should bail out of mouseMove when no drag is in progress', () => {
      const setSpy = jest.spyOn(HTMLElement.prototype, 'scrollTop', 'set')
      try {
        render(<DayColumn events={[]} isLoading={false} dateLabel="Today" renderCard={mockRenderCard} />)
        const area = screen.getByTestId('card-scroll-area')
        const callsBefore = setSpy.mock.calls.length
        fireEvent.mouseMove(area, { clientY: 100 })
        fireEvent.mouseLeave(area)
        expect(setSpy.mock.calls.length).toBe(callsBefore)
      } finally {
        setSpy.mockRestore()
      }
    })
  })
})
