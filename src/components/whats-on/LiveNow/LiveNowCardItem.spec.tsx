import { fireEvent, render, screen } from '@testing-library/react'
import { createMockLiveNowCard } from '../../../__test-utils__/factories'
import type { LiveNowCard } from '../../../features/events'
import { LiveNowCardItem } from './LiveNowCardItem'

const VALID_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../../../features/profile/profile.client', () => ({
  useGetProfileQuery: () => ({ data: null, isLoading: true })
}))

jest.mock('./LiveNowCard', () => ({
  LiveNowCard: ({
    card,
    creatorName,
    creatorFaceUrl,
    creatorBackgroundColor,
    eager,
    onClick
  }: {
    card: { title: string; type: string; users: number }
    creatorName?: string
    creatorFaceUrl?: string
    creatorBackgroundColor?: string
    eager?: boolean
    onClick: (card: unknown) => void
  }) => (
    <div
      data-testid="live-now-card"
      data-scene={card.title}
      data-type={card.type}
      data-users={card.users}
      data-creator-name={creatorName ?? ''}
      data-creator-face={creatorFaceUrl ?? ''}
      data-creator-background={creatorBackgroundColor ?? ''}
      data-eager={eager ? 'true' : 'false'}
      onClick={() => onClick(card)}
    />
  )
}))

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

    it('should forward the creator name from the card data while the catalyst profile is still loading', () => {
      render(<LiveNowCardItem card={createMockCard()} onClick={mockOnClick} />)

      expect(screen.getByTestId('live-now-card')).toHaveAttribute('data-creator-name', 'CreatorName')
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

  describe('when the card has neither creatorName nor creatorAddress', () => {
    it('should fall back to the unknown translation key', () => {
      render(
        <LiveNowCardItem
          card={createMockCard({ type: 'place', creatorAddress: undefined, creatorName: undefined })}
          onClick={mockOnClick}
        />
      )

      const card = screen.getByTestId('live-now-card')
      expect(card).toHaveAttribute('data-creator-name', 'live_now.unknown_creator')
      expect(card).toHaveAttribute('data-creator-face', '')
    })
  })

  describe('when the card has only a creatorName (no address)', () => {
    it('should forward the name without requesting a profile face', () => {
      render(<LiveNowCardItem card={createMockCard({ creatorAddress: undefined, creatorName: 'NamedOnly' })} onClick={mockOnClick} />)

      const card = screen.getByTestId('live-now-card')
      expect(card).toHaveAttribute('data-creator-name', 'NamedOnly')
      expect(card).toHaveAttribute('data-creator-face', '')
    })
  })

  describe('when the card has only a wallet-shaped creatorAddress', () => {
    it('should render the shortened address as the creator name', () => {
      render(<LiveNowCardItem card={createMockCard({ creatorName: undefined })} onClick={mockOnClick} />)

      expect(screen.getByTestId('live-now-card')).toHaveAttribute('data-creator-name', '0xaaaa…aaaa')
    })
  })

  describe('when the card is Genesis Plaza', () => {
    it('should mark the background color as the Foundation brand violet so the DCL logo reads as official', () => {
      render(<LiveNowCardItem card={createMockCard({ isGenesisPlaza: true, creatorName: undefined })} onClick={mockOnClick} />)

      expect(screen.getByTestId('live-now-card')).toHaveAttribute('data-creator-background', '#9d76e3')
    })

    it('should label the avatar as Decentraland Foundation based on the isGenesisPlaza flag, not the title', () => {
      // The card carries isGenesisPlaza=true from buildLiveNowCards; title changes
      // should not alter the logo-override behavior.
      render(
        <LiveNowCardItem
          card={createMockCard({ title: 'Any Plaza Rebrand', isGenesisPlaza: true, creatorName: undefined })}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByTestId('live-now-card')).toHaveAttribute('data-creator-name', 'Decentraland Foundation')
    })

    it('should use the DCL logo as the creator face', () => {
      render(<LiveNowCardItem card={createMockCard({ isGenesisPlaza: true, creatorName: undefined })} onClick={mockOnClick} />)

      expect(screen.getByTestId('live-now-card').getAttribute('data-creator-face')).toMatch(/\/dcl-logo\.svg$/)
    })
  })

  describe('when rendered as the first card (eager)', () => {
    it('should mark the card as eager so the LCP image uses fetchpriority=high', () => {
      render(<LiveNowCardItem card={createMockCard()} onClick={mockOnClick} eager />)

      expect(screen.getByTestId('live-now-card')).toHaveAttribute('data-eager', 'true')
    })
  })
})
