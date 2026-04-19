import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { DappsShell } from './DappsShell'

jest.mock('./store', () => ({
  store: { getState: () => ({}), subscribe: () => () => undefined, dispatch: () => undefined }
}))

jest.mock('../config/env', () => ({
  getEnv: (key: string) => {
    const values: Record<string, string> = {
      PEER_URL: 'https://peer.decentraland.org',
      PLACES_API_URL: 'https://places.decentraland.org/api'
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

describe('DappsShell', () => {
  afterEach(() => {
    document.head.querySelectorAll('link[rel="preconnect"]').forEach(link => link.remove())
  })

  it('should render without throwing', () => {
    expect(() => renderShell()).not.toThrow()
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

  it('should remove injected preconnect links on unmount', () => {
    const { unmount } = renderShell()
    expect(document.head.querySelectorAll('link[rel="preconnect"]').length).toBeGreaterThan(0)
    unmount()
    expect(document.head.querySelectorAll('link[rel="preconnect"]').length).toBe(0)
  })
})
