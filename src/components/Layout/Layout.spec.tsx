import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { Layout } from './Layout'

jest.mock('decentraland-ui2', () => {
  const { styled } = jest.requireActual('../../__test-utils__/styledMock')
  return { styled }
})

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ isInitialized: false, page: jest.fn() })
}))

jest.mock('../LandingNavbar', () => ({
  LandingNavbarConnected: ({ isCreatorsPage }: { isCreatorsPage?: boolean }) => (
    <nav data-testid="navbar" data-creators={isCreatorsPage ? 'true' : undefined} />
  )
}))

jest.mock('../LandingFooter', () => ({
  LandingFooter: () => <footer data-testid="footer" />
}))

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Layout>
        <div />
      </Layout>
    </MemoryRouter>
  )

/**
 * The /create page shares its look with the wemotes-builder collections app: the navbar gets the
 * creators treatment and a violet field is painted behind the translucent bars so they composite
 * to the same colors. The field renders on /create only.
 */
describe('when the layout renders the creators page', () => {
  it('should switch the navbar to the creators treatment and render the violet field', () => {
    renderAt('/create')

    expect(screen.getByTestId('navbar')).toHaveAttribute('data-creators', 'true')
    expect(screen.getByTestId('creators-field')).toBeInTheDocument()
  })
})

describe('when the layout renders any other page', () => {
  it('should keep the default navbar and not render the field', () => {
    renderAt('/help')

    expect(screen.getByTestId('navbar')).not.toHaveAttribute('data-creators')
    expect(screen.queryByTestId('creators-field')).not.toBeInTheDocument()
  })
})
