import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { SubscriptionGroupKey } from '../../../../features/account-notifications/account-notifications.types'
import { NotificationGroupRow } from './NotificationGroupRow'

type ChildrenProps = { children?: ReactNode; 'data-role'?: string }
type SwitchProps = {
  checked?: boolean
  disabled?: boolean
  onChange?: (event: unknown, checked: boolean) => void
  'data-role'?: string
}

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('decentraland-ui2', () => ({
  Switch: ({ checked, disabled, onChange, 'data-role': dataRole }: SwitchProps) => (
    <input
      type="checkbox"
      data-role={dataRole}
      checked={checked}
      disabled={disabled}
      onChange={event => onChange?.(event, event.target.checked)}
    />
  )
}))

jest.mock('./NotificationGroupRow.styled', () => ({
  Row: ({ children, 'data-role': dataRole }: ChildrenProps) => <div data-role={dataRole}>{children}</div>,
  Label: ({ children }: ChildrenProps) => <span>{children}</span>
}))

describe('NotificationGroupRow', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the group label key', () => {
    render(<NotificationGroupRow group={SubscriptionGroupKey.MARKETPLACE} checked={false} onToggle={jest.fn()} />)
    expect(screen.getByText('account.notifications.groups.marketplace')).toBeInTheDocument()
  })

  it('should reflect the checked state on the switch', () => {
    render(<NotificationGroupRow group={SubscriptionGroupKey.EVENTS} checked onToggle={jest.fn()} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('should call onToggle with the group and the next value', () => {
    const onToggle = jest.fn()
    render(<NotificationGroupRow group={SubscriptionGroupKey.DAO} checked={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith(SubscriptionGroupKey.DAO, true)
  })

  it('should disable the switch when disabled', () => {
    render(<NotificationGroupRow group={SubscriptionGroupKey.TIPS} checked={false} disabled onToggle={jest.fn()} />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })
})
