import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { useAnalytics } from '@dcl/hooks'
import { SegmentEvent } from '../../modules/segment'
import { LegacyWorldRedirect } from './LegacyWorldRedirect'

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
        <Route path="/places/world" element={<LegacyWorldRedirect />} />
        <Route path="/whats-on" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LegacyWorldRedirect', () => {
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

  describe('when entering /places/world with a name param', () => {
    it('should redirect to /whats-on renaming name to world', () => {
      renderAt({ pathname: '/places/world', search: '?name=fairyland.dcl.eth' })

      const search = screen.getByTestId('search').textContent ?? ''
      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on')
      expect(new URLSearchParams(search).get('world')).toBe('fairyland.dcl.eth')
      expect(new URLSearchParams(search).has('name')).toBe(false)
    })

    it('should preserve other query params alongside the rename', () => {
      renderAt({ pathname: '/places/world', search: '?name=fairyland.dcl.eth&utm_source=twitter' })

      const search = screen.getByTestId('search').textContent ?? ''
      const params = new URLSearchParams(search)
      expect(params.get('world')).toBe('fairyland.dcl.eth')
      expect(params.get('utm_source')).toBe('twitter')
      expect(params.has('name')).toBe(false)
    })

    it('should fire Legacy Places Redirected with world (not name) in preservedParams', () => {
      renderAt({ pathname: '/places/world', search: '?name=fairyland.dcl.eth&utm_source=twitter' })

      expect(trackMock).toHaveBeenCalledWith(
        SegmentEvent.LEGACY_PLACES_REDIRECTED,
        expect.objectContaining({
          source: '/places/world?name=fairyland.dcl.eth&utm_source=twitter',
          destination: '/whats-on?utm_source=twitter&world=fairyland.dcl.eth',
          origin: 'places',
          preservedParams: { utm_source: 'twitter', world: 'fairyland.dcl.eth' }
        })
      )
    })
  })

  describe('when /places/world carries no name param', () => {
    it('should redirect to /whats-on preserving any unrelated query string', () => {
      renderAt({ pathname: '/places/world', search: '?utm_source=newsletter' })

      const search = screen.getByTestId('search').textContent ?? ''
      const params = new URLSearchParams(search)
      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on')
      expect(params.get('utm_source')).toBe('newsletter')
      expect(params.has('world')).toBe(false)
    })

    it('should redirect to /whats-on with an empty search when there is no query string', () => {
      renderAt({ pathname: '/places/world' })

      expect(screen.getByTestId('pathname')).toHaveTextContent('/whats-on')
      expect(screen.getByTestId('search')).toHaveTextContent('')
    })

    it('should skip the rename when name is the empty string', () => {
      renderAt({ pathname: '/places/world', search: '?name=&utm_source=newsletter' })

      const search = screen.getByTestId('search').textContent ?? ''
      const params = new URLSearchParams(search)
      expect(params.has('world')).toBe(false)
      expect(params.get('utm_source')).toBe('newsletter')
    })

    it('should fire Legacy Places Redirected without a world param in preservedParams', () => {
      renderAt({ pathname: '/places/world' })

      expect(trackMock).toHaveBeenCalledWith(
        SegmentEvent.LEGACY_PLACES_REDIRECTED,
        expect.objectContaining({ origin: 'places', preservedParams: {} })
      )
    })
  })

  describe('when name carries URL-encoded characters', () => {
    it('should round-trip the encoding into the world param', () => {
      renderAt({ pathname: '/places/world', search: '?name=foo%20bar.dcl.eth' })

      const search = screen.getByTestId('search').textContent ?? ''
      expect(new URLSearchParams(search).get('world')).toBe('foo bar.dcl.eth')
    })
  })

  describe('when name appears multiple times in the query string', () => {
    it('should keep the first value as world and drop the rest', () => {
      renderAt({ pathname: '/places/world', search: '?name=first.dcl.eth&name=second.dcl.eth' })

      const search = screen.getByTestId('search').textContent ?? ''
      const params = new URLSearchParams(search)
      expect(params.getAll('world')).toEqual(['first.dcl.eth'])
      expect(params.has('name')).toBe(false)
    })
  })

  describe('when location.state is provided', () => {
    it('should preserve location.state across the redirect', () => {
      const state = { from: 'legacy-world' }
      renderAt({ pathname: '/places/world', search: '?name=fairyland.dcl.eth', state })

      expect(screen.getByTestId('state')).toHaveTextContent(JSON.stringify(state))
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
      renderAt({ pathname: '/places/world', search: '?name=fairyland.dcl.eth' })

      expect(screen.queryByTestId('pathname')).not.toBeInTheDocument()
      expect(trackMock).not.toHaveBeenCalled()
    })
  })
})
