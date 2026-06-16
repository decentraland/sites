import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import type { SubscriptionDetails } from '@dcl/schemas'
import { EmailCard } from './EmailCard'

type ChildrenProps = { children?: ReactNode }
type BadgeProps = ChildrenProps & { $confirmed?: boolean; 'data-role'?: string }
type InputProps = {
  value?: string
  onChange?: (event: { target: { value: string } }) => void
  error?: boolean
  helperText?: ReactNode
  disabled?: boolean
  placeholder?: string
  'data-role'?: string
}
type ButtonProps = ChildrenProps & { onClick?: () => void; disabled?: boolean; 'data-role'?: string }

const mockSetEmail = jest.fn()
let mockIsLoading = false

jest.mock('../../../../features/account-notifications/account-notifications.client', () => ({
  useSetEmailMutation: () => [mockSetEmail, { isLoading: mockIsLoading }]
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('decentraland-ui2', () => ({
  CircularProgress: () => <span data-testid="spinner" />,
  Switch: ({
    checked,
    disabled,
    onChange
  }: {
    checked?: boolean
    disabled?: boolean
    onChange?: (event: unknown, checked: boolean) => void
  }) => (
    <input
      type="checkbox"
      role="switch"
      checked={!!checked}
      disabled={disabled}
      onChange={event => onChange?.(event, event.target.checked)}
    />
  )
}))

jest.mock('@dcl/schemas', () => ({
  Email: { validate: (value: string) => /.+@.+\..+/.test(value) }
}))

jest.mock('../../../../features/account-notifications/account-notifications.helpers', () => ({
  isAllEmailEnabled: (details: { ignore_all_email?: boolean }) => !details.ignore_all_email
}))

jest.mock('./EmailCard.styled', () => ({
  Card: ({ children, 'data-role': dataRole }: BadgeProps) => <div data-role={dataRole}>{children}</div>,
  HeadingRow: ({ children }: ChildrenProps) => <div>{children}</div>,
  Heading: ({ children }: ChildrenProps) => <div>{children}</div>,
  StatusBadge: ({ children, 'data-role': dataRole }: BadgeProps) => <span data-role={dataRole}>{children}</span>,
  Description: ({ children, 'data-role': dataRole }: BadgeProps) => <p data-role={dataRole}>{children}</p>,
  InputRow: ({ children }: ChildrenProps) => <div>{children}</div>,
  EmailInput: ({ value, onChange, disabled, error, helperText, placeholder, 'data-role': dataRole }: InputProps) => (
    <span>
      <input
        data-role={dataRole}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        aria-invalid={error}
        onChange={event => onChange?.({ target: { value: event.target.value } })}
      />
      {helperText ? <span data-testid="helper">{helperText}</span> : null}
    </span>
  ),
  SaveButton: ({ children, onClick, disabled, 'data-role': dataRole }: ButtonProps) => (
    <button type="button" data-role={dataRole} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}))

describe('EmailCard', () => {
  beforeEach(() => {
    mockIsLoading = false
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when there is no email yet', () => {
    it('should show the submit label and the without-email description', () => {
      render(<EmailCard />)
      expect(screen.getByText('account.notifications.email.description.without_email')).toBeInTheDocument()
      expect(screen.getByText('account.notifications.email.button.submit')).toBeInTheDocument()
    })

    it('should not save and should show an error for an invalid email', () => {
      render(<EmailCard />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'not-an-email' } })
      fireEvent.click(screen.getByRole('button'))
      expect(mockSetEmail).not.toHaveBeenCalled()
      expect(screen.getByTestId('helper')).toHaveTextContent('account.notifications.email.invalid')
    })

    it('should call setEmail with a valid email', () => {
      render(<EmailCard />)
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@decentraland.org' } })
      fireEvent.click(screen.getByRole('button'))
      expect(mockSetEmail).toHaveBeenCalledWith({ email: 'user@decentraland.org' })
    })
  })

  describe('when the email is confirmed', () => {
    it('should render the confirmed badge and description', () => {
      render(<EmailCard email="user@decentraland.org" />)
      expect(screen.getByText('account.notifications.email.status.confirmed')).toBeInTheDocument()
      expect(screen.getByText('account.notifications.email.description.confirmed')).toBeInTheDocument()
    })
  })

  describe('when the email is pending confirmation', () => {
    it('should render the pending badge and resend label', () => {
      render(<EmailCard email="" unconfirmedEmail="pending@decentraland.org" />)
      expect(screen.getByText('account.notifications.email.status.pending')).toBeInTheDocument()
      expect(screen.getByText('account.notifications.email.button.resend')).toBeInTheDocument()
    })
  })

  describe('when the mutation is loading', () => {
    it('should render the spinner', () => {
      mockIsLoading = true
      render(<EmailCard />)
      expect(screen.getByTestId('spinner')).toBeInTheDocument()
    })
  })

  describe('master email toggle', () => {
    const details = { ignore_all_email: false, ignore_all_in_app: false, message_type: {} } as unknown as SubscriptionDetails

    it('should render the master switch (on) and toggle all off when clicked', () => {
      const onToggleAll = jest.fn()
      render(<EmailCard email="user@decentraland.org" details={details} onToggleAll={onToggleAll} />)

      const masterSwitch = screen.getByRole('switch')
      expect(masterSwitch).toBeChecked()

      fireEvent.click(masterSwitch)
      expect(onToggleAll).toHaveBeenCalledWith(false)
    })

    it('should not render the master switch without a confirmed email', () => {
      render(<EmailCard details={details} onToggleAll={jest.fn()} />)
      expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    })
  })
})
