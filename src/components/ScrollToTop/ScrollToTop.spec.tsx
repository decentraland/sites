import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScrollToTop } from './ScrollToTop'

function NavigateButton({ to, state }: { to: string; state?: unknown }) {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate(to, state ? { state } : undefined)}>
      go
    </button>
  )
}

function renderWithRouter(initialEntries: Array<string | { pathname: string; state?: unknown }> = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<NavigateButton to="/other" />} />
        <Route path="/other" element={<NavigateButton to="/with-state" state={{ activeTab: 'my' }} />} />
        <Route path="/with-state" element={<span>with state</span>} />
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
    it('should scroll to the top of the window', () => {
      renderWithRouter()

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0 })
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

  it('should not render any visible output', () => {
    const { container } = render(
      <MemoryRouter>
        <ScrollToTop />
      </MemoryRouter>
    )

    expect(container).toBeEmptyDOMElement()
  })
})
