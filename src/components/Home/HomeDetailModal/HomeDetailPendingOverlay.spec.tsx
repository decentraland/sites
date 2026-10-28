import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeDetailPendingOverlay } from './HomeDetailPendingOverlay'

jest.mock('@mui/icons-material/Close', () => ({ __esModule: true, default: () => <span data-testid="close-icon" /> }))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('./HomeDetailModal.styled', () => ({
  PendingDialog: ({ open, onClose, children, ...props }: { open: boolean; onClose: () => void; children: React.ReactNode }) =>
    open ? (
      <div
        role="dialog"
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
        onKeyDown={event => event.key === 'Escape' && onClose()}
        tabIndex={-1}
      >
        {children}
      </div>
    ) : null,
  PendingCloseButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
  PendingSpinner: () => <div role="progressbar" />
}))

const onClose = jest.fn()

describe('when rendering the home detail pending overlay', () => {
  beforeEach(() => {
    render(<HomeDetailPendingOverlay onClose={onClose} />)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a busy dialog with a spinner', () => {
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  describe('and the close button is clicked', () => {
    beforeEach(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'event_detail.close' }))
    })

    it('should call onClose', () => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('and the dialog asks to close', () => {
    beforeEach(async () => {
      screen.getByRole('dialog').focus()
      await userEvent.keyboard('{Escape}')
    })

    it('should call onClose', () => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
