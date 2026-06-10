import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { CreatorsLayout } from './CreatorsLayout'

jest.mock('./CreatorsLayout.styled', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="creators-page">{children}</div>
}))

describe('CreatorsLayout', () => {
  it('should render its child route inside the page container', () => {
    render(
      <MemoryRouter initialEntries={['/creators']}>
        <Routes>
          <Route element={<CreatorsLayout />}>
            <Route path="/creators" element={<div data-testid="child">child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByTestId('creators-page')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
