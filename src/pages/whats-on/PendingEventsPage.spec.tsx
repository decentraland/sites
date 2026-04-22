import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const { PendingEventsPage } = require('./PendingEventsPage')

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../../hooks/useAdminPermissions', () => ({
  useAdminPermissions: () => ({
    canApproveAnyEvent: true,
    canApproveOwnEvent: false,
    canEditAnyEvent: false,
    isLoading: false
  })
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: undefined, hasValidIdentity: false, address: undefined })
}))

jest.mock('../../features/whats-on/admin/admin.client', () => ({
  useGetAdminEventsQuery: () => ({ data: [], refetch: jest.fn() }),
  useApproveEventMutation: () => [jest.fn(), { isLoading: false }],
  useRejectEventMutation: () => [jest.fn(), { isLoading: false }]
}))

jest.mock('../../components/whats-on/EventDetailModal', () => ({
  EventDetailModal: () => <div data-testid="event-detail-modal" />
}))

jest.mock('../../components/whats-on/EventDetailModal/normalizers', () => ({
  normalizeEventEntry: jest.fn()
}))

jest.mock('../../components/whats-on/Upcoming/UpcomingCard', () => ({
  UpcomingCard: ({ event, onClick }: { event: { id: string; name: string }; onClick: () => void }) => (
    <button onClick={onClick}>{event.name}</button>
  )
}))

jest.mock('./PendingEventsPage.styled', () => ({
  CardGrid: ({ children }: { children: React.ReactNode }) => <div data-testid="card-grid">{children}</div>,
  PageContainer: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
  Section: ({ children }: { children: React.ReactNode }) => <section>{children}</section>
}))

jest.mock('decentraland-ui2', () => ({
  Typography: ({ children, component }: { children: React.ReactNode; component?: string }) => {
    const Tag = (component ?? 'span') as keyof JSX.IntrinsicElements
    return <Tag>{children}</Tag>
  }
}))

describe('when rendering PendingEventsPage with canApproveAnyEvent', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the Pending Events title', () => {
    render(
      <MemoryRouter>
        <PendingEventsPage />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { level: 1, name: 'whats_on_admin.pending_events.title' })).toBeInTheDocument()
  })

  it('should render the Recently Approved section heading', () => {
    render(
      <MemoryRouter>
        <PendingEventsPage />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('whats_on_admin.pending_events.recently_approved')
  })
})
