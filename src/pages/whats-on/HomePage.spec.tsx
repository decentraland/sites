import React from 'react'
import { render, screen } from '@testing-library/react'
import { HomePage } from './HomePage'

const mockUseGetLiveNowCardsQuery = jest.fn()
const mockUseLiveNowQueryParams = jest.fn()

jest.mock('../../features/whats-on-events', () => ({
  useGetLiveNowCardsQuery: (...args: unknown[]) => mockUseGetLiveNowCardsQuery(...args)
}))

jest.mock('../../hooks/useLiveNowQueryParams', () => ({
  useLiveNowQueryParams: () => mockUseLiveNowQueryParams()
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
})
