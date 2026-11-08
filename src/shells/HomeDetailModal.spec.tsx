import { skipToken } from '@reduxjs/toolkit/query/react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMockEvent, createMockLiveNowCard, createMockModalData } from '../__test-utils__/factories'
import type { HomeDetailSelection } from '../components/Home/HomeDetailModal/HomeDetailModal.types'
import { ExploreCardType } from '../features/events/events.discovery.types'
import type { ExploreItem } from '../features/events/events.discovery.types'
import { HomeDetailModal } from './HomeDetailModal'

const mockUseGetEventByIdQuery = jest.fn()
jest.mock('../features/events', () => ({
  useGetEventByIdQuery: (...args: unknown[]) => mockUseGetEventByIdQuery(...args)
}))

const mockEnrichPlaceCards = jest.fn()
jest.mock('../features/events/events.helpers', () => ({
  enrichPlaceCards: (...args: unknown[]) => mockEnrichPlaceCards(...args)
}))

const mockNormalizeEventEntry = jest.fn()
const mockNormalizeLiveNowCard = jest.fn()
jest.mock('../components/events/EventDetailModal', () => ({
  EventDetailModal: ({ data, onClose }: { data: { name: string }; onClose: () => void }) => (
    <div data-testid="event-detail-modal" data-name={data.name}>
      <button onClick={onClose}>close modal</button>
    </div>
  ),
  normalizeEventEntry: (...args: unknown[]) => mockNormalizeEventEntry(...args),
  normalizeLiveNowCard: (...args: unknown[]) => mockNormalizeLiveNowCard(...args)
}))

jest.mock('../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: 'identity-1', hasValidIdentity: true, address: '0xabc' })
}))

jest.mock('../config/env', () => ({
  getEnv: (key: string) => `https://${key.toLowerCase()}.example.com`
}))

jest.mock('../components/Home/HomeDetailModal/HomeDetailPendingOverlay', () => ({
  HomeDetailPendingOverlay: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="pending-overlay">
      <button onClick={onClose}>close pending</button>
    </div>
  )
}))

const place: ExploreItem = {
  type: ExploreCardType.PLACE,
  id: 'place-1',
  title: 'Plaza',
  users: 3,
  image: 'https://example.com/plaza.png',
  coordinates: '1,2',
  isGenesisPlaza: false
}

const onClose = jest.fn()
const onError = jest.fn()

const renderModal = (selection: HomeDetailSelection) =>
  render(<HomeDetailModal selection={selection} onClose={onClose} onError={onError} />)

describe('when rendering the home detail modal', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and an event is selected', () => {
    const selection: HomeDetailSelection = { kind: 'event', id: 'event-1' }

    describe('and the event is still loading', () => {
      beforeEach(() => {
        mockUseGetEventByIdQuery.mockReturnValue({ currentData: undefined, error: undefined })
        renderModal(selection)
      })

      it('should fetch the event with the signed-in identity', () => {
        expect(mockUseGetEventByIdQuery).toHaveBeenCalledWith({ eventId: 'event-1', identity: 'identity-1' })
      })

      it('should show the pending overlay and keep it closable', async () => {
        expect(screen.getByTestId('pending-overlay')).toBeInTheDocument()
        await userEvent.click(screen.getByText('close pending'))
        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })

    describe('and the event loads', () => {
      beforeEach(() => {
        const event = createMockEvent({ id: 'event-1' })
        mockUseGetEventByIdQuery.mockReturnValue({ currentData: event, error: undefined })
        mockNormalizeEventEntry.mockReturnValue(createMockModalData({ name: 'Career Mondays' }))
        renderModal(selection)
      })

      it('should render the detail modal with the normalized event', () => {
        expect(screen.getByTestId('event-detail-modal')).toHaveAttribute('data-name', 'Career Mondays')
        expect(screen.queryByTestId('pending-overlay')).toBeNull()
      })

      it('should not enrich any place', () => {
        expect(mockEnrichPlaceCards).not.toHaveBeenCalled()
      })

      it('should forward the close action', async () => {
        await userEvent.click(screen.getByText('close modal'))
        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })

    describe('and the fetch fails', () => {
      beforeEach(() => {
        mockUseGetEventByIdQuery.mockReturnValue({ currentData: undefined, error: { status: 404 } })
        renderModal(selection)
      })

      it('should report the error and not render the modal', () => {
        expect(onError).toHaveBeenCalledWith({ status: 404 })
        expect(screen.queryByTestId('event-detail-modal')).toBeNull()
      })
    })
  })

  describe('and a place is selected', () => {
    const selection: HomeDetailSelection = { kind: 'place', item: place }

    beforeEach(() => {
      mockUseGetEventByIdQuery.mockReturnValue({ currentData: undefined, error: undefined })
    })

    describe('and the enrichment is pending', () => {
      beforeEach(() => {
        mockEnrichPlaceCards.mockReturnValue(new Promise(() => undefined))
        renderModal(selection)
      })

      it('should skip the event query', () => {
        expect(mockUseGetEventByIdQuery).toHaveBeenCalledWith(skipToken)
      })

      it('should show the pending overlay', () => {
        expect(screen.getByTestId('pending-overlay')).toBeInTheDocument()
      })
    })

    describe('and the enrichment resolves', () => {
      beforeEach(async () => {
        const enriched = createMockLiveNowCard({ id: 'place-1', type: 'place', title: 'Plaza', description: 'Enriched' })
        mockEnrichPlaceCards.mockResolvedValue([enriched])
        mockNormalizeLiveNowCard.mockReturnValue(createMockModalData({ name: 'Plaza' }))
        await act(async () => {
          renderModal(selection)
        })
      })

      it('should enrich the place card with the places and peer urls', () => {
        expect(mockEnrichPlaceCards).toHaveBeenCalledWith([expect.objectContaining({ id: 'place-1', type: 'place', coordinates: '1,2' })], {
          placesUrl: 'https://places_api_url.example.com',
          peerUrl: 'https://peer_url.example.com'
        })
      })

      it('should render the detail modal from the enriched card', () => {
        expect(mockNormalizeLiveNowCard).toHaveBeenCalledWith(expect.objectContaining({ description: 'Enriched' }))
        expect(screen.getByTestId('event-detail-modal')).toHaveAttribute('data-name', 'Plaza')
      })
    })

    describe('and the enrichment rejects', () => {
      beforeEach(async () => {
        mockEnrichPlaceCards.mockRejectedValue(new Error('places down'))
        await act(async () => {
          renderModal(selection)
        })
      })

      it('should report the error', () => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
      })
    })

    describe('and the modal unmounts before the enrichment resolves', () => {
      beforeEach(async () => {
        let resolve!: (cards: unknown[]) => void
        mockEnrichPlaceCards.mockReturnValue(
          new Promise(res => {
            resolve = res
          })
        )
        const { unmount } = renderModal(selection)
        unmount()
        await act(async () => resolve([createMockLiveNowCard({ type: 'place' })]))
      })

      it('should not normalize the late result', () => {
        expect(mockNormalizeLiveNowCard).not.toHaveBeenCalled()
      })
    })

    describe('and the modal unmounts before the enrichment rejects', () => {
      beforeEach(async () => {
        let reject!: (error: Error) => void
        mockEnrichPlaceCards.mockReturnValue(
          new Promise((_res, rej) => {
            reject = rej
          })
        )
        const { unmount } = renderModal(selection)
        unmount()
        await act(async () => reject(new Error('late')))
      })

      it('should not report a late error', () => {
        expect(onError).not.toHaveBeenCalled()
      })
    })
  })
})
