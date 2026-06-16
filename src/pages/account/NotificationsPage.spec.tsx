import type { ReactNode } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { fireEvent, render, screen } from '@testing-library/react'
import { SubscriptionGroupKey } from '../../features/account-notifications/account-notifications.types'
import { NotificationsPage } from './NotificationsPage'

type ChildrenProps = { children?: ReactNode; 'data-role'?: string }
type AccordionProps = {
  group: SubscriptionGroupKey
  disabled?: boolean
  onToggleType: (type: string, checked: boolean) => void
}
type EmailCardProps = {
  email?: string
  onToggleAll?: (enabled: boolean) => void
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
    subscriptionGroups: { [keys.MARKETPLACE]: ['item_sold'], [keys.TIPS]: ['tip_received'] },
    setTypeEmail: (details: unknown) => details,
    setAllEmail: (details: unknown) => details
  }
})

jest.mock('../../components/account/Notifications/EmailCard/EmailCard', () => ({
  EmailCard: ({ email, onToggleAll }: EmailCardProps) => (
    <button type="button" data-role="email-card" data-email={email} onClick={() => onToggleAll?.(true)}>
      email-card
    </button>
  )
}))

jest.mock('../../components/account/Notifications/NotificationGroupAccordion/NotificationGroupAccordion', () => ({
  NotificationGroupAccordion: ({ group, disabled, onToggleType }: AccordionProps) => (
    <button type="button" data-role="group" data-group={group} disabled={disabled} onClick={() => onToggleType('item_sold', true)}>
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

const getGroupButtons = () => screen.getAllByRole('button').filter(b => b.getAttribute('data-role') === 'group')

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

  it('should render an accordion per configured group', () => {
    mockQueryResult = { data: buildSubscription(), isLoading: false, isError: false }
    renderPage()
    const groups = getGroupButtons()
    expect(groups).toHaveLength(2)
    expect(groups[0]).toHaveAttribute('data-group', SubscriptionGroupKey.MARKETPLACE)
    expect(groups[1]).toHaveAttribute('data-group', SubscriptionGroupKey.TIPS)
  })

  it('should dispatch updateSubscription when a notification type is toggled', () => {
    mockQueryResult = { data: buildSubscription(), isLoading: false, isError: false }
    renderPage()
    fireEvent.click(getGroupButtons()[0])
    expect(mockUpdateSubscription).toHaveBeenCalledTimes(1)
  })

  it('should dispatch updateSubscription when the master email toggle fires', () => {
    mockQueryResult = { data: buildSubscription(), isLoading: false, isError: false }
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'email-card' }))
    expect(mockUpdateSubscription).toHaveBeenCalledTimes(1)
  })

  it('should disable the accordions when the email is not yet confirmed', () => {
    mockQueryResult = {
      data: buildSubscription({ email: '', unconfirmedEmail: 'pending@decentraland.org' }),
      isLoading: false,
      isError: false
    }
    renderPage()
    getGroupButtons().forEach(row => expect(row).toBeDisabled())
  })
})
