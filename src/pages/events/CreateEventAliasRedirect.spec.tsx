import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { CreateEventAliasRedirect } from './CreateEventAliasRedirect'

function LocationProbe() {
  const location = useLocation()
  return (
    <div>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="search">{location.search}</span>
      <span data-testid="state">{JSON.stringify(location.state)}</span>
    </div>
  )
}

// Mirrors the route block in App.tsx: the aliases redirect, the real route resolves on its own.
function renderAt(entry: { pathname: string; search?: string; state?: unknown }) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/events" element={<LocationProbe />} />
        <Route path="/events/new-event" element={<LocationProbe />} />
        <Route path="/events/submit" element={<CreateEventAliasRedirect />} />
        <Route path="/events/create" element={<CreateEventAliasRedirect />} />
        <Route path="/events/new" element={<CreateEventAliasRedirect />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('when landing on a guessed event-creation path', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it.each(['/events/submit', '/events/create', '/events/new'])('should send %s to /events/new-event', pathname => {
    renderAt({ pathname })

    expect(screen.getByTestId('pathname')).toHaveTextContent('/events/new-event')
  })

  describe('and the link carries a query string', () => {
    it('should keep it so campaign and prefill params survive', () => {
      renderAt({ pathname: '/events/submit', search: '?utm_source=assistant&world=foo.dcl.eth' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/events/new-event')
      expect(screen.getByTestId('search')).toHaveTextContent('?utm_source=assistant&world=foo.dcl.eth')
    })
  })

  describe('and the navigation carries router state', () => {
    it('should forward it untouched', () => {
      renderAt({ pathname: '/events/create', state: { from: '/places' } })

      expect(screen.getByTestId('state')).toHaveTextContent('{"from":"/places"}')
    })
  })
})

describe('when landing on the real event-creation path', () => {
  it('should render it without redirecting', () => {
    renderAt({ pathname: '/events/new-event' })

    expect(screen.getByTestId('pathname')).toHaveTextContent('/events/new-event')
  })
})
