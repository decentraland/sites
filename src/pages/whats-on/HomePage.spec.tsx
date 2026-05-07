import React from 'react'
import { render, screen } from '@testing-library/react'
import { HomePage } from './HomePage'

const mockUseGetLiveNowCardsQuery = jest.fn()
const mockUseLiveNowQueryParams = jest.fn()
const mockUseEventDeepLink = jest.fn()
const mockUsePlaceDeepLink = jest.fn()
const mockEventDetailModal = jest.fn()
const mockPlaceDetailModal = jest.fn()

jest.mock('../../features/experiences/events', () => ({
  useGetLiveNowCardsQuery: (...args: unknown[]) => mockUseGetLiveNowCardsQuery(...args)
}))

jest.mock('../../hooks/useLiveNowQueryParams', () => ({
  useLiveNowQueryParams: () => mockUseLiveNowQueryParams()
}))

jest.mock('../../hooks/useEventDeepLink', () => ({
  useEventDeepLink: () => mockUseEventDeepLink()
}))

jest.mock('../../hooks/usePlaceDeepLink', () => ({
  usePlaceDeepLink: () => mockUsePlaceDeepLink()
}))

jest.mock('../../components/whats-on/EventDetailModal', () => ({
  EventDetailModal: (props: { open: boolean }) => {
    mockEventDetailModal(props)
    return <div data-testid="event-detail-modal" data-open={props.open ? 'true' : 'false'} />
  }
}))

jest.mock('../../components/whats-on/PlaceDetailModal', () => ({
  PlaceDetailModal: (props: { open: boolean }) => {
    mockPlaceDetailModal(props)
    return <div data-testid="place-detail-modal" data-open={props.open ? 'true' : 'false'} />
  }
}))

jest.mock('../../components/whats-on/LiveNow', () => ({
  LiveNow: () => <div data-testid="live-now" />
}))

jest.mock('../../components/whats-on/Upcoming', () => ({
  Upcoming: () => <div data-testid="upcoming" />
}))

jest.mock('../../components/whats-on/AllExperiences', () => ({
  AllExperiences: () => <div data-testid="all-experiences" />
}))

jest.mock('./HomePage.styled', () => ({
  MainContainer: ({ children }: { children: React.ReactNode }) => <main data-testid="main">{children}</main>,
  ContentWrapper: ({ children }: { children: React.ReactNode }) => <div data-testid="content-wrapper">{children}</div>,
  DeferredGroup: ({ deferred, children }: { deferred: boolean; children: React.ReactNode }) => (
    <div data-testid="deferred-group" data-deferred={deferred ? 'true' : 'false'}>
      {children}
    </div>
  ),
  TopBackgroundImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img data-testid="top-bg" {...props} />
}))

describe('when HomePage is rendered', () => {
  beforeEach(() => {
    mockUseEventDeepLink.mockReturnValue({ isOpen: false, modalData: null, closeDeepLink: jest.fn() })
    mockUsePlaceDeepLink.mockReturnValue({ isOpen: false, modalData: null, closeDeepLink: jest.fn() })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and a minUsers query param is present', () => {
    beforeEach(() => {
      mockUseLiveNowQueryParams.mockReturnValue({ minUsers: 3 })
      mockUseGetLiveNowCardsQuery.mockReturnValue({ isLoading: true })
    })

    it('should subscribe to live-now with the shared params so it hits the same cache entry as LiveNow', () => {
      render(<HomePage />)

      expect(mockUseGetLiveNowCardsQuery).toHaveBeenCalledWith({ minUsers: 3 })
    })
  })

  describe('and the decorative top background is rendered', () => {
    beforeEach(() => {
      mockUseGetLiveNowCardsQuery.mockReturnValue({ isLoading: false })
    })

    it('should make the image eagerly discoverable', () => {
      render(<HomePage />)

      expect(screen.getByTestId('top-bg')).toHaveAttribute('loading', 'eager')
    })

    it('should not compete with the LiveNow LCP card for high fetch priority', () => {
      render(<HomePage />)

      expect(screen.getByTestId('top-bg')).not.toHaveAttribute('fetchpriority')
    })
  })

  describe('and LiveNow is still loading', () => {
    beforeEach(() => {
      mockUseGetLiveNowCardsQuery.mockReturnValue({ isLoading: true })
    })

    it('should mount Upcoming and AllExperiences so their queries fire in parallel', () => {
      render(<HomePage />)

      expect(screen.getByTestId('live-now')).toBeInTheDocument()
      expect(screen.getByTestId('upcoming')).toBeInTheDocument()
      expect(screen.getByTestId('all-experiences')).toBeInTheDocument()
    })

    it('should keep Upcoming and AllExperiences hidden to preserve section order', () => {
      render(<HomePage />)

      expect(screen.getByTestId('deferred-group')).toHaveAttribute('data-deferred', 'true')
    })
  })

  describe('and LiveNow has finished loading', () => {
    beforeEach(() => {
      mockUseGetLiveNowCardsQuery.mockReturnValue({ isLoading: false })
    })

    it('should reveal Upcoming and AllExperiences', () => {
      render(<HomePage />)

      expect(screen.getByTestId('deferred-group')).toHaveAttribute('data-deferred', 'false')
      expect(screen.getByTestId('upcoming')).toBeInTheDocument()
      expect(screen.getByTestId('all-experiences')).toBeInTheDocument()
    })
  })

  describe('and a deep-linked event is open', () => {
    let closeDeepLink: jest.Mock

    beforeEach(() => {
      closeDeepLink = jest.fn()
      mockUseGetLiveNowCardsQuery.mockReturnValue({ isLoading: false })
      mockUseEventDeepLink.mockReturnValue({
        isOpen: true,
        modalData: { id: 'ev-42' },
        closeDeepLink
      })
    })

    it('should mount the EventDetailModal in its open state with the deep-link data', () => {
      render(<HomePage />)

      expect(screen.getByTestId('event-detail-modal')).toHaveAttribute('data-open', 'true')
      expect(mockEventDetailModal).toHaveBeenCalledWith(
        expect.objectContaining({ open: true, data: { id: 'ev-42' }, onClose: closeDeepLink })
      )
    })
  })

  describe('and a deep-linked place is open', () => {
    let closeDeepLink: jest.Mock

    beforeEach(() => {
      closeDeepLink = jest.fn()
      mockUseGetLiveNowCardsQuery.mockReturnValue({ isLoading: false })
      mockUsePlaceDeepLink.mockReturnValue({
        isOpen: true,
        modalData: { id: 'place-42' },
        closeDeepLink
      })
    })

    it('should mount the PlaceDetailModal in its open state with the deep-link data', () => {
      render(<HomePage />)

      expect(screen.getByTestId('place-detail-modal')).toHaveAttribute('data-open', 'true')
      expect(mockPlaceDetailModal).toHaveBeenCalledWith(
        expect.objectContaining({ open: true, data: { id: 'place-42' }, onClose: closeDeepLink })
      )
    })
  })
})
