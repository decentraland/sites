import { fireEvent, render, screen } from '@testing-library/react'
import { createMockEvent } from '../../../__test-utils__/factories'
import { EventForm } from './EventForm'

jest.mock('./EventForm.styled', () => ({
  AddCoverBold: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  AddCoverLight: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  AddCoverText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  AddVerticalCoverButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button data-testid="add-vertical-cover" {...props}>
      {children}
    </button>
  ),
  CancelButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button data-testid="cancel-button" {...props}>
      {children}
    </button>
  ),
  ChipErrorText: ({ children }: { children: React.ReactNode }) => <span data-testid="chip-error-text">{children}</span>,
  ContentContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CoordPrefix: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  CoordinatesRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DateTimeRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DateTimeSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DescriptionFields: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EmailSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ErrorMessage: ({ children }: { children: React.ReactNode }) => <span data-testid="error-message">{children}</span>,
  EventDetailsBlock: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EventFormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EventInputLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  EventMenuItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
  EventSelect: ({
    children,
    value,
    onChange
  }: {
    children: React.ReactNode
    value: string
    onChange: (e: unknown) => void
    label?: string
    notched?: boolean
  }) => (
    <select data-testid="event-select" value={value} onChange={onChange}>
      {children}
    </select>
  ),
  EventSwitch: ({ checked, onChange }: { checked: boolean; onChange: (e: unknown, checked: boolean) => void; size?: string }) => (
    <button data-testid="event-switch" data-checked={checked} onClick={() => onChange(null, !checked)}>
      Toggle
    </button>
  ),
  EventTextArea: (props: Record<string, unknown>) => {
    const { label, value, onChange, placeholder, ...rest } = props
    return (
      <textarea
        data-testid="event-textarea"
        aria-label={label as string}
        value={value as string}
        onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
        placeholder={placeholder as string}
        {...rest}
      />
    )
  },
  EventTextField: (props: Record<string, unknown>) => {
    const { label, value, onChange, placeholder, type, ...rest } = props
    return (
      <input
        data-testid="event-textfield"
        aria-label={label as string}
        value={value as string}
        onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
        placeholder={placeholder as string}
        type={(type as string) || 'text'}
        {...rest}
      />
    )
  },
  FormActions: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormColumns: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ImageSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IntervalChip: ({
    children,
    $active,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; $active: boolean }) => (
    <button data-testid="interval-chip" data-active={$active} {...props}>
      {children}
    </button>
  ),
  IntervalChipGroup: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
    <div data-testid="interval-chip-group" {...props}>
      {children}
    </div>
  ),
  IntervalChipLabel: ({ children }: { children: React.ReactNode }) => <span data-testid="interval-chip-label">{children}</span>,
  IntervalChipRow: ({ children }: { children: React.ReactNode }) => <div data-testid="interval-chip-row">{children}</div>,
  LeftCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LocationBlock: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LocationLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  LocationRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RepeatFields: ({ children, $visible }: { children: React.ReactNode; $visible: boolean }) => (
    <div data-testid="repeat-fields" data-visible={$visible}>
      {children}
    </div>
  ),
  RepeatLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  RepeatRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ReviewText: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => <span {...props}>{children}</span>,
  ReviewBar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ReviewNotice: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PreviewButton: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; $enabled?: boolean }) => {
    const { $enabled, ...rest } = props as React.ButtonHTMLAttributes<HTMLButtonElement> & { $enabled?: boolean }
    return (
      <button data-testid="preview-button" {...rest}>
        {children}
      </button>
    )
  },
  RejectionAlert: ({ children, severity }: { children: React.ReactNode; severity?: string }) => (
    <div role="alert" data-severity={severity}>
      {children}
    </div>
  ),
  RightSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RightSectionFields: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RightSectionFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SectionHeading: ({ children }: { children: React.ReactNode }) => <h2 data-testid="section-heading">{children}</h2>,
  SubmitButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button data-testid="submit-button" {...props}>
      {children}
    </button>
  ),
  SubmitErrorMessage: ({ children }: { children: React.ReactNode }) => <span data-testid="submit-error-message">{children}</span>
}))

jest.mock('../EventDetailModal', () => ({
  EventDetailModal: ({ open, data }: { open: boolean; data: { creatorAddress?: string; creatorName?: string } | null }) =>
    open && data ? (
      <div data-testid="event-detail-modal" data-creator-address={data.creatorAddress ?? ''} data-creator-name={data.creatorName ?? ''} />
    ) : null
}))

jest.mock('./ImageUpload', () => ({
  ImageUpload: () => <div data-testid="image-upload" />
}))

jest.mock('./VerticalCoverPanel', () => ({
  VerticalCoverPanel: () => <div data-testid="vertical-cover-panel" />
}))

jest.mock('./DurationField', () => ({
  DurationField: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <input data-testid="duration-field" aria-label="create_event.duration" value={value} onChange={e => onChange(e.target.value)} />
  )
}))

jest.mock('../../../features/events', () => ({
  useGetWorldNamesQuery: () => ({ data: [] }),
  useGetCommunitiesQuery: () => ({ data: [] })
}))

const mockUseAuthIdentity = jest.fn(() => ({ identity: null, hasValidIdentity: false, address: null as string | null }))

jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => mockUseAuthIdentity()
}))

jest.mock('@mui/icons-material/AccessTime', () => ({
  __esModule: true,
  default: () => <span data-testid="access-time-icon" />
}))

jest.mock('@mui/icons-material/Add', () => ({
  __esModule: true,
  default: () => <span data-testid="add-icon" />
}))

jest.mock('@mui/icons-material/Event', () => ({
  __esModule: true,
  default: () => <span data-testid="event-icon" />
}))

jest.mock('@mui/icons-material/InfoOutlined', () => ({
  __esModule: true,
  default: () => <span data-testid="info-outlined-icon" />
}))

jest.mock('@mui/icons-material/VisibilityOutlined', () => ({
  __esModule: true,
  default: () => <span data-testid="visibility-outlined-icon" />
}))

jest.mock('decentraland-ui2', () => ({
  InputAdornment: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Tooltip: ({ children }: { children: React.ReactNode; title?: React.ReactNode }) => <>{children}</>
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) => (values ? `${key} ${JSON.stringify(values)}` : key)
  })
}))

const mockSetField = jest.fn()
const mockHandleImageSelect = jest.fn()
const mockHandleImageRemove = jest.fn()
const mockHandleSubmit = jest.fn()
const mockUseCreateEventForm = jest.fn()

jest.mock('../../../hooks/useCreateEventForm', () => ({
  useCreateEventForm: () => mockUseCreateEventForm()
}))

function createFormState(overrides = {}) {
  return {
    image: null,
    imagePreviewUrl: null,
    imageError: null,
    verticalImage: null,
    verticalImagePreviewUrl: null,
    verticalImageError: null,
    name: '',
    description: '',
    startDate: '',
    startTime: '',
    duration: '',
    repeatEnabled: false,
    frequency: 'every_day',
    repeatInterval: '1',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    repeatEndDate: '',
    location: 'land',
    coordX: '0',
    coordY: '0',
    world: '',
    communityId: '',
    email: '',
    ...overrides
  }
}

describe('EventForm', () => {
  let mockOnCancel: jest.Mock

  beforeEach(() => {
    mockOnCancel = jest.fn()
    mockUseAuthIdentity.mockReturnValue({ identity: null, hasValidIdentity: false, address: null })
    mockUseCreateEventForm.mockReturnValue({
      form: createFormState(),
      errors: {},
      setField: mockSetField,
      markRequiredFields: jest.fn(),
      handleImageSelect: mockHandleImageSelect,
      handleImageRemove: mockHandleImageRemove,
      handleVerticalImageSelect: jest.fn(),
      handleVerticalImageRemove: jest.fn(),
      isFormValid: false,
      isSubmitting: false,
      handleSubmit: mockHandleSubmit
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered', () => {
    it('should render the image upload', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('image-upload')).toBeInTheDocument()
    })

    it('should render the event name input', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByLabelText('create_event.event_name')).toBeInTheDocument()
    })

    it('should render the description textarea', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByLabelText('create_event.event_description')).toBeInTheDocument()
    })

    it('should render the section heading', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('section-heading')).toHaveTextContent('create_event.event_details')
    })

    it('should render the email input', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByLabelText('create_event.email_label')).toBeInTheDocument()
    })

    it('should render the cancel button', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('cancel-button')).toHaveTextContent('create_event.cancel')
    })

    it('should render the submit button', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('submit-button')).toHaveTextContent('create_event.submit')
    })

    it('should render the add vertical cover button', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('add-vertical-cover')).toBeInTheDocument()
    })
  })

  describe('when the form has empty required fields', () => {
    it('should keep the submit button clickable so clicking surfaces the validation errors', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('submit-button')).not.toBeDisabled()
    })
  })

  describe('when editing an event that has been rejected with a reason', () => {
    const rejectedEvent = createMockEvent({ id: 'evt-rejected', rejected: true, rejection_reason: 'Invalid image. extra notes' })

    it('should render the rejection alert and pass the reason to the translation', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} initialEvent={rejectedEvent} />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('data-severity', 'error')
      expect(alert).toHaveTextContent('create_event.rejected_alert')
      expect(alert).toHaveTextContent('"reason":"Invalid image. extra notes"')
    })
  })

  describe('when editing an event that has been rejected without a reason', () => {
    const rejectedEvent = createMockEvent({ id: 'evt-rejected', rejected: true, rejection_reason: null })

    it('should render the fallback rejection alert without reason interpolation', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} initialEvent={rejectedEvent} />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('create_event.rejected_alert_no_reason')
    })
  })

  describe('when editing an event that is not rejected', () => {
    const approvedEvent = createMockEvent({ id: 'evt-ok', rejected: false, rejection_reason: null })

    it('should not render the rejection alert', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} initialEvent={approvedEvent} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('when the preview opens in edit mode for an event submitted by another user', () => {
    const submittedEvent = createMockEvent({ id: 'evt-other', user: '0xActualCreator', user_name: 'Actual Creator' })

    beforeEach(() => {
      mockUseAuthIdentity.mockReturnValue({ identity: null, hasValidIdentity: true, address: '0xLoggedInViewer' })
    })

    it('should show the original event creator address, not the logged-in viewer address', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} initialEvent={submittedEvent} initialOpenPreview />)

      const modal = screen.getByTestId('event-detail-modal')
      expect(modal).toHaveAttribute('data-creator-address', '0xActualCreator')
    })

    it('should show the original event creator name, not undefined', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} initialEvent={submittedEvent} initialOpenPreview />)

      const modal = screen.getByTestId('event-detail-modal')
      expect(modal).toHaveAttribute('data-creator-name', 'Actual Creator')
    })
  })

  describe('when the preview opens for a brand new event being created', () => {
    beforeEach(() => {
      mockUseAuthIdentity.mockReturnValue({ identity: null, hasValidIdentity: true, address: '0xLoggedInCreator' })
    })

    it('should fall back to the logged-in user address as the creator', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} initialOpenPreview />)

      const modal = screen.getByTestId('event-detail-modal')
      expect(modal).toHaveAttribute('data-creator-address', '0xLoggedInCreator')
    })

    it('should not include a creator name (the logged-in user has none here)', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} initialOpenPreview />)

      const modal = screen.getByTestId('event-detail-modal')
      expect(modal).toHaveAttribute('data-creator-name', '')
    })
  })

  describe('when an image is uploading', () => {
    beforeEach(() => {
      mockUseCreateEventForm.mockReturnValue({
        form: createFormState({ isUploadingImage: true }),
        errors: {},
        setField: mockSetField,
        handleImageSelect: mockHandleImageSelect,
        handleImageRemove: mockHandleImageRemove,
        handleVerticalImageSelect: jest.fn(),
        handleVerticalImageRemove: jest.fn(),
        isFormValid: false,
        isSubmitting: false,
        handleSubmit: mockHandleSubmit
      })
    })

    it('should render the submit button as disabled', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })
  })

  describe('when a vertical image is uploading', () => {
    beforeEach(() => {
      mockUseCreateEventForm.mockReturnValue({
        form: createFormState({ isUploadingVerticalImage: true }),
        errors: {},
        setField: mockSetField,
        handleImageSelect: mockHandleImageSelect,
        handleImageRemove: mockHandleImageRemove,
        handleVerticalImageSelect: jest.fn(),
        handleVerticalImageRemove: jest.fn(),
        isFormValid: false,
        isSubmitting: false,
        handleSubmit: mockHandleSubmit
      })
    })

    it('should render the submit button as disabled', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })
  })

  describe('when an image error is present', () => {
    beforeEach(() => {
      mockUseCreateEventForm.mockReturnValue({
        form: createFormState({ imageError: 'image_too_large' }),
        errors: {},
        setField: mockSetField,
        handleImageSelect: mockHandleImageSelect,
        handleImageRemove: mockHandleImageRemove,
        handleVerticalImageSelect: jest.fn(),
        handleVerticalImageRemove: jest.fn(),
        isFormValid: false,
        isSubmitting: false,
        handleSubmit: mockHandleSubmit
      })
    })

    it('should disable submit so the inline image error (with red-border animation) is what the user acts on', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })
  })

  describe('when a vertical image error is present', () => {
    beforeEach(() => {
      mockUseCreateEventForm.mockReturnValue({
        form: createFormState({ verticalImageError: 'vertical_image_dimensions' }),
        errors: {},
        setField: mockSetField,
        handleImageSelect: mockHandleImageSelect,
        handleImageRemove: mockHandleImageRemove,
        handleVerticalImageSelect: jest.fn(),
        handleVerticalImageRemove: jest.fn(),
        isFormValid: false,
        isSubmitting: false,
        handleSubmit: mockHandleSubmit
      })
    })

    it('should disable submit so the vertical panel error is what the user acts on', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })
  })

  describe('when the form is valid', () => {
    beforeEach(() => {
      mockUseCreateEventForm.mockReturnValue({
        form: createFormState({
          name: 'Test Event',
          description: 'Description',
          startDate: '2026-05-01',
          startTime: '10:00',
          duration: '02:00',
          coordX: '10',
          coordY: '20'
        }),
        errors: {},
        setField: mockSetField,
        handleImageSelect: mockHandleImageSelect,
        handleImageRemove: mockHandleImageRemove,
        handleVerticalImageSelect: jest.fn(),
        handleVerticalImageRemove: jest.fn(),
        isFormValid: true,
        isSubmitting: false,
        handleSubmit: mockHandleSubmit
      })
    })

    it('should render the submit button as enabled', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('submit-button')).not.toBeDisabled()
    })
  })

  describe('when cancel is clicked', () => {
    it('should call onCancel', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      fireEvent.click(screen.getByTestId('cancel-button'))

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('when interacting with form fields', () => {
    it('should call setField when the event name changes', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      fireEvent.change(screen.getByLabelText('create_event.event_name'), { target: { value: 'New Event' } })

      expect(mockSetField).toHaveBeenCalledWith('name', 'New Event')
    })

    it('should call setField when the description changes', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      fireEvent.change(screen.getByLabelText('create_event.event_description'), { target: { value: 'A description' } })

      expect(mockSetField).toHaveBeenCalledWith('description', 'A description')
    })

    it('should call handleSubmit when the submit button is clicked', () => {
      mockUseCreateEventForm.mockReturnValue({
        form: createFormState({
          name: 'Test',
          description: 'Desc',
          startDate: '2026-05-01',
          startTime: '10:00',
          duration: '02:00',
          coordX: '10',
          coordY: '20'
        }),
        errors: {},
        setField: mockSetField,
        handleImageSelect: mockHandleImageSelect,
        handleImageRemove: mockHandleImageRemove,
        handleVerticalImageSelect: jest.fn(),
        handleVerticalImageRemove: jest.fn(),
        isFormValid: true,
        isSubmitting: false,
        handleSubmit: mockHandleSubmit
      })

      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      fireEvent.click(screen.getByTestId('submit-button'))

      expect(mockHandleSubmit).toHaveBeenCalled()
    })
  })

  describe('when the form is submitting', () => {
    beforeEach(() => {
      mockUseCreateEventForm.mockReturnValue({
        form: createFormState({
          name: 'Test Event',
          description: 'Description',
          startDate: '2026-05-01',
          startTime: '10:00',
          duration: '02:00',
          coordX: '10',
          coordY: '20'
        }),
        errors: {},
        setField: mockSetField,
        handleImageSelect: mockHandleImageSelect,
        handleImageRemove: mockHandleImageRemove,
        handleVerticalImageSelect: jest.fn(),
        handleVerticalImageRemove: jest.fn(),
        isFormValid: true,
        isSubmitting: true,
        handleSubmit: mockHandleSubmit
      })
    })

    it('should render the submit button as disabled', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })

    it('should render the submitting text', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('submit-button')).toHaveTextContent('create_event.submitting')
    })
  })

  describe('when a submit error exists', () => {
    beforeEach(() => {
      mockUseCreateEventForm.mockReturnValue({
        form: createFormState(),
        errors: { submit: 'Something went wrong' },
        setField: mockSetField,
        handleImageSelect: mockHandleImageSelect,
        handleImageRemove: mockHandleImageRemove,
        handleVerticalImageSelect: jest.fn(),
        handleVerticalImageRemove: jest.fn(),
        isFormValid: false,
        isSubmitting: false,
        handleSubmit: mockHandleSubmit
      })
    })

    it('should render the submit error message', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  describe('when a vertical image preview exists', () => {
    beforeEach(() => {
      mockUseCreateEventForm.mockReturnValue({
        form: createFormState({ verticalImagePreviewUrl: 'blob:http://localhost/vertical' }),
        errors: {},
        setField: mockSetField,
        handleImageSelect: mockHandleImageSelect,
        handleImageRemove: mockHandleImageRemove,
        handleVerticalImageSelect: jest.fn(),
        handleVerticalImageRemove: jest.fn(),
        isFormValid: false,
        isSubmitting: false,
        handleSubmit: mockHandleSubmit
      })
    })

    it('should render the remove vertical cover text', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('add-vertical-cover')).toHaveTextContent('create_event.remove_vertical_cover')
    })
  })

  describe('when no vertical image preview exists', () => {
    it('should render the add vertical cover text', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('add-vertical-cover')).toHaveTextContent('create_event.add_vertical_cover')
    })
  })

  describe('when a vertical image error exists', () => {
    beforeEach(() => {
      mockUseCreateEventForm.mockReturnValue({
        form: createFormState({ verticalImageError: 'vertical_image_dimensions' }),
        errors: {},
        setField: mockSetField,
        handleImageSelect: mockHandleImageSelect,
        handleImageRemove: mockHandleImageRemove,
        handleVerticalImageSelect: jest.fn(),
        handleVerticalImageRemove: jest.fn(),
        isFormValid: false,
        isSubmitting: false,
        handleSubmit: mockHandleSubmit
      })
    })

    it('should render the VerticalCoverPanel so it can show the error with the animated red border', () => {
      render(<EventForm onCancel={mockOnCancel} onSuccess={jest.fn()} />)

      expect(screen.getByTestId('vertical-cover-panel')).toBeInTheDocument()
    })
  })
})
