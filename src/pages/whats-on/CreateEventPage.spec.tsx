import { fireEvent, render, screen } from '@testing-library/react'
import { CreateEventPage } from './CreateEventPage'

const mockNavigate = jest.fn()
let mockIdentityReturn: { hasValidIdentity: boolean }

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('./CreateEventPage.styled', () => ({
  BackArrowIcon: () => <span data-testid="back-arrow" />,
  BackButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button data-testid="back-button" {...props}>
      {children}
    </button>
  ),
  HeaderRow: ({ children }: { children: React.ReactNode }) => <div data-testid="header-row">{children}</div>,
  PageBackground: () => <div data-testid="page-background" />,
  PageContent: ({ children }: { children: React.ReactNode }) => <main data-testid="page-content">{children}</main>,
  PageTitle: ({ children }: { children: React.ReactNode }) => <h1 data-testid="page-title">{children}</h1>
}))

jest.mock('../../components/whats-on/CreateEvent/EventForm', () => ({
  EventForm: ({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) => (
    <div data-testid="event-form">
      <button data-testid="form-cancel" onClick={onCancel}>
        cancel
      </button>
      <button data-testid="form-success" onClick={onSuccess}>
        success
      </button>
    </div>
  )
}))

jest.mock('../../components/whats-on/CreateEvent/CreateEventSuccess', () => ({
  CreateEventSuccess: () => <div data-testid="create-event-success" />
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => mockIdentityReturn
}))

describe('CreateEventPage', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the user is not authenticated', () => {
    beforeEach(() => {
      mockIdentityReturn = { hasValidIdentity: false }
    })

    it('should redirect to /whats-on', () => {
      render(<CreateEventPage />)

      expect(mockNavigate).toHaveBeenCalledWith('/whats-on', { replace: true })
    })

    it('should render nothing in the page body', () => {
      render(<CreateEventPage />)

      expect(screen.queryByTestId('event-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('create-event-success')).not.toBeInTheDocument()
    })
  })

  describe('when the user is authenticated and has not submitted yet', () => {
    beforeEach(() => {
      mockIdentityReturn = { hasValidIdentity: true }
    })

    it('should render the event form', () => {
      render(<CreateEventPage />)

      expect(screen.getByTestId('event-form')).toBeInTheDocument()
    })

    it('should not render the success screen', () => {
      render(<CreateEventPage />)

      expect(screen.queryByTestId('create-event-success')).not.toBeInTheDocument()
    })

    it('should navigate to /whats-on when the back button is clicked', () => {
      render(<CreateEventPage />)

      fireEvent.click(screen.getByTestId('back-button'))

      expect(mockNavigate).toHaveBeenCalledWith('/whats-on')
    })

    it('should navigate to /whats-on when the form cancel callback fires', () => {
      render(<CreateEventPage />)

      fireEvent.click(screen.getByTestId('form-cancel'))

      expect(mockNavigate).toHaveBeenCalledWith('/whats-on')
    })
  })

  describe('when the event form reports a successful submission', () => {
    beforeEach(() => {
      mockIdentityReturn = { hasValidIdentity: true }
    })

    it('should render the success screen and hide the form', () => {
      render(<CreateEventPage />)

      fireEvent.click(screen.getByTestId('form-success'))

      expect(screen.getByTestId('create-event-success')).toBeInTheDocument()
      expect(screen.queryByTestId('event-form')).not.toBeInTheDocument()
    })
  })
})
