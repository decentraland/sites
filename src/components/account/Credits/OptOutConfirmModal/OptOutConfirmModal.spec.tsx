import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { OptOutConfirmModal } from './OptOutConfirmModal'

type ChildrenProps = { children?: ReactNode }
type ButtonProps = ChildrenProps & { onClick?: () => void; disabled?: boolean; 'data-role'?: string }
type DialogProps = ChildrenProps & { open?: boolean }
type IconButtonProps = ChildrenProps & { onClick?: () => void; 'aria-label'?: string }

jest.mock('@mui/icons-material/CloseRounded', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick, disabled, 'data-role': dataRole }: ButtonProps) => (
    <button type="button" data-role={dataRole} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}))

jest.mock('./OptOutConfirmModal.styled', () => ({
  StyledDialog: ({ children, open }: DialogProps) => (open ? <div role="dialog">{children}</div> : null),
  Header: ({ children }: ChildrenProps) => <div>{children}</div>,
  Title: ({ children }: ChildrenProps) => <div>{children}</div>,
  CloseButton: ({ children, onClick, 'aria-label': ariaLabel }: IconButtonProps) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
  Description: ({ children }: ChildrenProps) => <div>{children}</div>,
  ErrorText: ({ children }: ChildrenProps) => <div data-role="credits-leave-error">{children}</div>,
  Actions: ({ children }: ChildrenProps) => <div>{children}</div>
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

describe('OptOutConfirmModal', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when closed', () => {
    it('should not render the dialog', () => {
      render(<OptOutConfirmModal open={false} isLeaving={false} errorKey={null} onConfirm={jest.fn()} onClose={jest.fn()} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('when open', () => {
    it('should invoke onConfirm when the confirm button is clicked', () => {
      const onConfirm = jest.fn()
      render(<OptOutConfirmModal open isLeaving={false} errorKey={null} onConfirm={onConfirm} onClose={jest.fn()} />)

      fireEvent.click(screen.getByText('account.credits.leave_modal.confirm'))
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('should invoke onClose when the cancel button is clicked', () => {
      const onClose = jest.fn()
      render(<OptOutConfirmModal open isLeaving={false} errorKey={null} onConfirm={jest.fn()} onClose={onClose} />)

      fireEvent.click(screen.getByText('account.credits.leave_modal.cancel'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should disable both buttons while the opt-out is in flight', () => {
      render(<OptOutConfirmModal open isLeaving errorKey={null} onConfirm={jest.fn()} onClose={jest.fn()} />)

      expect(screen.getByText('account.credits.leave_modal.confirm')).toBeDisabled()
      expect(screen.getByText('account.credits.leave_modal.cancel')).toBeDisabled()
    })

    it('should render the mapped error message when an errorKey is provided', () => {
      render(
        <OptOutConfirmModal
          open
          isLeaving={false}
          errorKey="account.credits.leave_modal.errors.already_claimed"
          onConfirm={jest.fn()}
          onClose={jest.fn()}
        />
      )

      expect(screen.getByText('account.credits.leave_modal.errors.already_claimed')).toBeInTheDocument()
    })
  })
})
