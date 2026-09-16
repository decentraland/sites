import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { captureHandledError } from '../../modules/captureHandledError'
import { ErrorBoundary, ErrorFallback, RouteErrorBoundary } from './ErrorBoundary'

jest.mock('decentraland-ui2', () => {
  const styledMock = jest.requireActual('../../__test-utils__/styledMock')
  return { ...styledMock, Button: 'button', Typography: 'span' }
})

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../modules/captureHandledError', () => ({ captureHandledError: jest.fn() }))

const mockedPathname = { value: '/places' }
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockedPathname.value })
}))

const mockedCapture = captureHandledError as jest.MockedFunction<typeof captureHandledError>

const Boom = ({ message }: { message: string }): null => {
  throw new Error(message)
}

// React logs every boundary-caught error to console.error; silence it so the spec
// output stays readable without hiding genuine failures.
let consoleErrorSpy: jest.SpyInstance

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  mockedPathname.value = '/places'
})

afterEach(() => {
  consoleErrorSpy.mockRestore()
  jest.resetAllMocks()
})

describe('when no child throws', () => {
  it('should render the children', () => {
    render(
      <ErrorBoundary fallback={<span>fallback</span>}>
        <span>content</span>
      </ErrorBoundary>
    )

    expect(screen.getByText('content')).toBeInTheDocument()
    expect(screen.queryByText('fallback')).not.toBeInTheDocument()
  })
})

describe('when a child throws', () => {
  it('should render the fallback instead of unmounting the tree', () => {
    render(
      <ErrorBoundary fallback={<span>fallback</span>}>
        <Boom message="kaboom" />
      </ErrorBoundary>
    )

    expect(screen.getByText('fallback')).toBeInTheDocument()
  })

  it('should report the error with the boundary and connectivity tags', () => {
    render(
      <ErrorBoundary fallback={<span>fallback</span>}>
        <Boom message="kaboom" />
      </ErrorBoundary>
    )

    expect(mockedCapture).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'kaboom' }),
      expect.objectContaining({
        tags: expect.objectContaining({ boundary: 'route', chunk_load_error: 'false', online: String(navigator.onLine) })
      })
    )
  })

  it('should flag a failed dynamic import so chunk failures can be filtered', () => {
    render(
      <ErrorBoundary fallback={<span>fallback</span>}>
        <Boom message="Failed to fetch dynamically imported module: https://cdn/x.js" />
      </ErrorBoundary>
    )

    expect(mockedCapture).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tags: expect.objectContaining({ chunk_load_error: 'true' }) })
    )
  })

  it('should include the component stack as extra context', () => {
    render(
      <ErrorBoundary fallback={<span>fallback</span>}>
        <Boom message="kaboom" />
      </ErrorBoundary>
    )

    expect(mockedCapture).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ extra: expect.anything() }))
  })
})

describe('when the reset key changes after an error', () => {
  it('should clear the error and render the children again', () => {
    const { rerender } = render(
      <ErrorBoundary fallback={<span>fallback</span>} resetKey="/a">
        <Boom message="kaboom" />
      </ErrorBoundary>
    )
    expect(screen.getByText('fallback')).toBeInTheDocument()

    rerender(
      <ErrorBoundary fallback={<span>fallback</span>} resetKey="/b">
        <span>content</span>
      </ErrorBoundary>
    )

    expect(screen.getByText('content')).toBeInTheDocument()
    expect(screen.queryByText('fallback')).not.toBeInTheDocument()
  })
})

describe('when the reset key stays the same after an error', () => {
  it('should keep showing the fallback', () => {
    const { rerender } = render(
      <ErrorBoundary fallback={<span>fallback</span>} resetKey="/a">
        <Boom message="kaboom" />
      </ErrorBoundary>
    )

    rerender(
      <ErrorBoundary fallback={<span>fallback</span>} resetKey="/a">
        <span>content</span>
      </ErrorBoundary>
    )

    expect(screen.getByText('fallback')).toBeInTheDocument()
  })
})

describe('when the fallback is rendered', () => {
  it('should reload the page from the CTA', async () => {
    const reload = jest.fn()
    Object.defineProperty(window, 'location', { configurable: true, value: { reload }, writable: true })
    const user = userEvent.setup()

    render(<ErrorFallback />)
    await user.click(screen.getByRole('button', { name: 'component.error_boundary.reload' }))

    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('should show the translated title and message', () => {
    render(<ErrorFallback />)

    expect(screen.getByText('component.error_boundary.title')).toBeInTheDocument()
    expect(screen.getByText('component.error_boundary.message')).toBeInTheDocument()
  })
})

describe('when the route boundary wraps the tree', () => {
  it('should render the children while nothing throws', () => {
    render(
      <RouteErrorBoundary>
        <span>routed content</span>
      </RouteErrorBoundary>
    )

    expect(screen.getByText('routed content')).toBeInTheDocument()
  })

  it('should show the localized fallback when a route throws', () => {
    render(
      <RouteErrorBoundary>
        <Boom message="kaboom" />
      </RouteErrorBoundary>
    )

    expect(screen.getByText('component.error_boundary.title')).toBeInTheDocument()
  })
})
