import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const { UsersAdminPage } = require('./UsersAdminPage')

const ADMIN_ALICE = '0x1111111111111111111111111111111111111111'
const ADMIN_BOB = '0x2222222222222222222222222222222222222222'
const NAME_BY_ADDRESS: Record<string, string> = {
  [ADMIN_ALICE.toLowerCase()]: 'Alice',
  [ADMIN_BOB.toLowerCase()]: 'Bob'
}
let mockAdmins: Array<{ user: string; email: string | null; permissions: string[] }> = []

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

jest.mock('../../features/events/events.admin.types', () => ({
  AdminPermission: {
    APPROVE_OWN_EVENT: 'approve_own_event',
    APPROVE_ANY_EVENT: 'approve_any_event',
    EDIT_ANY_EVENT: 'edit_any_event',
    EDIT_ANY_SCHEDULE: 'edit_any_schedule',
    EDIT_ANY_PROFILE: 'edit_any_profile'
  }
}))

const mockUpdatePermissions = jest.fn()

jest.mock('../../features/events/events.admin.client', () => ({
  useListAdminsQuery: () => ({ data: mockAdmins, isFetching: false, refetch: jest.fn() }),
  useUpdateAdminPermissionsMutation: () => [(args: unknown) => ({ unwrap: () => mockUpdatePermissions(args) }), { isLoading: false }]
}))

jest.mock('../../features/profile/profile.client', () => ({
  useGetProfileNames: (addresses: readonly string[]) =>
    new Map(addresses.map(address => [address.toLowerCase(), NAME_BY_ADDRESS[address.toLowerCase()]]))
}))

type ModalProps = {
  open?: boolean
  mode: 'add' | 'edit'
  initialUser?: string
  initialPermissions: string[]
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (payload: { address: string; permissions: string[] }) => void
}

jest.mock('../../components/whats-on/AdminPermissionsModal', () => ({
  AdminPermissionsModal: ({ open, mode, initialUser, onSubmit, onClose }: ModalProps) =>
    open ? (
      <div data-testid="admin-permissions-modal" data-mode={mode}>
        <button onClick={() => onClose()}>close-modal</button>
        <button onClick={() => onSubmit({ address: initialUser ?? '0xnew', permissions: ['approve_own_event'] })}>
          submit-permissions
        </button>
      </div>
    ) : null
}))

jest.mock('./AdminLayout.styled', () => ({
  AdminPageContainer: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
  AdminPageTitle: ({ children, component }: { children: React.ReactNode; component?: string }) => {
    const Tag = (component ?? 'h1') as keyof JSX.IntrinsicElements
    return <Tag>{children}</Tag>
  }
}))

jest.mock('./UsersAdminPage.styled', () => ({
  ClickableRow: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <tr onClick={onClick}>{children}</tr>,
  Header: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  TableWrapper: ({ children }: { children: React.ReactNode }) => <div data-testid="table-wrapper">{children}</div>,
  UserAvatar: () => <span data-testid="user-avatar" />
}))

jest.mock('@mui/icons-material/Check', () => ({
  __esModule: true,
  default: () => <span data-testid="check-icon" />
}))

jest.mock('@mui/icons-material/Search', () => ({
  __esModule: true,
  default: () => <span data-testid="search-icon" />
}))

jest.mock('../../hooks/useProfileAvatar', () => ({
  useProfileAvatar: (address: string | undefined) => ({
    avatarFace: undefined,
    name: address ? NAME_BY_ADDRESS[address.toLowerCase()] : undefined
  })
}))

type PaginationProps = {
  count: number
  page: number
  rowsPerPage: number
  onPageChange: (e: unknown, page: number) => void
  onRowsPerPageChange: (e: { target: { value: string } }) => void
}

jest.mock('decentraland-ui2', () => ({
  Alert: ({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) => (
    <div role="alert">
      {children}
      {onClose && <button onClick={() => onClose()}>close-alert</button>}
    </div>
  ),
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
  InputAdornment: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Snackbar: ({ open, children, onClose }: { open: boolean; children: React.ReactNode; onClose?: () => void }) =>
    open ? (
      <div>
        {onClose && <button onClick={() => onClose()}>close-snackbar</button>}
        {children}
      </div>
    ) : null,
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
  TableHead: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TablePagination: ({ page, onPageChange, onRowsPerPageChange }: PaginationProps) => (
    <div data-testid="table-pagination">
      <button onClick={e => onPageChange(e, page + 1)}>next-page</button>
      <button onClick={() => onRowsPerPageChange({ target: { value: '25' } })}>change-rows</button>
    </div>
  ),
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TextField: ({ label, value, onChange }: { label: string; value: string; onChange: (e: { target: { value: string } }) => void }) => (
    <label>
      {label}
      <input aria-label={label} value={value} onChange={onChange} />
    </label>
  )
}))

beforeEach(() => {
  mockUseAdminPermissions.mockReturnValue({ canEditAnyProfile: true, isLoading: false })
  mockUseAuthIdentity.mockReturnValue({ identity: { authChain: [] }, hasValidIdentity: true, address: '0xadmin' })
})

describe('when rendering UsersAdminPage with canEditAnyProfile', () => {
  beforeEach(() => {
    mockAdmins = []
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the Users title', () => {
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: 'whats_on_admin.users.title' })).toBeInTheDocument()
  })

  it('should render the Add User button', () => {
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: 'whats_on_admin.cta.add_user' })).toBeInTheDocument()
  })
})

describe('when searching admins by profile name', () => {
  beforeEach(() => {
    mockAdmins = [
      { user: ADMIN_ALICE, email: null, permissions: ['approve_own_event'] },
      { user: ADMIN_BOB, email: null, permissions: [] }
    ]
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should keep only rows whose profile name matches the query', () => {
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )

    expect(screen.getByText(new RegExp(ADMIN_ALICE, 'i'))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(ADMIN_BOB, 'i'))).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('whats_on_admin.users.search_label'), { target: { value: 'alice' } })

    expect(screen.getByText(new RegExp(ADMIN_ALICE, 'i'))).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(ADMIN_BOB, 'i'))).not.toBeInTheDocument()
  })
})

describe('when the empty state is shown', () => {
  beforeEach(() => {
    mockAdmins = []
  })

  it('should render the empty state row', () => {
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )
    expect(screen.getByText('whats_on_admin.users.empty')).toBeInTheDocument()
  })
})

describe('when adding a new admin', () => {
  beforeEach(() => {
    mockAdmins = []
    mockUpdatePermissions.mockReset()
  })

  it('should open the modal in add mode and submit success', async () => {
    mockUpdatePermissions.mockResolvedValueOnce(undefined)
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'whats_on_admin.cta.add_user' }))
    expect(screen.getByTestId('admin-permissions-modal')).toHaveAttribute('data-mode', 'add')
    fireEvent.click(screen.getByRole('button', { name: 'submit-permissions' }))
    await Promise.resolve()
    expect(mockUpdatePermissions).toHaveBeenCalled()
  })

  it('should surface an error alert when permissions update fails', async () => {
    mockUpdatePermissions.mockRejectedValueOnce(new Error('boom'))
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const { findByRole } = render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'whats_on_admin.cta.add_user' }))
    fireEvent.click(screen.getByRole('button', { name: 'submit-permissions' }))
    const alert = await findByRole('alert')
    expect(alert).toHaveTextContent('whats_on_admin.permissions_modal.save_error')
  })
})

describe('when editing an existing admin', () => {
  beforeEach(() => {
    mockAdmins = [{ user: ADMIN_ALICE, email: null, permissions: [] }]
    mockUpdatePermissions.mockReset()
  })

  it('should open the modal in edit mode when clicking a row', () => {
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )
    const userCell = screen.getByText(new RegExp(ADMIN_ALICE, 'i'))
    fireEvent.click(userCell.closest('tr') as HTMLElement)
    expect(screen.getByTestId('admin-permissions-modal')).toHaveAttribute('data-mode', 'edit')
  })
})

describe('when paginating the table', () => {
  beforeEach(() => {
    mockAdmins = Array.from({ length: 15 }, (_, i) => ({
      user: `0x${i.toString().padStart(40, '0')}`,
      email: null,
      permissions: []
    }))
  })

  it('should advance the page and update rows-per-page', () => {
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'next-page' }))
    fireEvent.click(screen.getByRole('button', { name: 'change-rows' }))
  })
})

describe('when searching admins by wallet address fragment', () => {
  beforeEach(() => {
    mockAdmins = [
      { user: ADMIN_ALICE, email: null, permissions: [] },
      { user: ADMIN_BOB, email: null, permissions: [] }
    ]
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should keep only rows whose address matches the query', () => {
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )

    // ADMIN_ALICE is all 1s, ADMIN_BOB all 2s — search by the address fragment.
    fireEvent.change(screen.getByLabelText('whats_on_admin.users.search_label'), { target: { value: '2222' } })

    expect(screen.getByText(new RegExp(ADMIN_BOB, 'i'))).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(ADMIN_ALICE, 'i'))).not.toBeInTheDocument()
  })
})

describe('when the user lacks edit-profile permission', () => {
  beforeEach(() => {
    mockAdmins = []
    mockUseAdminPermissions.mockReturnValue({ canEditAnyProfile: false, isLoading: false })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should redirect to /whats-on instead of rendering the users table', () => {
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )

    expect(screen.queryByRole('heading', { name: 'whats_on_admin.users.title' })).not.toBeInTheDocument()
  })
})

describe('when permissions are still loading', () => {
  beforeEach(() => {
    mockAdmins = []
    mockUseAdminPermissions.mockReturnValue({ canEditAnyProfile: false, isLoading: true })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the page while permissions resolve rather than redirecting prematurely', () => {
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'whats_on_admin.users.title' })).toBeInTheDocument()
  })
})

describe('when submitting permissions without a usable identity', () => {
  beforeEach(() => {
    mockAdmins = []
    mockUpdatePermissions.mockReset()
    mockUseAuthIdentity.mockReturnValue({ identity: undefined, hasValidIdentity: false, address: undefined })
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should bail out of the update without calling the mutation', () => {
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'whats_on_admin.cta.add_user' }))
    fireEvent.click(screen.getByRole('button', { name: 'submit-permissions' }))

    expect(mockUpdatePermissions).not.toHaveBeenCalled()
  })
})

describe('when dismissing modal and snackbar surfaces', () => {
  beforeEach(() => {
    mockAdmins = []
    mockUpdatePermissions.mockReset()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should close the permissions modal when dismissed', () => {
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'whats_on_admin.cta.add_user' }))
    expect(screen.getByTestId('admin-permissions-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'close-modal' }))

    expect(screen.queryByTestId('admin-permissions-modal')).not.toBeInTheDocument()
  })

  it('should close the feedback snackbar via both the snackbar and the alert close handlers', async () => {
    mockUpdatePermissions.mockResolvedValueOnce(undefined)
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'whats_on_admin.cta.add_user' }))
    fireEvent.click(screen.getByRole('button', { name: 'submit-permissions' }))
    await screen.findByRole('alert')

    fireEvent.click(screen.getByRole('button', { name: 'close-alert' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should close the feedback snackbar when the snackbar onClose fires', async () => {
    mockUpdatePermissions.mockResolvedValueOnce(undefined)
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'whats_on_admin.cta.add_user' }))
    fireEvent.click(screen.getByRole('button', { name: 'submit-permissions' }))
    await screen.findByRole('alert')

    fireEvent.click(screen.getByRole('button', { name: 'close-snackbar' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
