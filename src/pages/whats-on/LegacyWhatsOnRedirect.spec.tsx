import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { useAnalytics } from '@dcl/hooks'
import { SegmentEvent } from '../../modules/segment'
import { LegacyWhatsOnRedirect } from './LegacyWhatsOnRedirect'

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

function renderAt(initialEntry: { pathname: string; search?: string; state?: unknown }) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/events/event" element={<LegacyWhatsOnRedirect origin="events" />} />
        <Route path="/events" element={<LegacyWhatsOnRedirect origin="events" />} />
        <Route path="/events/*" element={<LegacyWhatsOnRedirect origin="events" />} />
        <Route path="/places/place" element={<LegacyWhatsOnRedirect origin="places" />} />
        <Route path="/places" element={<LegacyWhatsOnRedirect origin="places" />} />
        <Route path="/places/*" element={<LegacyWhatsOnRedirect origin="places" />} />
        <Route path="/whats-on" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LegacyWhatsOnRedirect', () => {
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

  describe('when entering /events/event with an event id', () => {
    it('should redirect to /whats-on preserving the query string', () => {
      renderAt({ pathname: '/events/event', search: '?id=f790f8f6-5b63-4e82-bc68-7a2ff6ada90d' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on')
      expect(screen.getByTestId('search')).toHaveTextContent('?id=f790f8f6-5b63-4e82-bc68-7a2ff6ada90d')
    })

    it('should fire Legacy Events Redirected with the preserved id param', () => {
      renderAt({ pathname: '/events/event', search: '?id=f790f8f6-5b63-4e82-bc68-7a2ff6ada90d' })

      expect(trackMock).toHaveBeenCalledTimes(1)
      expect(trackMock).toHaveBeenCalledWith(
        SegmentEvent.LEGACY_EVENTS_REDIRECTED,
        expect.objectContaining({
          source: '/events/event?id=f790f8f6-5b63-4e82-bc68-7a2ff6ada90d',
          destination: '/whats-on?id=f790f8f6-5b63-4e82-bc68-7a2ff6ada90d',
          origin: 'events',
          preservedParams: { id: 'f790f8f6-5b63-4e82-bc68-7a2ff6ada90d' }
        })
      )
    })
  })

  describe('when entering /places/place with a position', () => {
    it('should redirect to /whats-on preserving the query string', () => {
      renderAt({ pathname: '/places/place', search: '?position=144,-7' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on')
      expect(screen.getByTestId('search')).toHaveTextContent('?position=144,-7')
    })

    it('should fire Legacy Places Redirected with the preserved position param', () => {
      renderAt({ pathname: '/places/place', search: '?position=144,-7' })

      expect(trackMock).toHaveBeenCalledWith(
        SegmentEvent.LEGACY_PLACES_REDIRECTED,
        expect.objectContaining({
          source: '/places/place?position=144,-7',
          destination: '/whats-on?position=144,-7',
          origin: 'places',
          preservedParams: { position: '144,-7' }
        })
      )
    })
  })

  describe('when the legacy URL carries no query string', () => {
    it('should redirect to /whats-on with an empty search', () => {
      renderAt({ pathname: '/events/event' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on')
      expect(screen.getByTestId('search')).toHaveTextContent('')
    })

    it('should fire the redirect event with an empty preservedParams', () => {
      renderAt({ pathname: '/events/event' })

      expect(trackMock).toHaveBeenCalledWith(
        SegmentEvent.LEGACY_EVENTS_REDIRECTED,
        expect.objectContaining({ origin: 'events', preservedParams: {} })
      )
    })
  })

  describe('when location.state is provided', () => {
    it('should preserve location.state across the redirect', () => {
      const state = { from: 'legacy' }
      renderAt({ pathname: '/events/event', search: '?id=ev-1', state })

      expect(screen.getByTestId('state')).toHaveTextContent(JSON.stringify(state))
    })
  })

  describe('when entering the legacy root /events', () => {
    it('should redirect to /whats-on and fire Legacy Events Redirected', () => {
      renderAt({ pathname: '/events' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on')
      expect(screen.getByTestId('search')).toHaveTextContent('')
      expect(trackMock).toHaveBeenCalledWith(SegmentEvent.LEGACY_EVENTS_REDIRECTED, expect.objectContaining({ origin: 'events' }))
    })
  })

  describe('when entering the legacy root /places', () => {
    it('should redirect to /whats-on and fire Legacy Places Redirected', () => {
      renderAt({ pathname: '/places' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on')
      expect(trackMock).toHaveBeenCalledWith(SegmentEvent.LEGACY_PLACES_REDIRECTED, expect.objectContaining({ origin: 'places' }))
    })
  })

  describe('when entering an unknown subpath under /events', () => {
    it('should redirect to /whats-on via the catchall and fire Legacy Events Redirected', () => {
      renderAt({ pathname: '/events/listing', search: '?utm_source=newsletter' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on')
      expect(screen.getByTestId('search')).toHaveTextContent('?utm_source=newsletter')
      expect(trackMock).toHaveBeenCalledWith(
        SegmentEvent.LEGACY_EVENTS_REDIRECTED,
        expect.objectContaining({
          source: '/events/listing?utm_source=newsletter',
          destination: '/whats-on?utm_source=newsletter',
          preservedParams: { utm_source: 'newsletter' }
        })
      )
    })
  })

  describe('when entering an unknown subpath under /places', () => {
    it('should redirect to /whats-on via the catchall and fire Legacy Places Redirected', () => {
      renderAt({ pathname: '/places/explore', search: '?filter=trending' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on')
      expect(trackMock).toHaveBeenCalledWith(
        SegmentEvent.LEGACY_PLACES_REDIRECTED,
        expect.objectContaining({ origin: 'places', preservedParams: { filter: 'trending' } })
      )
    })
  })

  describe('when analytics is not initialized on mount', () => {
    beforeEach(() => {
      useAnalyticsMock.mockReturnValue({
        isInitialized: false,
        page: jest.fn(),
        track: trackMock,
        identify: jest.fn()
      })
    })

    it('should not navigate while waiting for analytics', () => {
      renderAt({ pathname: '/events/event', search: '?id=ev-1' })

      expect(screen.queryByTestId('pathname')).not.toBeInTheDocument()
      expect(trackMock).not.toHaveBeenCalled()
    })
  })
})
