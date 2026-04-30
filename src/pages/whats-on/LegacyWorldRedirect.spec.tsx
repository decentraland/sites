import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { LegacyWorldRedirect } from './LegacyWorldRedirect'

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
})
