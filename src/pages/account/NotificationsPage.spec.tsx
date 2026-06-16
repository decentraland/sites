import type { ReactNode } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { fireEvent, render, screen } from '@testing-library/react'
import { SubscriptionGroupKey } from '../../features/account-notifications/account-notifications.types'
import { NotificationsPage } from './NotificationsPage'

type ChildrenProps = { children?: ReactNode; 'data-role'?: string }
type GroupRowProps = {
  group: SubscriptionGroupKey
  checked: boolean
  disabled?: boolean
  onToggle: (group: SubscriptionGroupKey, checked: boolean) => void
}

const mockUpdateSubscription = jest.fn()
let mockQueryResult: { data?: unknown; isLoading: boolean; isError: boolean } = {
  data: undefined,
  isLoading: false,
  isError: false
}
let mockUpdateState = { isLoading: false }

jest.mock('../../features/account-notifications/account-notifications.client', () => ({
  useGetSubscriptionQuery: () => mockQueryResult,
  useUpdateSubscriptionMutation: () => [mockUpdateSubscription, mockUpdateState]
}))

jest.mock('../../features/account-notifications/account-notifications.helpers', () => {
  const { SubscriptionGroupKey: keys } = jest.requireActual('../../features/account-notifications/account-notifications.types')
  return {
    SUBSCRIPTION_GROUP_ORDER: [keys.MARKETPLACE, keys.TIPS],
    isGroupEnabled: (_details: unknown, group: string) => group === keys.MARKETPLACE,
    setGroupEnabled: (details: unknown) => details
  }
})

jest.mock('../../components/account/Notifications/EmailCard/EmailCard', () => ({
  EmailCard: ({ email, unconfirmedEmail }: { email?: string; unconfirmedEmail?: string }) => (
    <div data-role="email-card" data-email={email} data-unconfirmed={unconfirmedEmail} />
  )
}))

jest.mock('../../components/account/Notifications/NotificationGroupRow/NotificationGroupRow', () => ({
  NotificationGroupRow: ({ group, checked, disabled, onToggle }: GroupRowProps) => (
    <button
      type="button"
      data-role="group-row"
      data-group={group}
      data-checked={checked}
      disabled={disabled}
      onClick={() => onToggle(group, !checked)}
    >
      {group}
    </button>
  )
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('./NotificationsPage.styled', () => ({
  NotificationsPanel: ({ children, 'data-role': dataRole }: ChildrenProps) => <section data-role={dataRole}>{children}</section>,
  Header: ({ children }: ChildrenProps) => <header>{children}</header>,
  Title: ({ children }: ChildrenProps) => <h1>{children}</h1>,
  Subtitle: ({ children }: ChildrenProps) => <p>{children}</p>,
  GroupsGrid: ({ children, 'data-role': dataRole }: ChildrenProps) => <div data-role={dataRole}>{children}</div>,
  StateMessage: ({ children, 'data-role': dataRole }: ChildrenProps) => <p data-role={dataRole}>{children}</p>
}))

const renderPage = () =>
  render(
    <HelmetProvider>
      <NotificationsPage />
    </HelmetProvider>
  )

const buildSubscription = (override: Record<string, unknown> = {}) => ({
  address: '0xabc',
  email: 'user@decentraland.org',
  unconfirmedEmail: undefined,
  details: { ignore_all_email: false, ignore_all_in_app: false, message_type: {} },
  ...override
})

describe('NotificationsPage', () => {
  beforeEach(() => {
    mockQueryResult = { data: undefined, isLoading: false, isError: false }
    mockUpdateState = { isLoading: false }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the title and description', () => {
    renderPage()
    expect(screen.getByText('account.notifications.title')).toBeInTheDocument()
    expect(screen.getByText('account.notifications.description')).toBeInTheDocument()
  })

  it('should render the loading message while fetching with no data', () => {
    mockQueryResult = { data: undefined, isLoading: true, isError: false }
    renderPage()
    expect(screen.getByText('account.notifications.loading')).toBeInTheDocument()
  })

  it('should render the error message on failure', () => {
    mockQueryResult = { data: undefined, isLoading: false, isError: true }
    renderPage()
    expect(screen.getByText('account.notifications.load_error')).toBeInTheDocument()
  })

  it('should render a group row per configured group with the computed checked state', () => {
    mockQueryResult = { data: buildSubscription(), isLoading: false, isError: false }
    renderPage()
    const rows = screen.getAllByRole('button')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveAttribute('data-group', SubscriptionGroupKey.MARKETPLACE)
    expect(rows[0]).toHaveAttribute('data-checked', 'true')
    expect(rows[1]).toHaveAttribute('data-checked', 'false')
  })

  it('should dispatch updateSubscription when a group is toggled', () => {
    mockQueryResult = { data: buildSubscription(), isLoading: false, isError: false }
    renderPage()
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(mockUpdateSubscription).toHaveBeenCalledTimes(1)
  })

  it('should disable the rows when the email is not yet confirmed', () => {
    mockQueryResult = {
      data: buildSubscription({ email: '', unconfirmedEmail: 'pending@decentraland.org' }),
      isLoading: false,
      isError: false
    }
    renderPage()
    screen.getAllByRole('button').forEach(row => expect(row).toBeDisabled())
  })
})
