import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { LegacyWhatsOnRedirect } from './LegacyWhatsOnRedirect'

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

function renderAt(initialEntry: { pathname: string; search?: string; state?: unknown }) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/events/event" element={<LegacyWhatsOnRedirect />} />
        <Route path="/places/place" element={<LegacyWhatsOnRedirect />} />
        <Route path="/whats-on" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LegacyWhatsOnRedirect', () => {
  describe('when entering /events/event with an event id', () => {
    it('should redirect to /whats-on preserving the query string', () => {
      renderAt({ pathname: '/events/event', search: '?id=f790f8f6-5b63-4e82-bc68-7a2ff6ada90d' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on')
      expect(screen.getByTestId('search')).toHaveTextContent('?id=f790f8f6-5b63-4e82-bc68-7a2ff6ada90d')
    })
  })

  describe('when entering /places/place with a position', () => {
    it('should redirect to /whats-on preserving the query string', () => {
      renderAt({ pathname: '/places/place', search: '?position=144,-7' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on')
      expect(screen.getByTestId('search')).toHaveTextContent('?position=144,-7')
    })
  })

  describe('when the legacy URL carries no query string', () => {
    it('should redirect to /whats-on with an empty search', () => {
      renderAt({ pathname: '/events/event' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on')
      expect(screen.getByTestId('search')).toHaveTextContent('')
    })
  })

  describe('when location.state is provided', () => {
    it('should preserve location.state across the redirect', () => {
      const state = { from: 'legacy' }
      renderAt({ pathname: '/events/event', search: '?id=ev-1', state })

      expect(screen.getByTestId('state')).toHaveTextContent(JSON.stringify(state))
    })
  })
})
