import { fireEvent, render, screen } from '@testing-library/react'
import { AdminPermission } from '../../../features/whats-on/admin/admin.types'
import { AdminPermissionsModal } from './AdminPermissionsModal'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: jest.fn()
}))

jest.mock('@mui/icons-material/Close', () => ({
  __esModule: true,
  default: () => <span>X</span>
}))

jest.mock('../../../hooks/useProfileAvatar', () => ({
  useProfileAvatar: () => ({ avatarFace: undefined, name: undefined })
}))

jest.mock('./AdminPermissionsModal.styled', () => ({
  StyledDialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div role="dialog">{children}</div> : null),
  Footer: ({ children }: { children: React.ReactNode }) => <div data-testid="footer">{children}</div>,
  HeaderAddress: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  HeaderAvatar: () => <span data-testid="header-avatar" />,
  HeaderName: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  HeaderText: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalHeader: ({ children }: { children: React.ReactNode }) => <header data-testid="modal-header">{children}</header>,
  PermissionDescription: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  PermissionMeta: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PermissionRow: ({ children }: { children: React.ReactNode }) => <div data-testid="permission-row">{children}</div>,
  PermissionTitle: ({ children }: { children: React.ReactNode }) => <span>{children}</span>
}))

jest.mock('decentraland-ui2', () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  IconButton: ({
    children,
    onClick,
    ['aria-label']: ariaLabel
  }: {
    children: React.ReactNode
    onClick?: () => void
    'aria-label'?: string
  }) => (
    <button onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
  Switch: ({
    checked,
    disabled,
    onChange,
    inputProps
  }: {
    checked: boolean
    disabled?: boolean
    onChange: () => void
    inputProps?: { 'aria-label'?: string }
  }) => (
    <input
      type="checkbox"
      role="switch"
      aria-label={inputProps?.['aria-label']}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
    />
  ),
  TextField: ({
    label,
    value,
    disabled,
    onChange,
    error,
    helperText
  }: {
    label: string
    value: string
    disabled?: boolean
    onChange: (event: { target: { value: string } }) => void
    error?: boolean
    helperText?: string
  }) => (
    <label>
      {label}
      <input aria-label={label} value={value} disabled={disabled} onChange={onChange} />
      {error && helperText ? <span role="alert">{helperText}</span> : null}
    </label>
  ),
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>
}))

beforeEach(() => {
  const { useAuthIdentity } = jest.requireMock('../../../hooks/useAuthIdentity')
  useAuthIdentity.mockReturnValue({ address: undefined, identity: undefined, hasValidIdentity: false })
})

describe('when rendering AdminPermissionsModal in add mode', () => {
  let onClose: jest.Mock
  let onSubmit: jest.Mock

  beforeEach(() => {
    onClose = jest.fn()
    onSubmit = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the wallet input is empty', () => {
    it('should keep the Save button disabled', () => {
      render(<AdminPermissionsModal open mode="add" initialPermissions={[]} isSubmitting={false} onClose={onClose} onSubmit={onSubmit} />)
      expect(screen.getByRole('button', { name: 'whats_on_admin.permissions_modal.save' })).toBeDisabled()
    })
  })

  describe('and a valid wallet is entered', () => {
    beforeEach(() => {
      render(<AdminPermissionsModal open mode="add" initialPermissions={[]} isSubmitting={false} onClose={onClose} onSubmit={onSubmit} />)
      fireEvent.change(screen.getByLabelText('whats_on_admin.permissions_modal.wallet_label'), {
        target: { value: '0x0000000000000000000000000000000000000000' }
      })
    })

    it('should enable the Save button', () => {
      expect(screen.getByRole('button', { name: 'whats_on_admin.permissions_modal.save' })).toBeEnabled()
    })

    describe('and the Approve Events switch is toggled', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('switch', { name: 'whats_on_admin.permissions_modal.permissions.approve_any_event.title' }))
      })

      it('should submit with the selected permission', () => {
        fireEvent.click(screen.getByRole('button', { name: 'whats_on_admin.permissions_modal.save' }))
        expect(onSubmit).toHaveBeenCalledWith({
          address: '0x0000000000000000000000000000000000000000',
          permissions: [AdminPermission.APPROVE_ANY_EVENT]
        })
      })
    })
  })
})

describe('when rendering AdminPermissionsModal in edit mode', () => {
  beforeEach(() => {
    render(
      <AdminPermissionsModal
        open
        mode="edit"
        initialUser="0xabcdef0123456789abcdef0123456789abcdef01"
        initialPermissions={[AdminPermission.EDIT_ANY_PROFILE]}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should NOT render the wallet input', () => {
    expect(screen.queryByLabelText('whats_on_admin.permissions_modal.wallet_label')).not.toBeInTheDocument()
  })

  it('should render the user address in the header', () => {
    expect(screen.getByText('0xabcdef0123456789abcdef0123456789abcdef01')).toBeInTheDocument()
  })

  it('should pre-check the Edit Users switch', () => {
    expect(screen.getByRole('switch', { name: 'whats_on_admin.permissions_modal.permissions.edit_any_profile.title' })).toBeChecked()
  })

  it('should leave the Approve Events switch unchecked', () => {
    expect(screen.getByRole('switch', { name: 'whats_on_admin.permissions_modal.permissions.approve_any_event.title' })).not.toBeChecked()
  })
})

describe('when the current user edits their own permissions', () => {
  const SELF_ADDRESS = '0xabcdef0123456789abcdef0123456789abcdef01'

  beforeEach(() => {
    const { useAuthIdentity } = jest.requireMock('../../../hooks/useAuthIdentity')
    useAuthIdentity.mockReturnValue({ address: SELF_ADDRESS, identity: undefined, hasValidIdentity: true })
    render(
      <AdminPermissionsModal
        open
        mode="edit"
        initialUser={SELF_ADDRESS}
        initialPermissions={[AdminPermission.EDIT_ANY_PROFILE]}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should disable the Edit Users switch', () => {
    expect(screen.getByRole('switch', { name: 'whats_on_admin.permissions_modal.permissions.edit_any_profile.title' })).toBeDisabled()
  })

  it('should show the self-edit locked description', () => {
    expect(screen.getByText('whats_on_admin.permissions_modal.self_edit_locked')).toBeInTheDocument()
  })

  it('should leave other switches enabled', () => {
    expect(screen.getByRole('switch', { name: 'whats_on_admin.permissions_modal.permissions.approve_any_event.title' })).toBeEnabled()
  })
})
