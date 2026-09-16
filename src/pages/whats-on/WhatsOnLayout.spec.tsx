import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { WhatsOnLayout } from './WhatsOnLayout'

jest.mock('../../components/whats-on/AdminTabsBar', () => ({
  AdminTabsBar: () => <div data-testid="admin-tabs-bar" />
}))

// Render Helmet's children inline so the requested <title> is assertable.
jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'helmet' }, children)
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null) => id ?? ''
}))

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/events']}>
      <Routes>
        <Route element={<WhatsOnLayout />}>
          <Route path="/events" element={<span>child</span>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('when rendering WhatsOnLayout', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the admin tabs bar', () => {
    renderLayout()

    expect(screen.getByTestId('admin-tabs-bar')).toBeInTheDocument()
  })

  it('should render the outlet child route', () => {
    renderLayout()

    expect(screen.getByText('child')).toBeInTheDocument()
  })

  /**
   * The worker stamps the served <head> for the requested URL and the /whats-on → /events
   * redirect is client-side, so the section owning its title is what keeps the tab correct.
   */
  it('should title the section so a redirect cannot leave the old title in the tab', () => {
    renderLayout()

    expect(screen.getByTestId('helmet')).toHaveTextContent('page.events.page_title')
  })
})
