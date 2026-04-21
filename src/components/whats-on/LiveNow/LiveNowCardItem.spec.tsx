import { fireEvent, render, screen } from '@testing-library/react'
import { createMockLiveNowCard } from '../../../__test-utils__/factories'
import type { LiveNowCard } from '../../../features/whats-on-events'
import { LiveNowCardItem } from './LiveNowCardItem'

jest.mock('./LiveNowCard', () => ({
  LiveNowCard: ({
    card,
    avatar,
    eager,
    onClick
  }: {
    card: { title: string; type: string; users: number }
    avatar?: { name: string; ethAddress: string }
    eager?: boolean
    onClick: (card: unknown) => void
  }) => (
    <div
      data-testid="live-now-card"
      data-scene={card.title}
      data-type={card.type}
      data-users={card.users}
      data-avatar-name={avatar?.name ?? ''}
      data-avatar-address={avatar?.ethAddress ?? ''}
      data-eager={eager ? 'true' : 'false'}
      onClick={() => onClick(card)}
    />
  )
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
    it('should render the live now card', () => {
      render(<LiveNowCardItem card={createMockCard()} onClick={mockOnClick} />)

      expect(screen.getByTestId('live-now-card')).toBeInTheDocument()
    })

    it('should forward the event title to the card', () => {
      render(<LiveNowCardItem card={createMockCard()} onClick={mockOnClick} />)

      expect(screen.getByTestId('live-now-card')).toHaveAttribute('data-scene', 'Test Event')
    })

    it('should build the avatar from the creator address + name without hitting lambdas', () => {
      render(<LiveNowCardItem card={createMockCard()} onClick={mockOnClick} />)

      const card = screen.getByTestId('live-now-card')
      expect(card).toHaveAttribute('data-avatar-name', 'CreatorName')
      expect(card).toHaveAttribute('data-avatar-address', '0xCreator')
    })
  })

  describe('when the card is clicked', () => {
    it('should call onClick with the card', () => {
      const card = createMockCard()
      render(<LiveNowCardItem card={card} onClick={mockOnClick} />)

      fireEvent.click(screen.getByTestId('live-now-card'))

      expect(mockOnClick).toHaveBeenCalledWith(card)
    })
  })

  describe('when the card is a place type (non-genesis, no creator)', () => {
    it('should render without an avatar', () => {
      render(
        <LiveNowCardItem
          card={createMockCard({ type: 'place', creatorAddress: undefined, creatorName: undefined })}
          onClick={mockOnClick}
        />
      )

      const card = screen.getByTestId('live-now-card')
      expect(card).toHaveAttribute('data-avatar-name', '')
      expect(card).toHaveAttribute('data-avatar-address', '')
    })
  })

  describe('when the card is Genesis Plaza', () => {
    it('should label the avatar as Decentraland Foundation', () => {
      render(
        <LiveNowCardItem
          card={createMockCard({ title: 'Genesis Plaza', isGenesisPlaza: true, creatorName: undefined })}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByTestId('live-now-card')).toHaveAttribute('data-avatar-name', 'Decentraland Foundation')
    })
  })

  describe('when rendered as the first card (eager)', () => {
    it('should mark the card as eager so the LCP image uses fetchpriority=high', () => {
      render(<LiveNowCardItem card={createMockCard()} onClick={mockOnClick} eager />)

      expect(screen.getByTestId('live-now-card')).toHaveAttribute('data-eager', 'true')
    })
  })
})
