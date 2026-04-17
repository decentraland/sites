import { fireEvent, render, screen } from '@testing-library/react'
import { createMockEvent } from '../../__test-utils__/factories'
import { AllExperiencesCard } from './AllExperiencesCard'

jest.mock('./LiveCard', () => ({
  LiveCard: ({ event, onClick }: { event: { id: string; name: string }; onClick: (e: unknown) => void }) => (
    <div data-testid="live-card" onClick={() => onClick(event)}>
      {event.name}
    </div>
  )
}))

jest.mock('./FutureCard', () => ({
  FutureCard: ({ event, onClick }: { event: { id: string; name: string }; onClick: (e: unknown) => void }) => (
    <div data-testid="future-card" onClick={() => onClick(event)}>
      {event.name}
    </div>
  )
}))

describe('AllExperiencesCard', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the event is live', () => {
    let event: ReturnType<typeof createMockEvent>
    let mockOnClick: jest.Mock

    beforeEach(() => {
      event = createMockEvent({ live: true })
      mockOnClick = jest.fn()
    })

    it('should render LiveCard', () => {
      render(<AllExperiencesCard event={event} onClick={mockOnClick} />)

      expect(screen.getByTestId('live-card')).toBeInTheDocument()
      expect(screen.queryByTestId('future-card')).not.toBeInTheDocument()
    })

    it('should forward the onClick handler', () => {
      render(<AllExperiencesCard event={event} onClick={mockOnClick} />)

      fireEvent.click(screen.getByTestId('live-card'))
      expect(mockOnClick).toHaveBeenCalledWith(event)
    })
  })

  describe('when the event is not live', () => {
    let event: ReturnType<typeof createMockEvent>
    let mockOnClick: jest.Mock

    beforeEach(() => {
      event = createMockEvent({ live: false })
      mockOnClick = jest.fn()
    })

    it('should render FutureCard', () => {
      render(<AllExperiencesCard event={event} onClick={mockOnClick} />)

      expect(screen.getByTestId('future-card')).toBeInTheDocument()
      expect(screen.queryByTestId('live-card')).not.toBeInTheDocument()
    })

    it('should forward the onClick handler', () => {
      render(<AllExperiencesCard event={event} onClick={mockOnClick} />)

      fireEvent.click(screen.getByTestId('future-card'))
      expect(mockOnClick).toHaveBeenCalledWith(event)
    })
  })
})
