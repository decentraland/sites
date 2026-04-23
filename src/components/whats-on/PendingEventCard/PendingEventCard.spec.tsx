import { render, screen } from '@testing-library/react'
import type { EventEntry } from '../../../features/whats-on-events'
import { PendingEventCard } from './PendingEventCard'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../AllExperiences/FutureCard', () => ({
  FutureCard: ({ event, onClick }: { event: EventEntry; onClick: (event: EventEntry) => void }) => (
    <button onClick={() => onClick(event)}>{event.name}</button>
  )
}))

jest.mock('./PendingEventCard.styled', () => ({
  CardFrame: ({ children, faded }: { children: React.ReactNode; faded?: boolean }) => (
    <div data-testid="card-frame" data-faded={faded ? 'true' : 'false'}>
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

const baseEvent = {
  id: 'evt-1',
  name: 'Test event',
  approved: false,
  rejected: false,
  start_at: '2026-04-22T12:00:00Z'
} as unknown as EventEntry

describe('when rendering PendingEventCard for a pending event', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-21T10:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render the PENDING status chip', () => {
    render(<PendingEventCard event={baseEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('status-chip')).toHaveAttribute('data-status', 'pending')
  })

  it('should render a date chip with the Tomorrow label', () => {
    render(<PendingEventCard event={baseEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('date-chip')).toHaveTextContent('whats_on_admin.pending_events.tomorrow')
  })

  it('should mark the card frame as faded so the content appears translucent', () => {
    render(<PendingEventCard event={baseEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('card-frame')).toHaveAttribute('data-faded', 'true')
  })
})

describe('when rendering PendingEventCard for an approved event', () => {
  let approvedEvent: EventEntry

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-21T10:00:00Z'))
    approvedEvent = { ...baseEvent, approved: true } as unknown as EventEntry
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render the APPROVED status chip', () => {
    render(<PendingEventCard event={approvedEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('status-chip')).toHaveAttribute('data-status', 'approved')
  })

  it('should keep the card frame fully opaque', () => {
    render(<PendingEventCard event={approvedEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('card-frame')).toHaveAttribute('data-faded', 'false')
  })
})

describe('when rendering PendingEventCard for a rejected event', () => {
  let rejectedEvent: EventEntry

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-21T10:00:00Z'))
    rejectedEvent = { ...baseEvent, rejected: true } as unknown as EventEntry
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should keep the card frame fully opaque', () => {
    render(<PendingEventCard event={rejectedEvent} onClick={jest.fn()} />)
    expect(screen.getByTestId('card-frame')).toHaveAttribute('data-faded', 'false')
  })
})
