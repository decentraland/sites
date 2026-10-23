import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExploreCardType } from '../../../features/events/events.discovery.types'
import type { ExploreItem } from '../../../features/events/events.discovery.types'
import type { HomeDetailSelection } from '../HomeDetailModal/HomeDetailModal.types'
import { WhatsOn } from './WhatsOn'

jest.mock('decentraland-ui2', () => ({
  ...jest.requireActual('../../../__test-utils__/ui2Mock').createUi2Mock(),
  AnimatedBackground: () => null
}))

jest.mock('@mui/icons-material/ChevronRight', () => ({ __esModule: true, default: () => null }))

const mockUseGetWhatsOnDataQuery = jest.fn()
jest.mock('../../../features/events/events.discovery', () => ({
  useGetWhatsOnDataQuery: () => mockUseGetWhatsOnDataQuery()
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

const mockTrackClick = jest.fn()
jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: () => mockTrackClick
}))

jest.mock('../../Carousel/Carousel', () => ({
  Carousel: ({
    items,
    renderItem,
    keyExtractor
  }: {
    items: ExploreItem[]
    renderItem: (item: ExploreItem) => React.ReactNode
    keyExtractor: (item: ExploreItem) => string
  }) => (
    <div data-testid="carousel">
      {items.map(item => (
        <React.Fragment key={keyExtractor(item)}>{renderItem(item)}</React.Fragment>
      ))}
    </div>
  )
}))

jest.mock('./WhatsOnCard', () => ({
  WhatsOnCard: ({ card, loading, onSelect }: { card?: ExploreItem; loading?: boolean; onSelect?: (card: ExploreItem) => void }) =>
    loading ? (
      <div data-testid="card-loading" />
    ) : (
      <button data-testid="card" onClick={() => card && onSelect?.(card)}>
        {card?.title}
      </button>
    )
}))

jest.mock('./WhatsOn.styled', () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  return {
    WhatsOnContainer: passthrough,
    SectionTitle: passthrough,
    CardsGrid: ({ children }: { children?: React.ReactNode }) => <div data-testid="grid">{children}</div>,
    MobileCarousel: ({ children }: { children?: React.ReactNode }) => <div data-testid="mobile">{children}</div>,
    ViewAllButton: ({ children, onClick }: { children?: React.ReactNode; onClick: React.MouseEventHandler }) => (
      <a
        href="/events"
        onClick={event => {
          event.preventDefault()
          onClick(event)
        }}
      >
        {children}
      </a>
    )
  }
})

const mockLoader = jest.fn()
jest.mock('../HomeDetailModal/HomeDetailModalLoader', () => ({
  HomeDetailModalLoader: (props: { selection: HomeDetailSelection | null; onClose: () => void }) => {
    mockLoader(props)
    return (
      <div data-testid="loader" data-selection={JSON.stringify(props.selection)}>
        <button onClick={props.onClose}>close detail</button>
      </div>
    )
  }
}))

const place: ExploreItem = {
  type: ExploreCardType.PLACE,
  id: 'place-1',
  title: 'Genesis Plaza',
  users: 12,
  image: '',
  coordinates: '0,0',
  isGenesisPlaza: true
}
const event: ExploreItem = { ...place, type: ExploreCardType.EVENT, id: 'event-1', title: 'Career Mondays', coordinates: '5,6' }

const renderSection = () =>
  render(
    <MemoryRouter>
      <WhatsOn />
    </MemoryRouter>
  )

const currentSelection = () => JSON.parse(screen.getByTestId('loader').getAttribute('data-selection') as string)

describe('when rendering the whats on section', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the cards are loading', () => {
    beforeEach(() => {
      mockUseGetWhatsOnDataQuery.mockReturnValue({ data: [], isLoading: true })
      renderSection()
    })

    it('should render placeholders in the grid and the carousel', () => {
      expect(screen.getAllByTestId('card-loading')).toHaveLength(4)
    })

    it('should have nothing selected', () => {
      expect(currentSelection()).toBeNull()
    })
  })

  describe('and there are no cards', () => {
    beforeEach(() => {
      mockUseGetWhatsOnDataQuery.mockReturnValue({ data: [], isLoading: false })
      renderSection()
    })

    it('should render nothing', () => {
      expect(screen.queryByTestId('grid')).toBeNull()
      expect(screen.queryByTestId('loader')).toBeNull()
    })
  })

  describe('and there are cards', () => {
    beforeEach(() => {
      mockUseGetWhatsOnDataQuery.mockReturnValue({ data: [event, place], isLoading: false })
      renderSection()
    })

    describe('and an event card is clicked in the grid', () => {
      beforeEach(async () => {
        await userEvent.click(screen.getAllByText('Career Mondays')[0])
      })

      it('should select the event by id', () => {
        expect(currentSelection()).toEqual({ kind: 'event', id: 'event-1' })
      })
    })

    describe('and a place card is clicked in the mobile carousel', () => {
      beforeEach(async () => {
        const carousel = screen.getByTestId('mobile')
        await userEvent.click(carousel.querySelectorAll('[data-testid="card"]')[1])
      })

      it('should select the whole place item', () => {
        expect(currentSelection()).toEqual({ kind: 'place', item: place })
      })
    })

    describe('and another card is clicked while one is open', () => {
      beforeEach(async () => {
        await userEvent.click(screen.getAllByText('Career Mondays')[0])
        await userEvent.click(screen.getAllByText('Genesis Plaza')[0])
      })

      it('should keep the latest selection', () => {
        expect(currentSelection()).toEqual({ kind: 'place', item: place })
      })
    })

    describe('and the detail is closed', () => {
      beforeEach(async () => {
        await userEvent.click(screen.getAllByText('Career Mondays')[0])
        await userEvent.click(screen.getByText('close detail'))
      })

      it('should clear the selection', () => {
        expect(currentSelection()).toBeNull()
      })
    })

    describe('and the view all link is clicked', () => {
      beforeEach(async () => {
        await userEvent.click(screen.getByText('page.home.whats_on.view_all'))
      })

      it('should track the click', () => {
        expect(mockTrackClick).toHaveBeenCalledTimes(1)
      })
    })
  })
})
