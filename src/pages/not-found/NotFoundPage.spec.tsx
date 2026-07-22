import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { NotFoundPage } from './NotFoundPage'

const mockPage = jest.fn()
let mockIsInitialized = true

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ isInitialized: mockIsInitialized, page: mockPage }),
  useTranslation: () => ({ t: (id: string) => id })
}))

// decentraland-ui2 ships ESM that jest can't transform. Mock the primitives the
// page uses with semantic tags so role queries work, and run each `.styled.ts`
// style callback once (there are no conditional branches) so the styled file is
// covered without bypassing the styling logic.
jest.mock('decentraland-ui2', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  const fakeTheme = {
    palette: { common: { white: '#ffffff' } },
    breakpoints: { up: () => '@media (min-width:900px)' }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drop = ({ variant, color, size, ...rest }: any) => rest
  const Typography = ReactLib.forwardRef(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ component, children, ...rest }: any, ref: any) => ReactLib.createElement(component || 'p', { ref, ...drop(rest) }, children)
  )
  const Box = ReactLib.forwardRef(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ component, children, ...rest }: any, ref: any) => ReactLib.createElement(component || 'div', { ref, ...rest }, children)
  )
  const Button = ReactLib.forwardRef(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ href, children, ...rest }: any, ref: any) =>
      href != null
        ? ReactLib.createElement('a', { ref, href, ...drop(rest) }, children)
        : ReactLib.createElement('button', { ref, ...drop(rest) }, children)
  )
  const Logo = ReactLib.forwardRef(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, ...rest }: any, ref: any) => ReactLib.createElement('span', { ref, ...rest }, children)
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styled = (tag: any) => (styleArg: any) => {
    if (typeof styleArg === 'function') {
      try {
        styleArg({ theme: fakeTheme })
      } catch {
        // style fn may reference theme keys the shim omits; coverage of the
        // reachable statements still happens on the successful path.
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ReactLib.forwardRef(({ children, ...rest }: any, ref: any) => ReactLib.createElement(tag, { ref, ...rest }, children))
  }
  return { styled, Box, Button, Typography, Logo }
})

describe('when rendering the 404 page', () => {
  beforeEach(() => {
    mockIsInitialized = true
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const renderPage = (path = '/does-not-exist') =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <NotFoundPage />
      </MemoryRouter>
    )

  it('should render the title, description and 404 watermark', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('page.not_found.title_oops')
    expect(screen.getByText('page.not_found.description')).toBeInTheDocument()
    expect(screen.getByText('404')).toHaveAttribute('aria-hidden', 'true')
  })

  it('should link the CTA to /whats-on', () => {
    renderPage()
    expect(screen.getByRole('link', { name: 'page.not_found.cta' })).toHaveAttribute('href', '/whats-on')
  })

  it('should link the logo to the homepage', () => {
    renderPage()
    expect(screen.getByRole('link', { name: 'Decentraland Home' })).toHaveAttribute('href', '/')
  })

  it('should fire a Not Found page() event with the missing path', () => {
    renderPage('/some/broken/link')
    expect(mockPage).toHaveBeenCalledTimes(1)
    expect(mockPage).toHaveBeenCalledWith('Not Found', { path: '/some/broken/link' })
  })

  describe('and analytics is not initialized yet', () => {
    beforeEach(() => {
      mockIsInitialized = false
    })

    it('should not fire the page() event', () => {
      renderPage()
      expect(mockPage).not.toHaveBeenCalled()
    })
  })
})
