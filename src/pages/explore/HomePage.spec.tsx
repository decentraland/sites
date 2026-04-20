import React from 'react'
import { render, screen } from '@testing-library/react'
import { HomePage } from './HomePage'

const mockUseGetLiveNowCardsQuery = jest.fn()

jest.mock('../../features/explore-events', () => ({
  useGetLiveNowCardsQuery: (...args: unknown[]) => mockUseGetLiveNowCardsQuery(...args)
}))

jest.mock('../../components/explore/LiveNow', () => ({
  LiveNow: () => <div data-testid="live-now" />
}))

jest.mock('../../components/explore/Upcoming', () => ({
  Upcoming: () => <div data-testid="upcoming" />
}))

jest.mock('../../components/explore/AllExperiences', () => ({
  AllExperiences: () => <div data-testid="all-experiences" />
}))

jest.mock('./HomePage.styled', () => ({
  MainContainer: ({ children }: { children: React.ReactNode }) => <main data-testid="main">{children}</main>,
  ContentWrapper: ({ children }: { children: React.ReactNode }) => <div data-testid="content-wrapper">{children}</div>,
  DeferredGroup: ({ hidden, children }: { hidden: boolean; children: React.ReactNode }) => (
    <div data-testid="deferred-group" data-hidden={hidden ? 'true' : 'false'}>
      {children}
    </div>
  )
}))

describe('when HomePage is rendered', () => {
  afterEach(() => {
    jest.resetAllMocks()
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

      expect(screen.getByTestId('deferred-group')).toHaveAttribute('data-hidden', 'true')
    })
  })

  describe('and LiveNow has finished loading', () => {
    beforeEach(() => {
      mockUseGetLiveNowCardsQuery.mockReturnValue({ isLoading: false })
    })

    it('should reveal Upcoming and AllExperiences', () => {
      render(<HomePage />)

      expect(screen.getByTestId('deferred-group')).toHaveAttribute('data-hidden', 'false')
      expect(screen.getByTestId('upcoming')).toBeInTheDocument()
      expect(screen.getByTestId('all-experiences')).toBeInTheDocument()
    })
  })
})
