import { fireEvent, render, screen } from '@testing-library/react'
import { RejectEventModal } from './RejectEventModal'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('./RejectEventModal.styled', () => ({
  StyledDialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div role="dialog">{children}</div> : null),
  Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  StyledDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  StyledDialogActions: ({ children }: { children: React.ReactNode }) => <div data-testid="actions">{children}</div>,
  ReasonsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ReasonRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ReasonLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  NotesField: ({ label, value, onChange }: { label: string; value: string; onChange: (event: { target: { value: string } }) => void }) => (
    <label>
      {label}
      <textarea aria-label={label} value={value} onChange={onChange} />
    </label>
  ),
  ErrorText: ({ children }: { children: React.ReactNode }) => <span role="alert">{children}</span>
}))

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Checkbox: ({ checked, onChange, inputProps }: { checked: boolean; onChange: () => void; inputProps?: { 'aria-label'?: string } }) => (
    <input type="checkbox" role="checkbox" checked={checked} onChange={onChange} aria-label={inputProps?.['aria-label']} />
  )
}))

describe('RejectEventModal', () => {
  let onClose: jest.Mock
  let onSubmit: jest.Mock

  beforeEach(() => {
    onClose = jest.fn()
    onSubmit = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when open is false', () => {
    it('should not render the dialog', () => {
      render(<RejectEventModal open={false} isSubmitting={false} onClose={onClose} onSubmit={onSubmit} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('when opened', () => {
    beforeEach(() => {
      render(<RejectEventModal open isSubmitting={false} onClose={onClose} onSubmit={onSubmit} />)
    })

    it('should render the five reject reason checkboxes', () => {
      expect(screen.getByRole('checkbox', { name: 'whats_on_admin.reject_modal.reasons.invalid_image.title' })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'whats_on_admin.reject_modal.reasons.invalid_event_name.title' })).toBeInTheDocument()
      expect(
        screen.getByRole('checkbox', { name: 'whats_on_admin.reject_modal.reasons.inappropriate_description.title' })
      ).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'whats_on_admin.reject_modal.reasons.invalid_duration.title' })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'whats_on_admin.reject_modal.reasons.invalid_location.title' })).toBeInTheDocument()
    })

    describe('and submit is clicked with no reasons selected', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('button', { name: 'whats_on_admin.reject_modal.submit' }))
      })

      it('should show the required-reason error', () => {
        expect(screen.getByRole('alert')).toHaveTextContent('whats_on_admin.reject_modal.error_required')
      })

      it('should not call onSubmit', () => {
        expect(onSubmit).not.toHaveBeenCalled()
      })
    })

    describe('and a reason and notes are provided', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('checkbox', { name: 'whats_on_admin.reject_modal.reasons.invalid_image.title' }))
        fireEvent.change(screen.getByLabelText('whats_on_admin.reject_modal.other_label'), { target: { value: '  extra detail  ' } })
        fireEvent.click(screen.getByRole('button', { name: 'whats_on_admin.reject_modal.submit' }))
      })

      it('should submit the selected reasons and trimmed notes', () => {
        expect(onSubmit).toHaveBeenCalledWith({ reasons: ['invalid_image'], notes: 'extra detail' })
      })
    })

    describe('and cancel is clicked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('button', { name: 'whats_on_admin.reject_modal.cancel' }))
      })

      it('should call onClose', () => {
        expect(onClose).toHaveBeenCalled()
      })
    })
  })

  describe('when submitting', () => {
    beforeEach(() => {
      render(<RejectEventModal open isSubmitting onClose={onClose} onSubmit={onSubmit} />)
    })

    it('should disable the submit and cancel buttons', () => {
      expect(screen.getByRole('button', { name: 'whats_on_admin.reject_modal.submit' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'whats_on_admin.reject_modal.cancel' })).toBeDisabled()
    })
  })
})
