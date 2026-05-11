import { MemoryRouter, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMockEvent } from '../../__test-utils__/factories'
import type { EventDetailModalProps } from '../../components/whats-on/EventDetailModal/EventDetailModal.types'
import type { EventEntry } from '../../features/events/events.types'
/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const { PendingEventsPage } = require('./PendingEventsPage')

const mockUseGetAdminEventsQuery = jest.fn()

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
  useAuthIdentity: () => ({ identity: { authChain: [] }, hasValidIdentity: true, address: '0xadmin' })
}))

jest.mock('../../features/events/events.admin.client', () => ({
  useGetAdminEventsQuery: (...args: unknown[]) => mockUseGetAdminEventsQuery(...args),
  useApproveEventMutation: () => [jest.fn(), { isLoading: false }],
  useRejectEventMutation: () => [jest.fn(), { isLoading: false }]
}))

jest.mock('../../components/whats-on/EventDetailModal', () => ({
  EventDetailModal: ({ adminActions, onClose, data }: EventDetailModalProps) => (
    <div data-testid="event-detail-modal" data-event-id={data?.id} data-has-admin-actions={adminActions ? 'true' : 'false'}>
      <button type="button" onClick={onClose}>
        close-modal
      </button>
    </div>
  )
}))

jest.mock('../../components/whats-on/EventDetailModal/normalizers', () => ({
  normalizeEventEntry: (event: EventEntry) => ({ id: event.id, name: event.name })
}))

jest.mock('../../components/whats-on/PendingEventCard', () => ({
  PendingEventCard: ({
    event,
    onClick
  }: {
    event: { id: string; name: string }
    onClick: (event: { id: string; name: string }) => void
  }) => <button onClick={() => onClick(event)}>{event.name}</button>
}))

jest.mock('../../components/whats-on/RejectEventModal', () => ({
  RejectEventModal: ({ open }: { open: boolean }) => (open ? <div data-testid="reject-event-modal" /> : null)
}))

jest.mock('decentraland-ui2', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div role="alert">{children}</div>,
  Snackbar: ({ open, children }: { open: boolean; children: React.ReactNode }) => (open ? <div>{children}</div> : null)
}))

jest.mock('./AdminLayout.styled', () => ({
  AdminPageContainer: ({ children }: { children: React.ReactNode }) => <main>{children}</main>
}))

jest.mock('./PendingEventsPage.styled', () => ({
  CardGrid: ({ children }: { children: React.ReactNode }) => <div data-testid="card-grid">{children}</div>,
  EmptyStateText: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  Section: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  SectionSubtitle: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  SectionTitle: ({ children, component }: { children: React.ReactNode; component?: string }) => {
    const Tag = (component ?? 'h2') as keyof JSX.IntrinsicElements
    return <Tag>{children}</Tag>
  }
}))

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location-search">{location.search}</div>
}

function renderPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <PendingEventsPage />
      <LocationProbe />
    </MemoryRouter>
  )
}

const FAR_FUTURE = '2099-01-01T12:00:00Z'

describe('PendingEventsPage', () => {
  beforeEach(() => {
    mockUseGetAdminEventsQuery.mockReturnValue({ data: [], isSuccess: true, refetch: jest.fn() })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendering with canApproveAnyEvent', () => {
    it('should render the Pending Events title', () => {
      renderPage('/whats-on/admin/pending-events')
      expect(screen.getByRole('heading', { level: 1, name: 'whats_on_admin.pending_events.title' })).toBeInTheDocument()
    })

    it('should render the Recently Approved section heading', () => {
      renderPage('/whats-on/admin/pending-events')
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('whats_on_admin.pending_events.recently_approved')
    })
  })

  describe('when the URL carries an id query param matching a pending event', () => {
    beforeEach(() => {
      const pending = createMockEvent({
        id: 'ev-pending',
        name: 'Pending hangout',
        approved: false,
        rejected: false,
        finish_at: FAR_FUTURE
      })
      mockUseGetAdminEventsQuery.mockReturnValue({ data: [pending], isSuccess: true, refetch: jest.fn() })
    })

    it('should open the EventDetailModal with admin actions', () => {
      renderPage('/whats-on/admin/pending-events?id=ev-pending')

      const modal = screen.getByTestId('event-detail-modal')
      expect(modal).toHaveAttribute('data-event-id', 'ev-pending')
      expect(modal).toHaveAttribute('data-has-admin-actions', 'true')
    })

    it('should strip the id from the URL when the modal is closed', async () => {
      const user = userEvent.setup()
      renderPage('/whats-on/admin/pending-events?id=ev-pending&filter=mine')

      await user.click(screen.getByRole('button', { name: 'close-modal' }))

      expect(screen.queryByTestId('event-detail-modal')).not.toBeInTheDocument()
      expect(screen.getByTestId('location-search').textContent).toBe('?filter=mine')
    })
  })

  describe('when the URL carries an id query param matching an already approved event', () => {
    beforeEach(() => {
      const approved = createMockEvent({
        id: 'ev-approved',
        name: 'Done',
        approved: true,
        rejected: false,
        updated_at: new Date().toISOString()
      })
      mockUseGetAdminEventsQuery.mockReturnValue({ data: [approved], isSuccess: true, refetch: jest.fn() })
    })

    it('should open the modal in read-only mode without admin actions', () => {
      renderPage('/whats-on/admin/pending-events?id=ev-approved')

      const modal = screen.getByTestId('event-detail-modal')
      expect(modal).toHaveAttribute('data-event-id', 'ev-approved')
      expect(modal).toHaveAttribute('data-has-admin-actions', 'false')
    })
  })

  describe('when the URL carries an id query param that does not match any event', () => {
    beforeEach(() => {
      mockUseGetAdminEventsQuery.mockReturnValue({ data: [createMockEvent({ id: 'ev-other' })], isSuccess: true, refetch: jest.fn() })
    })

    it('should not open the modal and should strip the dangling id param', () => {
      renderPage('/whats-on/admin/pending-events?id=ev-missing&filter=mine')

      expect(screen.queryByTestId('event-detail-modal')).not.toBeInTheDocument()
      expect(screen.getByTestId('location-search').textContent).toBe('?filter=mine')
    })
  })
})
