import { fireEvent, render, screen } from '@testing-library/react'
import { createMockLiveNowCard } from '../../../__test-utils__/factories'
import type { LiveNowCard } from '../../../features/whats-on-events'
import { LiveNowCardItem } from './LiveNowCardItem'

const VALID_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

jest.mock('./LiveNowCard', () => ({
  LiveNowCard: ({
    card,
    avatar,
    eager,
    onClick
  }: {
    card: { title: string; type: string; users: number }
    avatar?: { name: string; ethAddress: string; avatar?: { snapshots?: { face256?: string } } }
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
      data-avatar-face={avatar?.avatar?.snapshots?.face256 ?? ''}
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
    creatorAddress: VALID_ADDRESS,
    creatorName: 'CreatorName',
    ...overrides
  })
}

describe('LiveNowCardItem', () => {
  let mockOnClick: jest.Mock
  let originalFetch: typeof fetch

  beforeEach(() => {
    mockOnClick = jest.fn()
    originalFetch = global.fetch
    ;(global as unknown as { fetch: typeof fetch }).fetch = jest.fn(() => new Promise<Response>(() => undefined))
  })

  afterEach(() => {
    ;(global as unknown as { fetch: typeof fetch }).fetch = originalFetch
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
      expect(card).toHaveAttribute('data-avatar-address', VALID_ADDRESS)
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

  describe('when the card is a place type (no creator)', () => {
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

  describe('when the card has only a creatorName (no address)', () => {
    it('should build an avatar with a valid snapshots stub so AvatarFace does not crash reading face256', () => {
      render(<LiveNowCardItem card={createMockCard({ creatorAddress: undefined, creatorName: 'NamedOnly' })} onClick={mockOnClick} />)

      const card = screen.getByTestId('live-now-card')
      expect(card).toHaveAttribute('data-avatar-name', 'NamedOnly')
      // The regression: previously this was missing the snapshots stub and threw.
      expect(card).toHaveAttribute('data-avatar-face', '')
    })
  })

  describe('when the card is Genesis Plaza', () => {
    it('should label the avatar as Decentraland Foundation based on the isGenesisPlaza flag, not the title', () => {
      // The card carries isGenesisPlaza=true from buildLiveNowCards; title changes
      // should not alter the logo-override behavior.
      render(
        <LiveNowCardItem
          card={createMockCard({ title: 'Any Plaza Rebrand', isGenesisPlaza: true, creatorName: undefined })}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByTestId('live-now-card')).toHaveAttribute('data-avatar-name', 'Decentraland Foundation')
    })

    it('should use the DCL logo as face for the avatar', () => {
      render(<LiveNowCardItem card={createMockCard({ isGenesisPlaza: true, creatorName: undefined })} onClick={mockOnClick} />)

      expect(screen.getByTestId('live-now-card').getAttribute('data-avatar-face')).toMatch(/\/dcl-logo\.svg$/)
    })
  })

  describe('when rendered as the first card (eager)', () => {
    it('should mark the card as eager so the LCP image uses fetchpriority=high', () => {
      render(<LiveNowCardItem card={createMockCard()} onClick={mockOnClick} eager />)

      expect(screen.getByTestId('live-now-card')).toHaveAttribute('data-eager', 'true')
    })
  })
})
