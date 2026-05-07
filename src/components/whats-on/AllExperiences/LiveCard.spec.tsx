import { fireEvent, render, screen } from '@testing-library/react'
import { createMockEvent } from '../../../__test-utils__/factories'
import { LiveCard } from './LiveCard'

jest.mock('../../../features/social/profile/profile.client', () => ({
  useGetProfileQuery: () => ({ data: null })
}))

jest.mock('decentraland-ui2', () => ({
  BadgeGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="badge-group">{children}</div>,
  EventCard: ({ sceneName, onClick, leftBadge }: { sceneName: string; onClick?: () => void; leftBadge?: React.ReactNode }) => (
    <div data-testid="event-card" onClick={onClick}>
      {sceneName}
      {leftBadge}
    </div>
  ),
  LiveBadge: () => <span data-testid="live-badge" />,
  UserCountBadge: ({ count }: { count: number }) => <span data-testid="user-count-badge">{count}</span>
}))

jest.mock('./AllExperiencesCard.styled', () => ({
  LiveCardWrapper: ({ children }: { children: React.ReactNode }) => <div data-testid="live-card-wrapper">{children}</div>
}))

describe('LiveCard', () => {
  let mockOnClick: jest.Mock

  beforeEach(() => {
    mockOnClick = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered with a live event', () => {
    let event: ReturnType<typeof createMockEvent>

    beforeEach(() => {
      event = createMockEvent({ name: 'Live Party', live: true, total_attendees: 42 })
    })

    it('should render EventCard with the event name', () => {
      render(<LiveCard event={event} onClick={mockOnClick} />)

      expect(screen.getByTestId('event-card')).toHaveTextContent('Live Party')
    })

    it('should render a LiveBadge', () => {
      render(<LiveCard event={event} onClick={mockOnClick} />)

      expect(screen.getByTestId('live-badge')).toBeInTheDocument()
    })

    it('should render a UserCountBadge with the attendee count', () => {
      render(<LiveCard event={event} onClick={mockOnClick} />)

      expect(screen.getByTestId('user-count-badge')).toHaveTextContent('42')
    })

    it('should wrap the card in LiveCardWrapper', () => {
      render(<LiveCard event={event} onClick={mockOnClick} />)

      expect(screen.getByTestId('live-card-wrapper')).toBeInTheDocument()
    })
  })

  describe('when the card is clicked', () => {
    let event: ReturnType<typeof createMockEvent>

    beforeEach(() => {
      event = createMockEvent({ live: true })
    })

    it('should call onClick with the event', () => {
      render(<LiveCard event={event} onClick={mockOnClick} />)

      fireEvent.click(screen.getByTestId('event-card'))
      expect(mockOnClick).toHaveBeenCalledWith(event)
    })
  })
})
