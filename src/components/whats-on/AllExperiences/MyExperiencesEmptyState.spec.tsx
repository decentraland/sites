import { fireEvent, render, screen } from '@testing-library/react'
import { MyExperiencesEmptyState } from './MyExperiencesEmptyState'

jest.mock('./MyExperiencesEmptyState.styled', () => ({
  EmptyPanel: ({ children, ...props }: Record<string, unknown>) => <div {...props}>{children as React.ReactNode}</div>,
  EmptyTitle: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  EmptyButton: ({ children, onClick, startIcon: _startIcon }: Record<string, unknown>) => (
    <button onClick={onClick as React.MouseEventHandler}>{children as React.ReactNode}</button>
  )
}))

jest.mock('@mui/icons-material/Add', () => ({
  __esModule: true,
  default: () => <span data-testid="add-icon" />
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'my_hangouts.empty_title': "You don't have any hangout created",
        'my_hangouts.empty_cta': 'Create Hangout'
      }
      return translations[key] ?? key
    }
  })
}))

describe('MyExperiencesEmptyState', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the empty title and CTA label', () => {
    render(<MyExperiencesEmptyState />)

    expect(screen.getByText("You don't have any hangout created")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Hangout/ })).toBeInTheDocument()
  })

  describe('when clicking the CTA', () => {
    it('should navigate to the new-hangout route', () => {
      render(<MyExperiencesEmptyState />)

      fireEvent.click(screen.getByRole('button', { name: /Create Hangout/ }))

      expect(mockNavigate).toHaveBeenCalledWith('/whats-on/new-hangout')
    })
  })
})
