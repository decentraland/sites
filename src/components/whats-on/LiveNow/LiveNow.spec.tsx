import React from 'react'
import { render, screen } from '@testing-library/react'
import { createMockLiveNowCard } from '../../../__test-utils__/factories'
import type { LiveNowCard } from '../../../features/whats-on-events'
import { LiveNow } from './LiveNow'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const mockUseGetLiveNowCardsQuery = jest.fn()
jest.mock('../../../features/whats-on-events', () => ({
  useGetLiveNowCardsQuery: (...args: unknown[]) => mockUseGetLiveNowCardsQuery(...args)
}))

const mockUseDocumentVisible = jest.fn(() => true)
jest.mock('../../../hooks/useDocumentVisible', () => ({
  useDocumentVisible: () => mockUseDocumentVisible()
}))

jest.mock('../../../hooks/useLiveNowQueryParams', () => ({
  useLiveNowQueryParams: () => undefined
}))

jest.mock('../EventDetailModal', () => ({
  EventDetailModal: () => <div data-testid="event-detail-modal" />,
  normalizeLiveNowCard: jest.fn()
}))

jest.mock('./LiveNowCardItem', () => ({
  LiveNowCardItem: ({ card, onClick }: { card: LiveNowCard; onClick: (card: LiveNowCard) => void }) => (
    <div data-testid="live-now-card" data-id={card.id} onClick={() => onClick(card)}>
      {card.title}
    </div>
  )
}))

jest.mock('./LiveNow.styled', () => ({
  LiveNowSection: ({ children }: { children: React.ReactNode }) => <section data-testid="live-now-section">{children}</section>,
  LiveNowHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="live-now-header">{children}</div>,
  LiveNowIcon: () => <span data-testid="live-now-icon" />,
  LiveNowTitle: ({ children }: { children: React.ReactNode }) => <h5 data-testid="live-now-title">{children}</h5>,
  CarouselWrapper: jest
    .requireActual<typeof React>('react')
    .forwardRef(
      (
        { children, fadeLeft: _fadeLeft, fadeRight: _fadeRight, hasScroll: _hasScroll, ...props }: Record<string, unknown>,
        ref: React.Ref<HTMLDivElement>
      ) => (
        <div data-testid="carousel-wrapper" ref={ref} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
          {children as React.ReactNode}
        </div>
      )
    ),
  ChevronLayer: ({ children }: { children: React.ReactNode }) => <div data-testid="chevron-layer">{children}</div>,
  ChevronButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { side: string }) => (
    <button data-testid={`chevron-${props.side}`} {...props}>
      {children}
    </button>
  ),
  LiveNowGrid: ({ children }: { children: React.ReactNode }) => <div data-testid="live-now-grid">{children}</div>
}))

jest.mock('../common/PaginationDots.styled', () => ({
  PaginationDots: ({ children }: { children: React.ReactNode }) => <div data-testid="pagination-dots">{children}</div>,
  PaginationDot: (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) => (
    <button data-testid="pagination-dot" {...props} />
  )
}))

jest.mock('@mui/icons-material/ChevronLeft', () => ({
  __esModule: true,
  default: () => <span>{'<'}</span>
}))

jest.mock('@mui/icons-material/ChevronRight', () => ({
  __esModule: true,
  default: () => <span>{'>'}</span>
}))

function createMockCard(id: string, title: string) {
  return createMockLiveNowCard({ id, title })
}

describe('LiveNow', () => {
  beforeEach(() => {
    mockUseDocumentVisible.mockReturnValue(true)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when there are no cards', () => {
    beforeEach(() => {
      mockUseGetLiveNowCardsQuery.mockReturnValue({ data: [] })
    })

    it('should return null', () => {
      const { container } = render(<LiveNow />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('when there is at least one card and the document is visible', () => {
    beforeEach(() => {
      mockUseGetLiveNowCardsQuery.mockReturnValue({ data: [createMockCard('card-1', 'Event 1')] })
      mockUseDocumentVisible.mockReturnValue(true)
    })

    it('should poll every 60 seconds', () => {
      render(<LiveNow />)

      const lastCall = mockUseGetLiveNowCardsQuery.mock.calls[0]
      expect(lastCall[1]).toEqual({ pollingInterval: 60_000 })
    })
  })

  describe('when there is at least one card and the document is hidden', () => {
    beforeEach(() => {
      mockUseGetLiveNowCardsQuery.mockReturnValue({ data: [createMockCard('card-1', 'Event 1')] })
      mockUseDocumentVisible.mockReturnValue(false)
    })

    it('should pause polling by passing a 0 polling interval', () => {
      render(<LiveNow />)

      const lastCall = mockUseGetLiveNowCardsQuery.mock.calls[0]
      expect(lastCall[1]).toEqual({ pollingInterval: 0 })
    })
  })

  describe('when there are cards', () => {
    let cards: LiveNowCard[]

    beforeEach(() => {
      cards = [createMockCard('card-1', 'Event 1'), createMockCard('card-2', 'Event 2')]
      mockUseGetLiveNowCardsQuery.mockReturnValue({ data: cards })
    })

    it('should render the live now section', () => {
      render(<LiveNow />)

      expect(screen.getByTestId('live-now-section')).toBeInTheDocument()
    })

    it('should render the title', () => {
      render(<LiveNow />)

      expect(screen.getByTestId('live-now-title')).toHaveTextContent('live_now.title')
    })

    it('should render the live now cards', () => {
      render(<LiveNow />)

      const cardItems = screen.getAllByTestId('live-now-card')
      expect(cardItems).toHaveLength(2)
    })

    it('should render the event detail modal', () => {
      render(<LiveNow />)

      expect(screen.getByTestId('event-detail-modal')).toBeInTheDocument()
    })

    it('should render the carousel wrapper', () => {
      render(<LiveNow />)

      expect(screen.getByTestId('carousel-wrapper')).toBeInTheDocument()
    })
  })

  describe('when query returns undefined data', () => {
    beforeEach(() => {
      mockUseGetLiveNowCardsQuery.mockReturnValue({ data: undefined })
    })

    it('should return null since default is empty array', () => {
      const { container } = render(<LiveNow />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('when a single card renders with a tiny phantom scroll overflow', () => {
    let scrollWidthSpy: jest.SpyInstance
    let clientWidthSpy: jest.SpyInstance

    beforeEach(() => {
      mockUseGetLiveNowCardsQuery.mockReturnValue({ data: [createMockCard('card-1', 'Event 1')] })
      scrollWidthSpy = jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(321)
      clientWidthSpy = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(320)
    })

    afterEach(() => {
      scrollWidthSpy.mockRestore()
      clientWidthSpy.mockRestore()
    })

    it('should not render pagination dots when overflow is within the tolerance threshold', () => {
      render(<LiveNow />)

      expect(screen.queryByTestId('pagination-dots')).not.toBeInTheDocument()
    })
  })

  describe('when multiple cards overflow the viewport meaningfully', () => {
    let scrollWidthSpy: jest.SpyInstance
    let clientWidthSpy: jest.SpyInstance

    beforeEach(() => {
      mockUseGetLiveNowCardsQuery.mockReturnValue({
        data: [createMockCard('card-1', 'Event 1'), createMockCard('card-2', 'Event 2'), createMockCard('card-3', 'Event 3')]
      })
      scrollWidthSpy = jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(900)
      clientWidthSpy = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
    })

    afterEach(() => {
      scrollWidthSpy.mockRestore()
      clientWidthSpy.mockRestore()
    })

    it('should render pagination dots for each scrollable page', () => {
      render(<LiveNow />)

      expect(screen.getAllByTestId('pagination-dot')).toHaveLength(3)
    })
  })
})
