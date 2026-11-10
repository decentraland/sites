import { render, screen } from '@testing-library/react'
import { CREATOR_FUND_TITLE, CreatorFundPage } from './CreatorFundPage'

jest.mock('decentraland-ui2', () => {
  const { styled, Box, dclColors } = jest.requireActual('../../__test-utils__/styledMock')
  return { styled, Box, dclColors }
})

jest.mock('../../components/Layout', () => ({
  Layout: ({ children, withNavbar = true }: { children?: React.ReactNode; withNavbar?: boolean }) => (
    <div data-testid="layout" data-site-navbar={String(withNavbar)}>
      {children}
    </div>
  )
}))

jest.mock('../../components/CreatorFund/CreatorFundLanding', () => ({
  CreatorFundLanding: () => <div data-testid="landing" />
}))

describe('CreatorFundPage', () => {
  beforeEach(() => {
    document.title = 'Decentraland'
  })

  describe('when rendered', () => {
    beforeEach(() => {
      render(<CreatorFundPage />)
    })

    it('should show the full Creator Fund page', async () => {
      expect(await screen.findByTestId('landing')).toBeInTheDocument()
    })

    it('should replace the site navbar with the Creator Fund one', async () => {
      await screen.findByTestId('landing')
      expect(screen.getByTestId('layout')).toHaveAttribute('data-site-navbar', 'false')
    })

    it('should title the browser tab Decentraland Creator Fund', async () => {
      await screen.findByTestId('landing')
      expect(document.title).toBe(CREATOR_FUND_TITLE)
      expect(CREATOR_FUND_TITLE).toBe('Decentraland Creator Fund')
    })
  })

  describe('when the page is left', () => {
    beforeEach(async () => {
      const { unmount } = render(<CreatorFundPage />)
      await screen.findByTestId('landing')
      unmount()
    })

    it('should restore the previous tab title', () => {
      expect(document.title).toBe('Decentraland')
    })
  })
})
