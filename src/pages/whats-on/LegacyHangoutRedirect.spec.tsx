import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { LegacyHangoutRedirect } from './LegacyHangoutRedirect'

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
        <Route path="/events/new-hangout" element={<LegacyHangoutRedirect />} />
        <Route path="/events/edit-hangout/:eventId" element={<LegacyHangoutRedirect />} />
        <Route path="/events/new-event" element={<LocationProbe />} />
        <Route path="/events/edit-event/:eventId" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LegacyHangoutRedirect', () => {
  describe('when entering /events/new-hangout', () => {
    it('should redirect to /events/new-event preserving the query string', () => {
      renderAt({ pathname: '/events/new-hangout', search: '?community_id=abc' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/events/new-event')
      expect(screen.getByTestId('search')).toHaveTextContent('?community_id=abc')
    })
  })

  describe('when entering /events/edit-hangout/:eventId', () => {
    it('should redirect to /events/edit-event/:eventId preserving the eventId', () => {
      renderAt({ pathname: '/events/edit-hangout/ev-42', search: '?openPreview' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/events/edit-event/ev-42')
      expect(screen.getByTestId('search')).toHaveTextContent('?openPreview')
    })

    it('should preserve location.state across the redirect', () => {
      const event = { id: 'ev-42', name: 'Test event' }
      renderAt({ pathname: '/events/edit-hangout/ev-42', state: { event } })

      expect(screen.getByTestId('state')).toHaveTextContent(JSON.stringify({ event }))
    })
  })
})
