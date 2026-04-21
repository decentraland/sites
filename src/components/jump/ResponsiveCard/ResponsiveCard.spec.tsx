import { render, screen } from '@testing-library/react'
import { useMobileMediaQuery } from 'decentraland-ui2'
import { ResponsiveCard } from './ResponsiveCard'

jest.mock('decentraland-ui2', () => ({
  useMobileMediaQuery: jest.fn()
}))

jest.mock('../Card', () => ({
  Card: ({ children }: { children?: React.ReactNode }) => <div data-testid="desktop-card">{children}</div>
}))

jest.mock('../MobileCard', () => ({
  MobileCard: ({ children }: { children?: React.ReactNode }) => <div data-testid="mobile-card">{children}</div>
}))

const mockUseMobileMediaQuery = jest.mocked(useMobileMediaQuery)

describe('ResponsiveCard', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the viewport is mobile', () => {
    beforeEach(() => {
      mockUseMobileMediaQuery.mockReturnValue(true)
    })

    it('should render the mobile card', () => {
      render(<ResponsiveCard />)
      expect(screen.getByTestId('mobile-card')).toBeInTheDocument()
      expect(screen.queryByTestId('desktop-card')).not.toBeInTheDocument()
    })
  })

  describe('when the viewport is desktop', () => {
    beforeEach(() => {
      mockUseMobileMediaQuery.mockReturnValue(false)
    })

    it('should render the desktop card', () => {
      render(<ResponsiveCard />)
      expect(screen.getByTestId('desktop-card')).toBeInTheDocument()
      expect(screen.queryByTestId('mobile-card')).not.toBeInTheDocument()
    })
  })
})
