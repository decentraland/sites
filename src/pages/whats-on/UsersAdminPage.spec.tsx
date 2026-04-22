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

jest.mock('../../features/whats-on/admin', () => ({
  AdminPermission: {
    APPROVE_OWN_EVENT: 'approve_own_event',
    APPROVE_ANY_EVENT: 'approve_any_event',
    EDIT_ANY_EVENT: 'edit_any_event',
    EDIT_ANY_SCHEDULE: 'edit_any_schedule',
    EDIT_ANY_PROFILE: 'edit_any_profile'
  },
  useListAdminsQuery: () => ({ data: [], isFetching: false, refetch: jest.fn() }),
  useUpdateAdminPermissionsMutation: () => [jest.fn(), { isLoading: false }]
}))

jest.mock('../../components/whats-on/AdminPermissionsModal', () => ({
  AdminPermissionsModal: () => <div data-testid="admin-permissions-modal" />
}))

jest.mock('./UsersAdminPage.styled', () => ({
  Header: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  PageContainer: ({ children }: { children: React.ReactNode }) => <main>{children}</main>
}))

jest.mock('@mui/icons-material/Check', () => ({
  __esModule: true,
  default: () => <span data-testid="check-icon" />
}))

jest.mock('decentraland-ui2', () => ({
  Avatar: () => <span data-testid="avatar" />,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
  TableHead: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TablePagination: () => <div data-testid="table-pagination" />,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TextField: ({ label }: { label: string }) => <label>{label}</label>,
  Typography: ({ children, component }: { children: React.ReactNode; component?: string }) => {
    const Tag = (component ?? 'span') as keyof JSX.IntrinsicElements
    return <Tag>{children}</Tag>
  }
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
