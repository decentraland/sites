import { fireEvent, render, screen } from '@testing-library/react'
import { createMockLiveNowCard } from '../../__test-utils__/factories'
import type { LiveNowCard } from '../../features/events'
import { LiveNowCardItem } from './LiveNowCardItem'

jest.mock('../../features/profile/profile.client', () => ({
  useGetProfileQuery: () => ({ data: undefined })
}))

jest.mock('decentraland-ui2', () => ({
  EventCard: ({
    sceneName,
    onClick,
    leftBadge
  }: {
    image: string
    sceneName: string
    coordinates: string
    avatar?: unknown
    onClick: () => void
    leftBadge: React.ReactNode
    leftBadgeTransparent?: boolean
    hideLocation?: boolean
  }) => (
    <div data-testid="event-card" data-scene={sceneName} onClick={onClick}>
      {leftBadge}
    </div>
  ),
  BadgeGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="badge-group">{children}</div>,
  LiveBadge: () => <span data-testid="live-badge" />,
  UserCountBadge: ({ count }: { count: number }) => <span data-testid="user-count">{count}</span>
}))

jest.mock('@dcl/schemas', () => ({}))

function createMockCard(overrides: Partial<LiveNowCard> = {}) {
  return createMockLiveNowCard({
    title: 'Test Event',
    image: 'https://example.com/img.png',
    creatorAddress: '0xCreator',
    creatorName: 'CreatorName',
    ...overrides
  })
}

describe('LiveNowCardItem', () => {
  let mockOnClick: jest.Mock

  beforeEach(() => {
    mockOnClick = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered with an event card', () => {
    it('should render the event card', () => {
      render(<LiveNowCardItem card={createMockCard()} onClick={mockOnClick} />)

      expect(screen.getByTestId('event-card')).toBeInTheDocument()
    })

    it('should show the live badge for event type', () => {
      render(<LiveNowCardItem card={createMockCard()} onClick={mockOnClick} />)

      expect(screen.getByTestId('live-badge')).toBeInTheDocument()
    })

    it('should show the user count', () => {
      render(<LiveNowCardItem card={createMockCard()} onClick={mockOnClick} />)

      expect(screen.getByTestId('user-count')).toHaveTextContent('15')
    })
  })

  describe('when the card is clicked', () => {
    it('should call onClick with the card', () => {
      render(<LiveNowCardItem card={createMockCard()} onClick={mockOnClick} />)

      fireEvent.click(screen.getByTestId('event-card'))

      expect(mockOnClick).toHaveBeenCalledWith(createMockCard())
    })
  })

  describe('when the card is a place type', () => {
    it('should not show the live badge', () => {
      render(<LiveNowCardItem card={createMockCard({ type: 'place' })} onClick={mockOnClick} />)

      expect(screen.queryByTestId('live-badge')).not.toBeInTheDocument()
    })
  })

  describe('when the card is Genesis Plaza', () => {
    it('should render the event card', () => {
      render(<LiveNowCardItem card={createMockCard({ title: 'Genesis Plaza', isGenesisPlaza: true })} onClick={mockOnClick} />)

      expect(screen.getByTestId('event-card')).toBeInTheDocument()
    })
  })
})
