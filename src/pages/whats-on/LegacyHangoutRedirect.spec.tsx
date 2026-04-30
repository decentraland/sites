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
        <Route path="/whats-on/new-event" element={<LegacyHangoutRedirect />} />
        <Route path="/whats-on/edit-event/:eventId" element={<LegacyHangoutRedirect />} />
        <Route path="/whats-on/new-hangout" element={<LocationProbe />} />
        <Route path="/whats-on/edit-hangout/:eventId" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LegacyHangoutRedirect', () => {
  describe('when entering /whats-on/new-event', () => {
    it('should redirect to /whats-on/new-hangout preserving the query string', () => {
      renderAt({ pathname: '/whats-on/new-event', search: '?community_id=abc' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on/new-hangout')
      expect(screen.getByTestId('search')).toHaveTextContent('?community_id=abc')
    })
  })

  describe('when entering /whats-on/edit-event/:eventId', () => {
    it('should redirect to /whats-on/edit-hangout/:eventId preserving the eventId', () => {
      renderAt({ pathname: '/whats-on/edit-event/ev-42', search: '?openPreview' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on/edit-hangout/ev-42')
      expect(screen.getByTestId('search')).toHaveTextContent('?openPreview')
    })

    it('should preserve location.state across the redirect', () => {
      const event = { id: 'ev-42', name: 'Test event' }
      renderAt({ pathname: '/whats-on/edit-event/ev-42', state: { event } })

      expect(screen.getByTestId('state')).toHaveTextContent(JSON.stringify({ event }))
    })
  })
})
