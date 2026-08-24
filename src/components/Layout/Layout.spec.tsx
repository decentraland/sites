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
 * The /create page shares its look with the wemotes-builder collections app: the navbar
 * gets the creators treatment. (The violet field + sub-nav render from the /create page
 * chunk itself, behind the wemotes-builder release flag — not from Layout.)
 */
describe('when the layout renders the creators page', () => {
  it('should switch the navbar to the creators treatment', () => {
    renderAt('/create')

    expect(screen.getByTestId('navbar')).toHaveAttribute('data-creators', 'true')
  })
})

describe('when the layout renders any other page', () => {
  it('should keep the default navbar', () => {
    renderAt('/help')

    expect(screen.getByTestId('navbar')).not.toHaveAttribute('data-creators')
  })
})
