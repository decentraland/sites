import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { WhatsOnLayout } from './WhatsOnLayout'

jest.mock('../../components/whats-on/AdminTabsBar', () => ({
  AdminTabsBar: () => <div data-testid="admin-tabs-bar" />
}))

describe('when rendering WhatsOnLayout', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the admin tabs bar', () => {
    render(
      <MemoryRouter initialEntries={['/whats-on']}>
        <Routes>
          <Route element={<WhatsOnLayout />}>
            <Route path="/whats-on" element={<span>child</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByTestId('admin-tabs-bar')).toBeInTheDocument()
  })

  it('should render the outlet child route', () => {
    render(
      <MemoryRouter initialEntries={['/whats-on']}>
        <Routes>
          <Route element={<WhatsOnLayout />}>
            <Route path="/whats-on" element={<span>child</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})
