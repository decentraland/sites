import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScrollToTop } from './ScrollToTop'

function NavigateButton({ label, to, state, delta }: { label: string; to?: string; state?: unknown; delta?: number }) {
  const navigate = useNavigate()
  const handleClick = () => {
    if (typeof delta === 'number') {
      navigate(delta)
      return
    }
    if (to !== undefined) {
      navigate(to, state ? { state } : undefined)
    }
  }
  return (
    <button type="button" onClick={handleClick}>
      {label}
    </button>
  )
}

function renderWithRouter(initialEntries: Array<string | { pathname: string; state?: unknown }> = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <NavigateButton label="go" to="/other" />
              <NavigateButton label="forward" delta={1} />
            </>
          }
        />
        <Route
          path="/other"
          element={
            <>
              <NavigateButton label="go" to="/with-state" state={{ activeTab: 'my' }} />
              <NavigateButton label="back" delta={-1} />
            </>
          }
        />
        <Route path="/with-state" element={<NavigateButton label="back" delta={-1} />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ScrollToTop', () => {
  let scrollToSpy: jest.SpyInstance

  beforeEach(() => {
    scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the app mounts', () => {
    it('should not scroll so the browser can restore a hash or prior position', () => {
      renderWithRouter()

      expect(scrollToSpy).not.toHaveBeenCalled()
    })
  })

  describe('when navigating to a new pathname without state', () => {
    it('should scroll to the top of the window on the new route', async () => {
      const user = userEvent.setup()
      renderWithRouter()
      scrollToSpy.mockClear()

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'go' }))
      })

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0 })
    })
  })

  describe('when navigating with a state payload', () => {
    it('should still scroll to the top of the window so the destination page can scroll to its own section after load', async () => {
      const user = userEvent.setup()
      renderWithRouter(['/other'])
      scrollToSpy.mockClear()

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'go' }))
      })

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0 })
    })
  })

  describe('when the user navigates back via the browser (POP)', () => {
    it('should not scroll so the browser can restore the previous position', async () => {
      const user = userEvent.setup()
      renderWithRouter()

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'go' }))
      })
      scrollToSpy.mockClear()

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'back' }))
      })

      expect(scrollToSpy).not.toHaveBeenCalled()
    })
  })

  it('should not render any visible output', () => {
    const { container } = render(
      <MemoryRouter>
        <ScrollToTop />
      </MemoryRouter>
    )

    expect(container).toBeEmptyDOMElement()
  })
})
