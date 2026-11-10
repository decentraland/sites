import { render, screen } from '@testing-library/react'
import { Env } from '@dcl/ui-env'
import { getCurrentEnv } from '../../config/env'
import { CREATOR_FUND_TITLE, CreatorFundPage } from './CreatorFundPage'

jest.mock('decentraland-ui2', () => {
  const { styled, Box, dclColors } = jest.requireActual('../../__test-utils__/styledMock')
  return { styled, Box, dclColors }
})

jest.mock('@dcl/ui-env', () => ({
  Env: { DEVELOPMENT: 'dev', STAGING: 'stg', PRODUCTION: 'prod' }
}))

jest.mock('../../config/env', () => ({
  getCurrentEnv: jest.fn()
}))

jest.mock('../../components/Layout', () => ({
  Layout: ({ children, withNavbar = true }: { children?: React.ReactNode; withNavbar?: boolean }) => (
    <div data-testid="layout" data-site-navbar={String(withNavbar)}>
      {children}
    </div>
  )
}))

jest.mock('../../components/CreatorFund/ComingSoon', () => ({
  CreatorFundComingSoon: () => <div data-testid="coming-soon" />
}))

jest.mock('../../components/CreatorFund/CreatorFundLanding', () => ({
  CreatorFundLanding: () => <div data-testid="landing" />
}))

describe('CreatorFundPage', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when served from decentraland.org', () => {
    beforeEach(() => {
      ;(getCurrentEnv as jest.Mock).mockReturnValue(Env.PRODUCTION)
      render(<CreatorFundPage />)
    })

    it('should show the coming-soon placeholder', () => {
      expect(screen.getByTestId('coming-soon')).toBeInTheDocument()
    })

    it('should keep the site navbar', () => {
      expect(screen.getByTestId('layout')).toHaveAttribute('data-site-navbar', 'true')
    })

    it('should not load the full page', () => {
      expect(screen.queryByTestId('landing')).not.toBeInTheDocument()
    })

    it('should title the browser tab Decentraland Creator Fund', () => {
      expect(document.title).toBe('Decentraland Creator Fund')
    })
  })

  describe('when the page is left', () => {
    beforeEach(() => {
      document.title = 'Decentraland'
      ;(getCurrentEnv as jest.Mock).mockReturnValue(Env.PRODUCTION)
      render(<CreatorFundPage />).unmount()
    })

    it('should restore the previous tab title', () => {
      expect(document.title).toBe('Decentraland')
    })
  })

  describe.each([Env.DEVELOPMENT, Env.STAGING])('when served from the %s environment', env => {
    beforeEach(() => {
      ;(getCurrentEnv as jest.Mock).mockReturnValue(env)
      render(<CreatorFundPage />)
    })

    it('should show the full Creator Fund page', async () => {
      expect(await screen.findByTestId('landing')).toBeInTheDocument()
    })

    it('should replace the site navbar with the Creator Fund one', async () => {
      await screen.findByTestId('landing')
      expect(screen.getByTestId('layout')).toHaveAttribute('data-site-navbar', 'false')
    })

    it('should not show the coming-soon placeholder', async () => {
      await screen.findByTestId('landing')
      expect(screen.queryByTestId('coming-soon')).not.toBeInTheDocument()
    })

    it('should title the browser tab with the Creator Fund name', async () => {
      await screen.findByTestId('landing')
      expect(document.title).toBe(CREATOR_FUND_TITLE)
    })
  })
})
