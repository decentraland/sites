import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { NotificationType, type SubscriptionDetails } from '@dcl/schemas'
import { SubscriptionGroupKey } from '../../../../features/account-notifications/account-notifications.types'
import { NotificationGroupAccordion } from './NotificationGroupAccordion'

type ChildrenProps = { children?: ReactNode; 'data-role'?: string }
type SwitchProps = { checked?: boolean; disabled?: boolean; onChange?: (event: unknown, checked: boolean) => void }
type HeaderProps = ChildrenProps & { onClick?: () => void; 'aria-expanded'?: boolean }

jest.mock('@mui/icons-material/ExpandMoreRounded', () => ({ __esModule: true, default: () => <span /> }))

// The per-group SVG icons are exercised by the build; here they are stubbed so the accordion
// behavior tests stay focused.
jest.mock('./groupIcons', () => ({
  MarketplaceIcon: () => <span />,
  MarketplaceCreditsIcon: () => <span />,
  EventsIcon: () => <span />,
  RewardsIcon: () => <span />,
  DaoIcon: () => <span />,
  WorldsIcon: () => <span />,
  StreamingIcon: () => <span />,
  TipsIcon: () => <span />,
  ReferralsIcon: () => <span />
}))

jest.mock('decentraland-ui2', () => ({
  Switch: ({ checked, disabled, onChange }: SwitchProps) => (
    <input
      type="checkbox"
      role="switch"
      checked={!!checked}
      disabled={disabled}
      onChange={event => onChange?.(event, event.target.checked)}
    />
  )
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('./NotificationGroupAccordion.styled', () => ({
  AccordionRoot: ({ children }: ChildrenProps) => <div>{children}</div>,
  Header: ({ children, onClick, 'aria-expanded': expanded }: HeaderProps) => (
    <button type="button" data-role="header" aria-expanded={expanded} onClick={onClick}>
      {children}
    </button>
  ),
  ChevronIconWrap: ({ children }: ChildrenProps) => <span>{children}</span>,
  HeaderLabel: ({ children }: ChildrenProps) => <span>{children}</span>,
  GroupIcon: ({ children }: ChildrenProps) => <span>{children}</span>,
  Content: ({ children, 'data-role': dataRole }: ChildrenProps) => <div data-role={dataRole}>{children}</div>,
  TypeRow: ({ children }: ChildrenProps) => <div>{children}</div>,
  TypeLabel: ({ children }: ChildrenProps) => <span>{children}</span>
}))

const details = {
  ignore_all_email: false,
  ignore_all_in_app: false,
  message_type: {
    [NotificationType.EVENTS_STARTED]: { email: true, in_app: true },
    [NotificationType.EVENTS_STARTS_SOON]: { email: false, in_app: true }
  }
} as unknown as SubscriptionDetails

const types = [NotificationType.EVENTS_STARTED, NotificationType.EVENTS_STARTS_SOON]

describe('NotificationGroupAccordion', () => {
  it('should render the group label and keep the type rows hidden until expanded', () => {
    render(<NotificationGroupAccordion group={SubscriptionGroupKey.EVENTS} types={types} details={details} onToggleType={jest.fn()} />)

    expect(screen.getByText(`account.notifications.groups.${SubscriptionGroupKey.EVENTS}`)).toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })

  it('should reveal a switch per type reflecting each email state when expanded', () => {
    render(<NotificationGroupAccordion group={SubscriptionGroupKey.EVENTS} types={types} details={details} onToggleType={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /events/ }))

    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(2)
    expect(switches[0]).toBeChecked()
    expect(switches[1]).not.toBeChecked()
  })

  it('should call onToggleType with the type and new value when a switch changes', () => {
    const onToggleType = jest.fn()
    render(<NotificationGroupAccordion group={SubscriptionGroupKey.EVENTS} types={types} details={details} onToggleType={onToggleType} />)

    fireEvent.click(screen.getByRole('button', { name: /events/ }))
    fireEvent.click(screen.getAllByRole('switch')[1])

    expect(onToggleType).toHaveBeenCalledWith(NotificationType.EVENTS_STARTS_SOON, true)
  })
})
