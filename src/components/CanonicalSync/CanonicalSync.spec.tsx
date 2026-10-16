import { useEffect } from 'react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CanonicalSync } from './CanonicalSync'

function getCanonicalHref(): string | undefined {
  return document.querySelector<HTMLLinkElement>("link[rel='canonical']")?.href
}

function setCanonical(href: string | null) {
  document.head.querySelectorAll("link[rel='canonical']").forEach(node => node.remove())
  if (href === null) return
  const link = document.createElement('link')
  link.rel = 'canonical'
  link.href = href
  document.head.appendChild(link)
}

function NavigateButton({ to }: { to: string }) {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate(to)}>
      go
    </button>
  )
}

function renderAt(path: string, element: JSX.Element = <NavigateButton to="/wallets" />) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CanonicalSync />
      <Routes>
        <Route path="*" element={element} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CanonicalSync', () => {
  afterEach(() => {
    setCanonical(null)
  })

  describe('when the static homepage canonical is served on another route', () => {
    beforeEach(() => {
      setCanonical('https://decentraland.org/')
      renderAt('/play')
    })

    it('should point the canonical at the current route on the same origin', () => {
      expect(getCanonicalHref()).toBe('https://decentraland.org/play')
    })
  })

  describe('when navigating client-side to another route', () => {
    beforeEach(async () => {
      setCanonical('https://decentraland.org/')
      renderAt('/play')
      await userEvent.click(screen.getByRole('button', { name: 'go' }))
    })

    it('should follow the new route', () => {
      expect(getCanonicalHref()).toBe('https://decentraland.org/wallets')
    })
  })

  describe('when the canonical already matches the route with query params', () => {
    beforeEach(() => {
      setCanonical('https://decentraland.org/jump/events?id=abc')
      renderAt('/jump/events')
    })

    it('should leave the canonical untouched', () => {
      expect(getCanonicalHref()).toBe('https://decentraland.org/jump/events?id=abc')
    })
  })

  describe('when the page has no canonical link', () => {
    beforeEach(() => {
      setCanonical(null)
      renderAt('/play')
    })

    it('should not create one', () => {
      expect(getCanonicalHref()).toBeUndefined()
    })
  })

  describe('when a child effect reads the canonical on mount', () => {
    let seenByChild: string | undefined

    beforeEach(() => {
      setCanonical('https://decentraland.org/')
      function Reader() {
        useEffect(() => {
          seenByChild = getCanonicalHref()
        }, [])
        return null
      }
      renderAt('/play', <Reader />)
    })

    it('should already see the route canonical', () => {
      expect(seenByChild).toBe('https://decentraland.org/play')
    })
  })
})
