import { fireEvent, render, screen } from '@testing-library/react'
import { createMockEvent } from '../../../__test-utils__/factories'
import { MyExperiencesGrid } from './MyExperiencesGrid'

jest.mock('./MyExperiencesGrid.styled', () => ({
  GridPanel: ({ children }: { children: React.ReactNode }) => <div data-testid="grid-panel">{children}</div>,
  GridTitle: ({ children }: { children: React.ReactNode }) => <h6 data-testid="grid-title">{children}</h6>,
  CardGrid: ({ children }: { children: React.ReactNode }) => <div data-testid="card-grid">{children}</div>
}))

jest.mock('../PendingEventCard', () => ({
  PendingEventCard: ({ event, onClick }: { event: { id: string }; onClick: (event: { id: string }) => void }) => (
    <button data-testid="pending-card" data-id={event.id} onClick={() => onClick(event)} type="button">
      {event.id}
    </button>
  )
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'my_hangouts.hosted_by_me' ? 'Hosted by me' : key)
  })
}))

describe('MyExperiencesGrid', () => {
  describe('when rendering a list of events', () => {
    it('should render the "Hosted by me" title', () => {
      render(<MyExperiencesGrid events={[createMockEvent({ id: 'a' })]} onCardClick={jest.fn()} />)

      expect(screen.getByTestId('grid-title')).toHaveTextContent('Hosted by me')
    })

    it('should render one PendingEventCard per event', () => {
      const events = [createMockEvent({ id: 'a' }), createMockEvent({ id: 'b' }), createMockEvent({ id: 'c' })]
      render(<MyExperiencesGrid events={events} onCardClick={jest.fn()} />)

      expect(screen.getAllByTestId('pending-card')).toHaveLength(3)
    })
  })

  describe('when a card is clicked', () => {
    it('should invoke onCardClick with the event', () => {
      const onCardClick = jest.fn()
      const event = createMockEvent({ id: 'target' })
      render(<MyExperiencesGrid events={[event]} onCardClick={onCardClick} />)

      fireEvent.click(screen.getByTestId('pending-card'))

      expect(onCardClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'target' }))
    })
  })

  describe('when the list is empty', () => {
    it('should still render the title without any cards', () => {
      render(<MyExperiencesGrid events={[]} onCardClick={jest.fn()} />)

      expect(screen.getByTestId('grid-title')).toBeInTheDocument()
      expect(screen.queryByTestId('pending-card')).not.toBeInTheDocument()
    })
  })
})
