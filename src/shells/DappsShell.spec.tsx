import React from 'react'
import { Helmet } from 'react-helmet-async'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render } from '@testing-library/react'
import { DappsShell } from './DappsShell'

jest.mock('./store', () => ({
  store: { getState: () => ({}), subscribe: () => () => undefined, dispatch: () => undefined }
}))

jest.mock('../config/env', () => ({
  getEnv: (key: string) => {
    const values: Record<string, string> = {
      PEER_URL: 'https://peer.decentraland.org',
      PLACES_API_URL: 'https://places.decentraland.org/api',
      GATEKEEPER_URL: 'https://comms-gatekeeper.decentraland.org',
      WORLDS_CONTENT_SERVER_URL: 'https://worlds-content-server.decentraland.org'
    }
    return values[key]
  }
}))

jest.mock('decentraland-ui2', () => ({
  CircularProgress: () => <div data-testid="loader" />
}))

jest.mock('../App.styled', () => ({
  CenteredBox: ({ children }: { children: React.ReactNode }) => <div data-testid="centered">{children}</div>
}))

function renderShell() {
  return render(
    <MemoryRouter>
      <DappsShell />
    </MemoryRouter>
  )
}

function renderShellRouteWithHelmet() {
  return render(
    <MemoryRouter initialEntries={['/with-helmet']}>
      <Routes>
        <Route element={<DappsShell />}>
          <Route
            path="/with-helmet"
            element={
              <Helmet>
                <title>Shell Child</title>
              </Helmet>
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('DappsShell', () => {
  afterEach(() => {
    document.head.querySelectorAll('link[rel="preconnect"]').forEach(link => link.remove())
  })

  it('should render without throwing', () => {
    expect(() => renderShell()).not.toThrow()
  })

  it('should provide Helmet context to nested routes', () => {
    expect(() => renderShellRouteWithHelmet()).not.toThrow()
  })

  it('should inject a preconnect link for PEER_URL', () => {
    renderShell()
    const link = document.head.querySelector('link[rel="preconnect"][href="https://peer.decentraland.org"]')
    expect(link).not.toBeNull()
    expect(link?.getAttribute('crossorigin')).toBe('anonymous')
  })

  it('should inject a preconnect link for PLACES_API_URL origin', () => {
    renderShell()
    const link = document.head.querySelector('link[rel="preconnect"][href="https://places.decentraland.org"]')
    expect(link).not.toBeNull()
  })

  it('should inject a preconnect link for GATEKEEPER_URL origin', () => {
    renderShell()
    const link = document.head.querySelector('link[rel="preconnect"][href="https://comms-gatekeeper.decentraland.org"]')
    expect(link).not.toBeNull()
  })

  it('should inject a preconnect link for WORLDS_CONTENT_SERVER_URL origin', () => {
    renderShell()
    const link = document.head.querySelector('link[rel="preconnect"][href="https://worlds-content-server.decentraland.org"]')
    expect(link).not.toBeNull()
  })

  it('should remove injected preconnect links on unmount', () => {
    const { unmount } = renderShell()
    expect(document.head.querySelectorAll('link[rel="preconnect"]').length).toBeGreaterThan(0)
    unmount()
    expect(document.head.querySelectorAll('link[rel="preconnect"]').length).toBe(0)
  })

  it('should not duplicate a preconnect link that is already present in the head', () => {
    const existing = document.createElement('link')
    existing.rel = 'preconnect'
    existing.href = 'https://peer.decentraland.org'
    document.head.appendChild(existing)

    renderShell()

    const peerLinks = document.head.querySelectorAll('link[rel="preconnect"][href="https://peer.decentraland.org"]')
    expect(peerLinks.length).toBe(1)
  })
})
