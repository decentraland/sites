import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const { UsersAdminPage } = require('./UsersAdminPage')

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../../hooks/useAdminPermissions', () => ({
  useAdminPermissions: () => ({ canEditAnyProfile: true, isLoading: false })
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: undefined, hasValidIdentity: false, address: undefined })
}))

jest.mock('../../features/whats-on/admin/admin.types', () => ({
  AdminPermission: {
    APPROVE_OWN_EVENT: 'approve_own_event',
    APPROVE_ANY_EVENT: 'approve_any_event',
    EDIT_ANY_EVENT: 'edit_any_event',
    EDIT_ANY_SCHEDULE: 'edit_any_schedule',
    EDIT_ANY_PROFILE: 'edit_any_profile'
  }
}))

jest.mock('../../features/whats-on/admin/admin.client', () => ({
  useListAdminsQuery: () => ({ data: [], isFetching: false, refetch: jest.fn() }),
  useUpdateAdminPermissionsMutation: () => [jest.fn(), { isLoading: false }]
}))

jest.mock('../../components/whats-on/AdminPermissionsModal', () => ({
  AdminPermissionsModal: () => <div data-testid="admin-permissions-modal" />
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
  useProfileAvatar: () => ({ avatarFace: undefined, name: undefined })
}))

jest.mock('decentraland-ui2', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div role="alert">{children}</div>,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
  InputAdornment: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Snackbar: ({ open, children }: { open: boolean; children: React.ReactNode }) => (open ? <div>{children}</div> : null),
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
  TableHead: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TablePagination: () => <div data-testid="table-pagination" />,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TextField: ({ label }: { label: string }) => <label>{label}</label>
}))

describe('when rendering UsersAdminPage with canEditAnyProfile', () => {
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
