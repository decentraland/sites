import { render, screen } from '@testing-library/react'
import { createMockEvent } from '../../../__test-utils__/factories'
import { PendingEventCard } from './PendingEventCard'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../AllExperiences/FutureCard', () => ({
  FutureCard: ({ event, onClick }: { event: { id: string; name: string }; onClick: (event: unknown) => void }) => (
    <button onClick={() => onClick(event)}>{event.name}</button>
  )
}))

jest.mock('./PendingEventCard.styled', () => ({
  CardFrame: ({ children, faded, ...rest }: { children: React.ReactNode; faded?: boolean } & Record<string, unknown>) => (
    <div data-testid="card-frame" data-faded={faded ? 'true' : 'false'} {...rest}>
      {children}
    </div>
  ),
  ChipOverlay: ({ children }: { children: React.ReactNode }) => <div data-testid="chip-overlay">{children}</div>,
  DateChip: ({ children }: { children: React.ReactNode }) => <span data-testid="date-chip">{children}</span>,
  StatusChip: ({ status, children }: { status: string; children: React.ReactNode }) => (
    <span data-testid="status-chip" data-status={status}>
      {children}
    </span>
  )
}))

describe('when rendering PendingEventCard for a pending event', () => {
  const pendingEvent = createMockEvent({
    id: 'evt-1',
    name: 'Test event',
    approved: false,
    rejected: false,
    start_at: '2026-04-22T12:00:00Z'
  })

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-21T10:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render the PENDING status chip', () => {
    render(<PendingEventCard event={pendingEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('status-chip')).toHaveAttribute('data-status', 'pending')
  })

  it('should render a date chip with the Tomorrow label', () => {
    render(<PendingEventCard event={pendingEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('date-chip')).toHaveTextContent('whats_on_admin.pending_events.tomorrow')
  })

  it('should mark the card frame as faded so the content appears translucent', () => {
    render(<PendingEventCard event={pendingEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('card-frame')).toHaveAttribute('data-faded', 'true')
  })

  it('should flag the card frame as aria-disabled so assistive tech announces the pending state', () => {
    render(<PendingEventCard event={pendingEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('card-frame')).toHaveAttribute('aria-disabled', 'true')
  })
})

describe('when rendering PendingEventCard for an approved event', () => {
  const approvedEvent = createMockEvent({ id: 'evt-1', approved: true, rejected: false })

  it('should render the APPROVED status chip', () => {
    render(<PendingEventCard event={approvedEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('status-chip')).toHaveAttribute('data-status', 'approved')
  })

  it('should keep the card frame fully opaque', () => {
    render(<PendingEventCard event={approvedEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('card-frame')).toHaveAttribute('data-faded', 'false')
  })

  it('should not mark the card frame as aria-disabled', () => {
    render(<PendingEventCard event={approvedEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('card-frame')).toHaveAttribute('aria-disabled', 'false')
  })
})

describe('when rendering PendingEventCard for a rejected event', () => {
  const rejectedEvent = createMockEvent({ id: 'evt-1', approved: false, rejected: true })

  it('should keep the card frame fully opaque', () => {
    render(<PendingEventCard event={rejectedEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('card-frame')).toHaveAttribute('data-faded', 'false')
  })

  it('should not mark the card frame as aria-disabled', () => {
    render(<PendingEventCard event={rejectedEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('card-frame')).toHaveAttribute('aria-disabled', 'false')
  })
})
