import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
// Import through the barrel so the re-export contract is exercised too.
import { DiscoverLayout } from '.'

// Run the real DiscoverLayout.styled.ts through the shared styled shim instead
// of the emotion engine (decentraland-ui2 ships ESM Jest can't transform).
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))

// The jump-in provider pulls ESM-only packages (@dcl/hooks, ui2 DownloadModal)
// that Jest can't parse; stub it to a passthrough — its own spec covers it.
jest.mock('../DiscoverJumpInProvider', () => ({
  DiscoverJumpInProvider: ({ children }: { children: ReactNode }) => children
}))

describe('DiscoverLayout', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when a discover child route renders inside the layout', () => {
    it('should mount the child through the Outlet inside the page container', () => {
      render(
        <MemoryRouter initialEntries={['/discover']}>
          <Routes>
            <Route element={<DiscoverLayout />}>
              <Route path="/discover" element={<span>discover home</span>} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText('discover home')).toBeInTheDocument()
    })
  })
})
