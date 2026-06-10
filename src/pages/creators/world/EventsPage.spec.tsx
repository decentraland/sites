import { render, screen } from '@testing-library/react'
import type { EventEntry } from '../../../features/events'

const mockUseGetEventsQuery = jest.fn()
let mockContext: { worldName: string }

jest.mock('../../../components/creators/CreatorWorldLayout', () => ({
  useWorldContext: () => mockContext
}))
jest.mock('../../../features/events', () => ({
  useGetEventsQuery: (...args: unknown[]) => mockUseGetEventsQuery(...args)
}))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))
jest.mock('../../../hooks/useBlogPageTracking', () => ({
  useBlogPageTracking: () => undefined
}))
jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/creatorsUi2Mock'))

// Imported after the mocks so the mocked barrels win.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { EventsPage } = require('./EventsPage') as typeof import('./EventsPage')

function makeEvent(overrides: Partial<EventEntry> = {}): EventEntry {
  return {
    id: 'e1',
    name: 'Launch Party',
    image: 'https://cdn.example/x.png',
    url: 'https://events.example/e1',
    server: 'test.dcl.eth',
    start_at: '2026-01-01T00:00:00Z',
    next_start_at: '2026-01-01T00:00:00Z',
    total_attendees: 12,
    live: false,
    ...overrides
  } as EventEntry
}

describe('EventsPage', () => {
  beforeEach(() => {
    mockContext = { worldName: 'test.dcl.eth' }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should show a spinner while events load', () => {
    mockUseGetEventsQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    render(<EventsPage />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should surface a load error', () => {
    mockUseGetEventsQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    render(<EventsPage />)
    expect(screen.getByText('page.creators.world.events_load_error')).toBeInTheDocument()
  })

  it('should render the empty state with a schedule CTA when the world has no events', () => {
    mockUseGetEventsQuery.mockReturnValue({ data: [], isLoading: false, isError: false })
    render(<EventsPage />)
    expect(screen.getByText('page.creators.world.events_empty')).toBeInTheDocument()
    expect(screen.getByText('page.creators.world.events_schedule')).toHaveAttribute('href', '/whats-on/new-hangout')
  })

  it('should list only events whose server matches the world and ignore others', () => {
    mockUseGetEventsQuery.mockReturnValue({
      data: [
        makeEvent({ id: 'mine', name: 'My Event', server: 'TEST.dcl.eth', live: true }),
        makeEvent({ id: 'other', name: 'Other Event', server: 'somewhere.dcl.eth' })
      ],
      isLoading: false,
      isError: false
    })
    render(<EventsPage />)
    expect(screen.getByText('My Event')).toBeInTheDocument()
    expect(screen.queryByText('Other Event')).not.toBeInTheDocument()
    // The matching event is live, so the live tag renders.
    expect(screen.getByText('page.creators.world.events_live')).toBeInTheDocument()
  })

  it('should sort matching world events by their start time', () => {
    mockUseGetEventsQuery.mockReturnValue({
      data: [
        makeEvent({ id: 'later', name: 'Later Event', start_at: '2026-02-01T00:00:00Z', next_start_at: undefined }),
        makeEvent({ id: 'earlier', name: 'Earlier Event', start_at: '2026-01-01T00:00:00Z', next_start_at: undefined })
      ],
      isLoading: false,
      isError: false
    })
    render(<EventsPage />)
    const names = screen.getAllByText(/Event$/).map(node => node.textContent)
    expect(names).toEqual(['Earlier Event', 'Later Event'])
  })

  it('should render a non-live event without a live tag and fall back to start_at for the date', () => {
    mockUseGetEventsQuery.mockReturnValue({
      data: [makeEvent({ id: 'mine', name: 'Scheduled Event', live: false, next_start_at: undefined })],
      isLoading: false,
      isError: false
    })
    render(<EventsPage />)
    expect(screen.getByText('Scheduled Event')).toBeInTheDocument()
    expect(screen.queryByText('page.creators.world.events_live')).not.toBeInTheDocument()
  })

  it('should render an empty date string when the event has no start times', () => {
    mockUseGetEventsQuery.mockReturnValue({
      data: [
        makeEvent({
          id: 'mine',
          name: 'No Date Event',
          live: false,
          start_at: '',
          next_start_at: undefined,
          image: undefined,
          total_attendees: undefined
        })
      ],
      isLoading: false,
      isError: false
    })
    render(<EventsPage />)
    expect(screen.getByText('No Date Event')).toBeInTheDocument()
  })
})
