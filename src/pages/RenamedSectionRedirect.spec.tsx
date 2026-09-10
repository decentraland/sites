import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { useAnalytics } from '@dcl/hooks'
import { SegmentEvent } from '../modules/segment'
import { RenamedSectionRedirect } from './RenamedSectionRedirect'

jest.mock('@dcl/hooks', () => ({
  useAnalytics: jest.fn()
}))

const useAnalyticsMock = useAnalytics as jest.MockedFunction<typeof useAnalytics>

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

// Mirrors the route block in App.tsx: the renamed prefixes redirect, the new ones resolve.
function renderAt(initialEntry: { pathname: string; search?: string; state?: unknown }) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/whats-on/*" element={<RenamedSectionRedirect from="/whats-on" to="/events" origin="events" />} />
        <Route path="/whats-on" element={<RenamedSectionRedirect from="/whats-on" to="/events" origin="events" />} />
        <Route path="/discover/*" element={<RenamedSectionRedirect from="/discover" to="/places" origin="places" />} />
        <Route path="/discover" element={<RenamedSectionRedirect from="/discover" to="/places" origin="places" />} />
        <Route path="/events" element={<LocationProbe />} />
        <Route path="/events/*" element={<LocationProbe />} />
        <Route path="/places" element={<LocationProbe />} />
        <Route path="/places/*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RenamedSectionRedirect', () => {
  let trackMock: jest.Mock

  beforeEach(() => {
    trackMock = jest.fn()
    useAnalyticsMock.mockReturnValue({
      isInitialized: true,
      page: jest.fn(),
      track: trackMock,
      identify: jest.fn()
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when entering a renamed section root', () => {
    it('should send /whats-on to /events', () => {
      renderAt({ pathname: '/whats-on' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/events')
    })

    it('should send /discover to /places', () => {
      renderAt({ pathname: '/discover' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/places')
    })
  })

  /**
   * The subpath is what separates this from the fixed-destination legacy redirects: a bookmarked
   * admin screen or a shared scene detail has to land on the same page, not the section root.
   */
  describe('when the old URL carries a subpath', () => {
    it('should carry a multi-segment subpath across', () => {
      renderAt({ pathname: '/whats-on/admin/pending-events' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/events/admin/pending-events')
    })

    it('should carry a subpath with a param segment across', () => {
      renderAt({ pathname: '/discover/place/-102,129' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/places/place/-102,129')
    })
  })

  describe('when the old URL carries a query string', () => {
    it('should preserve it alongside the subpath', () => {
      renderAt({ pathname: '/whats-on/edit-event/ev-1', search: '?tab=details' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/events/edit-event/ev-1')
      expect(screen.getByTestId('search')).toHaveTextContent('?tab=details')
    })

    it('should preserve the deep-link params the section consumes', () => {
      renderAt({ pathname: '/whats-on', search: '?position=144,-7' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/events')
      expect(screen.getByTestId('search')).toHaveTextContent('?position=144,-7')
    })
  })

  describe('when location.state is provided', () => {
    it('should preserve it across the redirect', () => {
      const state = { from: 'renamed' }
      renderAt({ pathname: '/discover/communities', state })

      expect(screen.getByTestId('state')).toHaveTextContent(JSON.stringify(state))
    })
  })

  describe('when the redirect fires', () => {
    it('should report the full old and new URLs so the old paths can be sunset', () => {
      renderAt({ pathname: '/whats-on/admin/users', search: '?q=abc' })

      expect(trackMock).toHaveBeenCalledTimes(1)
      expect(trackMock).toHaveBeenCalledWith(
        SegmentEvent.LEGACY_EVENTS_REDIRECTED,
        expect.objectContaining({
          source: '/whats-on/admin/users?q=abc',
          destination: '/events/admin/users?q=abc',
          origin: 'events',
          preservedParams: { q: 'abc' }
        })
      )
    })

    it('should report the places origin for the Discover prefix', () => {
      renderAt({ pathname: '/discover' })

      expect(trackMock).toHaveBeenCalledWith(
        SegmentEvent.LEGACY_PLACES_REDIRECTED,
        expect.objectContaining({ source: '/discover', destination: '/places', origin: 'places' })
      )
    })
  })
})
