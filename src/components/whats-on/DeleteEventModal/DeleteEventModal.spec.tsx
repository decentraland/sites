import { fireEvent, render, screen } from '@testing-library/react'
import { DeleteEventModal } from './DeleteEventModal'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('./DeleteEventModal.styled', () => ({
  StyledDialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div role="dialog">{children}</div> : null),
  Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  Subtitle: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CancelActionButton: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  StyledDialogActions: ({ children }: { children: React.ReactNode }) => <div data-testid="actions">{children}</div>
}))

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}))

describe('DeleteEventModal', () => {
  let onClose: jest.Mock
  let onConfirm: jest.Mock

  beforeEach(() => {
    onClose = jest.fn()
    onConfirm = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when open is false', () => {
    it('should not render the dialog', () => {
      render(<DeleteEventModal open={false} isSubmitting={false} onClose={onClose} onConfirm={onConfirm} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('when opened', () => {
    beforeEach(() => {
      render(<DeleteEventModal open isSubmitting={false} onClose={onClose} onConfirm={onConfirm} />)
    })

    it('should render the confirmation title', () => {
      expect(screen.getByRole('heading')).toHaveTextContent('event_detail.delete_modal.title')
    })

    it('should render the permanent-removal subtitle', () => {
      expect(screen.getByText('event_detail.delete_modal.subtitle')).toBeInTheDocument()
    })

    describe('and the confirm button is clicked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('button', { name: 'event_detail.delete_modal.confirm' }))
      })

      it('should call onConfirm', () => {
        expect(onConfirm).toHaveBeenCalledTimes(1)
      })
    })

    describe('and the cancel button is clicked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('button', { name: 'event_detail.delete_modal.cancel' }))
      })

      it('should call onClose', () => {
        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('when submitting', () => {
    beforeEach(() => {
      render(<DeleteEventModal open isSubmitting onClose={onClose} onConfirm={onConfirm} />)
    })

    it('should disable both buttons', () => {
      expect(screen.getByRole('button', { name: 'event_detail.delete_modal.confirm' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'event_detail.delete_modal.cancel' })).toBeDisabled()
    })

    describe('and the cancel button is clicked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('button', { name: 'event_detail.delete_modal.cancel' }))
      })

      it('should not call onClose while a delete is in flight', () => {
        expect(onClose).not.toHaveBeenCalled()
      })
    })
  })
})
