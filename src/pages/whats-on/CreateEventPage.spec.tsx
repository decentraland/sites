import { fireEvent, render, screen } from '@testing-library/react'
import { createMockEvent } from '../../__test-utils__/factories'
import type { EventEntry } from '../../features/experiences/events/events.types'

const mockNavigate = jest.fn()
const mockUseCanEditEvent = jest.fn()
const mockUseGetEventByIdQuery = jest.fn()
let mockIdentityReturn: { hasValidIdentity: boolean; identity?: unknown }
let mockLocationState: { event?: EventEntry } | null
let mockParams: { eventId?: string }
let mockSearch = ''

jest.mock('../../features/experiences/events', () => ({
  useGetEventByIdQuery: (...args: unknown[]) => mockUseGetEventByIdQuery(...args)
}))

// CreateEventPage must be imported AFTER jest.mock so the mocked barrel wins.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CreateEventPage } = require('./CreateEventPage') as typeof import('./CreateEventPage')

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    state: mockLocationState,
    pathname: mockParams.eventId ? `/whats-on/edit-hangout/${mockParams.eventId}` : '/whats-on/new-hangout',
    search: mockSearch,
    hash: '',
    key: 'default'
  }),
  useParams: () => mockParams,
  useSearchParams: () => [new URLSearchParams(mockSearch), jest.fn()]
}))

jest.mock('../../hooks/useCanEditEvent', () => ({
  useCanEditEvent: (...args: unknown[]) => mockUseCanEditEvent(...args)
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('./CreateEventPage.styled', () => ({
  BackArrowIcon: () => <span data-testid="back-arrow" />,
  BackButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button data-testid="back-button" {...props}>
      {children}
    </button>
  ),
  HeaderRow: ({ children }: { children: React.ReactNode }) => <div data-testid="header-row">{children}</div>,
  PageBackground: () => <div data-testid="page-background" />,
  PageContent: ({ children }: { children: React.ReactNode }) => <main data-testid="page-content">{children}</main>,
  PageTitle: ({ children }: { children: React.ReactNode }) => <h1 data-testid="page-title">{children}</h1>
}))

jest.mock('../../components/whats-on/CreateEvent/EventForm', () => ({
  EventForm: ({
    initialEvent,
    initialCommunityId,
    initialOpenPreview,
    onCancel,
    onSuccess
  }: {
    initialEvent?: EventEntry | null
    initialCommunityId?: string | null
    initialOpenPreview?: boolean
    onCancel: () => void
    onSuccess: () => void
  }) => (
    <div
      data-testid="event-form"
      data-event-id={initialEvent?.id ?? ''}
      data-community-id={initialCommunityId ?? ''}
      data-open-preview={String(Boolean(initialOpenPreview))}
    >
      <button data-testid="form-cancel" onClick={onCancel}>
        cancel
      </button>
      <button data-testid="form-success" onClick={onSuccess}>
        success
      </button>
    </div>
  )
}))

jest.mock('../../components/whats-on/CreateEvent/CreateEventSuccess', () => ({
  CreateEventSuccess: () => <div data-testid="create-event-success" />
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => mockIdentityReturn
}))

describe('CreateEventPage', () => {
  beforeEach(() => {
    mockIdentityReturn = { hasValidIdentity: true, identity: undefined }
    mockLocationState = null
    mockParams = {}
    mockSearch = ''
    mockUseCanEditEvent.mockReturnValue({ canEdit: false, isLoading: false })
    mockUseGetEventByIdQuery.mockReturnValue({ data: undefined, isFetching: false, isError: false })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the user is not authenticated', () => {
    beforeEach(() => {
      mockIdentityReturn = { hasValidIdentity: false }
    })

    it('should redirect to /whats-on', () => {
      render(<CreateEventPage />)

      expect(mockNavigate).toHaveBeenCalledWith('/whats-on', { replace: true })
    })

    it('should render nothing in the page body', () => {
      render(<CreateEventPage />)

      expect(screen.queryByTestId('event-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('create-event-success')).not.toBeInTheDocument()
    })
  })

  describe('when the user is authenticated and has not submitted yet', () => {
    it('should render the event form', () => {
      render(<CreateEventPage />)

      expect(screen.getByTestId('event-form')).toBeInTheDocument()
    })

    it('should not render the success screen', () => {
      render(<CreateEventPage />)

      expect(screen.queryByTestId('create-event-success')).not.toBeInTheDocument()
    })

    it('should navigate to /whats-on when the back button is clicked', () => {
      render(<CreateEventPage />)

      fireEvent.click(screen.getByTestId('back-button'))

      expect(mockNavigate).toHaveBeenCalledWith('/whats-on')
    })

    it('should navigate to /whats-on when the form cancel callback fires', () => {
      render(<CreateEventPage />)

      fireEvent.click(screen.getByTestId('form-cancel'))

      expect(mockNavigate).toHaveBeenCalledWith('/whats-on')
    })
  })

  describe('when the create route is opened with a community_id query param', () => {
    beforeEach(() => {
      mockSearch = '?community_id=community-from-explorer&utm_source=explorer'
    })

    it('should forward the community id to the event form so the community is pre-selected', () => {
      render(<CreateEventPage />)

      expect(screen.getByTestId('event-form')).toHaveAttribute('data-community-id', 'community-from-explorer')
    })
  })

  describe('when the create route is opened with an empty community_id query param', () => {
    beforeEach(() => {
      mockSearch = '?community_id=%20%20'
    })

    it('should treat the param as absent and forward null to the event form', () => {
      render(<CreateEventPage />)

      expect(screen.getByTestId('event-form')).toHaveAttribute('data-community-id', '')
    })
  })

  describe('when the edit route includes a community_id query param', () => {
    let event: EventEntry

    beforeEach(() => {
      event = createMockEvent({ id: 'ev-42', user: '0xCreator' })
      mockLocationState = { event }
      mockParams = { eventId: 'ev-42' }
      mockSearch = '?community_id=stale-deeplink'
      mockUseCanEditEvent.mockReturnValue({ canEdit: true, isLoading: false })
    })

    it('should ignore the query param so the event keeps its persisted community', () => {
      render(<CreateEventPage />)

      expect(screen.getByTestId('event-form')).toHaveAttribute('data-community-id', '')
    })
  })

  describe('when the event form reports a successful submission', () => {
    it('should render the success screen and hide the form', () => {
      render(<CreateEventPage />)

      fireEvent.click(screen.getByTestId('form-success'))

      expect(screen.getByTestId('create-event-success')).toBeInTheDocument()
      expect(screen.queryByTestId('event-form')).not.toBeInTheDocument()
    })
  })

  describe('when the edit route has a matching event and permissions are loaded', () => {
    let event: EventEntry

    beforeEach(() => {
      event = createMockEvent({ id: 'ev-42', user: '0xCreator' })
      mockLocationState = { event }
      mockParams = { eventId: 'ev-42' }
      mockUseCanEditEvent.mockReturnValue({ canEdit: true, isLoading: false })
    })

    it('should render the edit title', () => {
      render(<CreateEventPage />)

      expect(screen.getByTestId('page-title')).toHaveTextContent('create_event.edit_title')
    })

    it('should pass the event to the form', () => {
      render(<CreateEventPage />)

      expect(screen.getByTestId('event-form')).toHaveAttribute('data-event-id', 'ev-42')
    })

    it('should check edit permissions with the event creator', () => {
      render(<CreateEventPage />)

      expect(mockUseCanEditEvent).toHaveBeenCalledWith('0xCreator')
    })
  })

  describe('when the edit route permissions are still loading', () => {
    let event: EventEntry

    beforeEach(() => {
      event = createMockEvent({ id: 'ev-42', user: '0xCreator' })
      mockLocationState = { event }
      mockParams = { eventId: 'ev-42' }
      mockUseCanEditEvent.mockReturnValue({ canEdit: false, isLoading: true })
    })

    it('should defer the redirect until permissions resolve', () => {
      render(<CreateEventPage />)

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should not render the form before authorization is known', () => {
      render(<CreateEventPage />)

      expect(screen.queryByTestId('event-form')).not.toBeInTheDocument()
    })
  })

  describe('when the edit route permissions are loaded and the user cannot edit', () => {
    let event: EventEntry

    beforeEach(() => {
      event = createMockEvent({ id: 'ev-42', user: '0xCreator' })
      mockLocationState = { event }
      mockParams = { eventId: 'ev-42' }
      mockUseCanEditEvent.mockReturnValue({ canEdit: false, isLoading: false })
    })

    it('should redirect to /whats-on', () => {
      render(<CreateEventPage />)

      expect(mockNavigate).toHaveBeenCalledWith('/whats-on', { replace: true })
    })
  })

  describe('when the edit route is opened with the openPreview query param', () => {
    let event: EventEntry

    beforeEach(() => {
      event = createMockEvent({ id: 'ev-42', user: '0xCreator' })
      mockLocationState = { event }
      mockParams = { eventId: 'ev-42' }
      mockSearch = '?openPreview'
      mockUseCanEditEvent.mockReturnValue({ canEdit: true, isLoading: false })
    })

    it('should forward initialOpenPreview=true to the event form', () => {
      render(<CreateEventPage />)

      expect(screen.getByTestId('event-form')).toHaveAttribute('data-open-preview', 'true')
    })
  })

  describe('when the edit route does not include the openPreview query param', () => {
    let event: EventEntry

    beforeEach(() => {
      event = createMockEvent({ id: 'ev-42', user: '0xCreator' })
      mockLocationState = { event }
      mockParams = { eventId: 'ev-42' }
      mockUseCanEditEvent.mockReturnValue({ canEdit: true, isLoading: false })
    })

    it('should forward initialOpenPreview=false to the event form', () => {
      render(<CreateEventPage />)

      expect(screen.getByTestId('event-form')).toHaveAttribute('data-open-preview', 'false')
    })
  })

  describe('when the new route is opened with the openPreview query param', () => {
    beforeEach(() => {
      mockSearch = '?openPreview'
    })

    it('should ignore the param and forward initialOpenPreview=false', () => {
      render(<CreateEventPage />)

      expect(screen.getByTestId('event-form')).toHaveAttribute('data-open-preview', 'false')
    })
  })

  describe('when the edit route is opened via direct link (no location state)', () => {
    beforeEach(() => {
      mockLocationState = null
      mockParams = { eventId: 'ev-42' }
    })

    describe('and the event fetch is in flight', () => {
      beforeEach(() => {
        mockUseGetEventByIdQuery.mockReturnValue({ data: undefined, isFetching: true, isError: false })
      })

      it('should not redirect while loading', () => {
        render(<CreateEventPage />)

        expect(mockNavigate).not.toHaveBeenCalled()
      })

      it('should not render the form while loading', () => {
        render(<CreateEventPage />)

        expect(screen.queryByTestId('event-form')).not.toBeInTheDocument()
      })
    })

    describe('and the event fetch resolves with a matching event', () => {
      let event: EventEntry

      beforeEach(() => {
        event = createMockEvent({ id: 'ev-42', user: '0xCreator' })
        mockUseGetEventByIdQuery.mockReturnValue({ data: event, isFetching: false, isError: false })
        mockUseCanEditEvent.mockReturnValue({ canEdit: true, isLoading: false })
      })

      it('should pass the fetched event to the form', () => {
        render(<CreateEventPage />)

        expect(screen.getByTestId('event-form')).toHaveAttribute('data-event-id', 'ev-42')
      })

      it('should not redirect', () => {
        render(<CreateEventPage />)

        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })

    describe('and the event fetch errors', () => {
      beforeEach(() => {
        mockUseGetEventByIdQuery.mockReturnValue({ data: undefined, isFetching: false, isError: true })
      })

      it('should redirect to /whats-on', () => {
        render(<CreateEventPage />)

        expect(mockNavigate).toHaveBeenCalledWith('/whats-on', { replace: true })
      })
    })
  })
})
