import { fireEvent, render, screen } from '@testing-library/react'
import { CreateEventSuccess } from './CreateEventSuccess'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('@mui/icons-material/Check', () => ({
  __esModule: true,
  default: () => <span data-testid="check-icon" />
}))

jest.mock('./CreateEventSuccess.styled', () => ({
  ActionsRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CheckCircle: ({ children }: { children: React.ReactNode }) => <div data-testid="check-circle">{children}</div>,
  PrimaryButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button data-testid="primary-button" {...props}>
      {children}
    </button>
  ),
  SecondaryButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button data-testid="secondary-button" {...props}>
      {children}
    </button>
  ),
  SuccessContainer: ({ children }: { children: React.ReactNode }) => <section data-testid="success-container">{children}</section>,
  SuccessMessage: ({ children }: { children: React.ReactNode }) => <p data-testid="success-message">{children}</p>,
  SuccessOverlay: ({ children }: { children: React.ReactNode }) => <div data-testid="success-overlay">{children}</div>
}))

describe('CreateEventSuccess', () => {
  afterEach(() => {
    jest.resetAllMocks()
    document.body.style.overflow = ''
  })

  describe('when rendered', () => {
    it('should render the success container', () => {
      render(<CreateEventSuccess />)

      expect(screen.getByTestId('success-container')).toBeInTheDocument()
    })

    it('should render the check icon inside the circle', () => {
      render(<CreateEventSuccess />)

      expect(screen.getByTestId('check-circle')).toContainElement(screen.getByTestId('check-icon'))
    })

    it('should render the translated success message', () => {
      render(<CreateEventSuccess />)

      expect(screen.getByTestId('success-message')).toHaveTextContent('create_event.success_message')
    })

    it('should render the back-to-explore secondary button', () => {
      render(<CreateEventSuccess />)

      expect(screen.getByTestId('secondary-button')).toHaveTextContent('create_event.back_to_explore')
    })

    it('should render the my-events primary button', () => {
      render(<CreateEventSuccess />)

      expect(screen.getByTestId('primary-button')).toHaveTextContent('create_event.my_events')
    })
  })

  describe('when the back-to-explore button is clicked', () => {
    it('should navigate to /whats-on', () => {
      render(<CreateEventSuccess />)

      fireEvent.click(screen.getByTestId('secondary-button'))

      expect(mockNavigate).toHaveBeenCalledWith('/whats-on')
    })
  })

  describe('when the my-events button is clicked', () => {
    it('should navigate to /whats-on', () => {
      render(<CreateEventSuccess />)

      fireEvent.click(screen.getByTestId('primary-button'))

      expect(mockNavigate).toHaveBeenCalledWith('/whats-on')
    })
  })

  describe('when mounted', () => {
    it('should lock body scroll on mount and clear it on unmount', () => {
      const { unmount } = render(<CreateEventSuccess />)

      expect(document.body.style.overflow).toBe('hidden')

      unmount()

      expect(document.body.style.overflow).toBe('')
    })
  })
})
