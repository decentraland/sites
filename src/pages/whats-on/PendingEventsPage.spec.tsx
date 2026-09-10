import { MemoryRouter, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMockEvent } from '../../__test-utils__/factories'
import type { EventDetailModalProps } from '../../components/whats-on/EventDetailModal/EventDetailModal.types'
import type { EventEntry } from '../../features/events/events.types'
/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const { PendingEventsPage } = require('./PendingEventsPage')

const mockUseGetAdminEventsQuery = jest.fn()
const mockApprove = jest.fn()
const mockReject = jest.fn()
const approveLoading = false
const rejectLoading = false

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const mockUseAdminPermissions = jest.fn()
jest.mock('../../hooks/useAdminPermissions', () => ({
  useAdminPermissions: () => mockUseAdminPermissions()
}))

const mockUseAuthIdentity = jest.fn()
jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => mockUseAuthIdentity()
}))

jest.mock('../../features/events/events.admin.client', () => ({
  useGetAdminEventsQuery: (...args: unknown[]) => mockUseGetAdminEventsQuery(...args),
  useApproveEventMutation: () => [
    (args: unknown) => ({
      unwrap: () => mockApprove(args)
    }),
    { isLoading: approveLoading }
  ],
  useRejectEventMutation: () => [
    (args: unknown) => ({
      unwrap: () => mockReject(args)
    }),
    { isLoading: rejectLoading }
  ]
}))

jest.mock('../../components/whats-on/EventDetailModal', () => ({
  EventDetailModal: ({ adminActions, onClose, data }: EventDetailModalProps) => (
    <div data-testid="event-detail-modal" data-event-id={data?.id} data-has-admin-actions={adminActions ? 'true' : 'false'}>
      <button type="button" onClick={onClose}>
        close-modal
      </button>
      {adminActions && (
        <>
          <button type="button" onClick={adminActions.onApprove}>
            approve
          </button>
          <button type="button" onClick={adminActions.onReject}>
            reject
          </button>
        </>
      )}
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
  RejectEventModal: ({
    open,
    onSubmit,
    onClose
  }: {
    open: boolean
    onSubmit: (payload: { reasons: string[]; notes: string }) => void
    onClose: () => void
  }) =>
    open ? (
      <div data-testid="reject-event-modal">
        <button type="button" onClick={() => onSubmit({ reasons: ['invalid'], notes: '' })}>
          submit-reject
        </button>
        <button type="button" onClick={onClose}>
          close-reject
        </button>
      </div>
    ) : null
}))

jest.mock('decentraland-ui2', () => ({
  Alert: ({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) => (
    <div role="alert">
      {children}
      {onClose && (
        <button type="button" onClick={onClose}>
          close-alert
        </button>
      )}
    </div>
  ),
  Snackbar: ({ open, children, onClose }: { open: boolean; children: React.ReactNode; onClose?: () => void }) =>
    open ? (
      <div>
        {onClose && (
          <button type="button" onClick={() => onClose()}>
            close-snackbar
          </button>
        )}
        {children}
      </div>
    ) : null
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
    mockUseAdminPermissions.mockReturnValue({
      canApproveAnyEvent: true,
      canApproveOwnEvent: false,
      canEditAnyEvent: false,
      isLoading: false
    })
    mockUseAuthIdentity.mockReturnValue({ identity: { authChain: [] }, hasValidIdentity: true, address: '0xadmin' })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendering with canApproveAnyEvent', () => {
    it('should render the Pending Events title', () => {
      renderPage('/events/admin/pending-events')
      expect(screen.getByRole('heading', { level: 1, name: 'whats_on_admin.pending_events.title' })).toBeInTheDocument()
    })

    it('should render the Recently Approved section heading', () => {
      renderPage('/events/admin/pending-events')
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
      renderPage('/events/admin/pending-events?id=ev-pending')

      const modal = screen.getByTestId('event-detail-modal')
      expect(modal).toHaveAttribute('data-event-id', 'ev-pending')
      expect(modal).toHaveAttribute('data-has-admin-actions', 'true')
    })

    it('should strip the id from the URL when the modal is closed', async () => {
      const user = userEvent.setup()
      renderPage('/events/admin/pending-events?id=ev-pending&filter=mine')

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
      renderPage('/events/admin/pending-events?id=ev-approved')

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
      renderPage('/events/admin/pending-events?id=ev-missing&filter=mine')

      expect(screen.queryByTestId('event-detail-modal')).not.toBeInTheDocument()
      expect(screen.getByTestId('location-search').textContent).toBe('?filter=mine')
    })
  })

  describe('when the admin clicks Approve', () => {
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

    it('should call approve and show the success snackbar', async () => {
      mockApprove.mockResolvedValueOnce(undefined)
      const user = userEvent.setup()
      renderPage('/events/admin/pending-events?id=ev-pending')

      await user.click(screen.getByRole('button', { name: 'approve' }))

      expect(mockApprove).toHaveBeenCalledWith({ eventId: 'ev-pending', identity: { authChain: [] } })
      expect(screen.getByRole('alert')).toHaveTextContent('whats_on_admin.pending_events.approve_success')
    })

    it('should show the error snackbar when approve rejects', async () => {
      mockApprove.mockRejectedValueOnce(new Error('boom'))
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const user = userEvent.setup()
      renderPage('/events/admin/pending-events?id=ev-pending')

      await user.click(screen.getByRole('button', { name: 'approve' }))

      expect(screen.getByRole('alert')).toHaveTextContent('whats_on_admin.pending_events.action_error')
    })
  })

  describe('when the admin clicks Reject and submits a reason', () => {
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

    it('should open the RejectEventModal and call reject with a built reason', async () => {
      mockReject.mockResolvedValueOnce(undefined)
      const user = userEvent.setup()
      renderPage('/events/admin/pending-events?id=ev-pending')

      await user.click(screen.getByRole('button', { name: 'reject' }))
      expect(screen.getByTestId('reject-event-modal')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'submit-reject' }))
      expect(mockReject).toHaveBeenCalledWith(expect.objectContaining({ eventId: 'ev-pending', identity: { authChain: [] } }))
    })

    it('should show the error snackbar when reject rejects', async () => {
      mockReject.mockRejectedValueOnce(new Error('boom'))
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const user = userEvent.setup()
      renderPage('/events/admin/pending-events?id=ev-pending')

      await user.click(screen.getByRole('button', { name: 'reject' }))
      await user.click(screen.getByRole('button', { name: 'submit-reject' }))

      expect(screen.getByRole('alert')).toHaveTextContent('whats_on_admin.pending_events.action_error')
    })

    it('should close the RejectEventModal without rejecting when dismissed', async () => {
      const user = userEvent.setup()
      renderPage('/events/admin/pending-events?id=ev-pending')

      await user.click(screen.getByRole('button', { name: 'reject' }))
      expect(screen.getByTestId('reject-event-modal')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'close-reject' }))

      expect(screen.queryByTestId('reject-event-modal')).not.toBeInTheDocument()
      expect(mockReject).not.toHaveBeenCalled()
    })
  })

  describe('when the user lacks every admin permission', () => {
    beforeEach(() => {
      mockUseAdminPermissions.mockReturnValue({
        canApproveAnyEvent: false,
        canApproveOwnEvent: false,
        canEditAnyEvent: false,
        isLoading: false
      })
    })

    it('should redirect to /events instead of rendering the admin page', () => {
      renderPage('/events/admin/pending-events')

      expect(screen.queryByRole('heading', { level: 1, name: 'whats_on_admin.pending_events.title' })).not.toBeInTheDocument()
    })
  })

  describe('when permissions are still loading', () => {
    beforeEach(() => {
      mockUseAdminPermissions.mockReturnValue({
        canApproveAnyEvent: false,
        canApproveOwnEvent: false,
        canEditAnyEvent: false,
        isLoading: true
      })
    })

    it('should render the page while permissions resolve rather than redirecting prematurely', () => {
      renderPage('/events/admin/pending-events')

      expect(screen.getByRole('heading', { level: 1, name: 'whats_on_admin.pending_events.title' })).toBeInTheDocument()
    })
  })

  describe('when the admin action fires without a usable identity', () => {
    beforeEach(() => {
      mockUseAuthIdentity.mockReturnValue({ identity: undefined, hasValidIdentity: false, address: undefined })
      const pending = createMockEvent({
        id: 'ev-pending',
        name: 'Pending hangout',
        approved: false,
        rejected: false,
        finish_at: FAR_FUTURE
      })
      mockUseGetAdminEventsQuery.mockReturnValue({ data: [pending], isSuccess: true, refetch: jest.fn() })
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    it('should bail out of approve without calling the mutation', async () => {
      const user = userEvent.setup()
      renderPage('/events/admin/pending-events?id=ev-pending')

      await user.click(screen.getByRole('button', { name: 'approve' }))

      expect(mockApprove).not.toHaveBeenCalled()
    })

    it('should bail out of reject submit without calling the mutation', async () => {
      const user = userEvent.setup()
      renderPage('/events/admin/pending-events?id=ev-pending')

      await user.click(screen.getByRole('button', { name: 'reject' }))
      await user.click(screen.getByRole('button', { name: 'submit-reject' }))

      expect(mockReject).not.toHaveBeenCalled()
    })
  })

  describe('when the success snackbar is dismissed', () => {
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

    it('should close the snackbar when its Alert close button is pressed', async () => {
      mockApprove.mockResolvedValueOnce(undefined)
      const user = userEvent.setup()
      renderPage('/events/admin/pending-events?id=ev-pending')

      await user.click(screen.getByRole('button', { name: 'approve' }))
      expect(screen.getByRole('alert')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'close-alert' }))

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should close the snackbar when it auto-dismisses via onClose', async () => {
      mockApprove.mockResolvedValueOnce(undefined)
      const user = userEvent.setup()
      renderPage('/events/admin/pending-events?id=ev-pending')

      await user.click(screen.getByRole('button', { name: 'approve' }))
      expect(screen.getByRole('alert')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'close-snackbar' }))

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
