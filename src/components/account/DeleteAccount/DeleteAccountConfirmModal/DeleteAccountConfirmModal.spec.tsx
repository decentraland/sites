import type { ReactNode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DeleteAccountConfirmModal } from './DeleteAccountConfirmModal'

type ChildrenProps = { children?: ReactNode; 'data-role'?: string; open?: boolean }
type ButtonProps = ChildrenProps & { onClick?: () => void; disabled?: boolean }
type InputProps = {
  value?: string
  onChange?: (event: { target: { value: string } }) => void
  disabled?: boolean
  inputProps?: { 'data-role'?: string }
}

jest.mock('@mui/icons-material/Close', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/WarningRounded', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('./DeleteAccountConfirmModal.styled', () => ({
  StyledDialog: ({ children, open, 'data-role': dataRole }: ChildrenProps) => (open ? <div data-role={dataRole}>{children}</div> : null),
  StyledDialogContent: ({ children }: ChildrenProps) => <div>{children}</div>,
  CloseIconButton: ({ children, onClick, disabled, 'data-role': dataRole }: ButtonProps) => (
    <button type="button" data-role={dataRole} onClick={onClick} disabled={disabled} aria-label="Close">
      {children}
    </button>
  ),
  WarningIconContainer: ({ children }: ChildrenProps) => <div>{children}</div>,
  WarningIconCircle: ({ children }: ChildrenProps) => <div>{children}</div>,
  WarningTitle: ({ children }: ChildrenProps) => <div>{children}</div>,
  ModalDescription: ({ children }: ChildrenProps) => <div>{children}</div>,
  ErrorMessage: ({ children, 'data-role': dataRole }: ChildrenProps) => <div data-role={dataRole}>{children}</div>,
  ConfirmationInput: ({ value, onChange, disabled, inputProps }: InputProps) => (
    <input
      data-role={inputProps?.['data-role']}
      value={value}
      disabled={disabled}
      onChange={event => onChange?.({ target: { value: event.target.value } })}
    />
  ),
  ButtonContainer: ({ children }: ChildrenProps) => <div>{children}</div>,
  CancelButton: ({ children, onClick, disabled }: ButtonProps) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  ConfirmDeleteButton: ({ children, onClick, disabled, 'data-role': dataRole }: ButtonProps) => (
    <button type="button" data-role={dataRole} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}))

const mockGetProfiles = jest.fn()
const mockUnlinkProfile = jest.fn()
jest.mock('thirdweb/wallets/in-app', () => ({
  getProfiles: (...args: unknown[]) => mockGetProfiles(...args),
  unlinkProfile: (...args: unknown[]) => mockUnlinkProfile(...args)
}))

jest.mock('../../../../lib/thirdweb', () => ({
  getThirdwebClient: () => ({ __mockClient: true })
}))

const mockClearIdentity = jest.fn()
jest.mock('@dcl/single-sign-on-client', () => ({
  localStorageClearIdentity: (...args: unknown[]) => mockClearIdentity(...args)
}))

const mockGetEnv = jest.fn((key: string) => (key === 'AUTH_URL' ? 'https://decentraland.org/auth' : undefined))
jest.mock('../../../../config/env', () => ({
  getEnv: (key: string) => mockGetEnv(key)
}))

const mockDisconnect = jest.fn()
jest.mock('../../../../hooks/useWalletAddress', () => ({
  useWalletAddress: () => ({ disconnect: mockDisconnect })
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

const ADDRESS = '0x1234567890123456789012345678901234567890'

describe('DeleteAccountConfirmModal', () => {
  const originalLocation = window.location
  let replaceMock: jest.Mock
  let onClose: jest.Mock

  beforeEach(() => {
    replaceMock = jest.fn()
    onClose = jest.fn()
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, pathname: '/account/delete', replace: replaceMock }
    })
    // resetAllMocks() in afterEach clears implementations, so re-seed getEnv each run.
    mockGetEnv.mockImplementation((key: string) => (key === 'AUTH_URL' ? 'https://decentraland.org/auth' : undefined))
    mockGetProfiles.mockResolvedValue([{ type: 'email' }, { type: 'google' }])
    mockUnlinkProfile.mockResolvedValue(undefined)
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
    jest.resetAllMocks()
  })

  const renderModal = (address: string | undefined = ADDRESS) =>
    render(<DeleteAccountConfirmModal open address={address} onClose={onClose} />)

  it('should not render its content when closed', () => {
    render(<DeleteAccountConfirmModal open={false} address={ADDRESS} onClose={onClose} />)

    expect(screen.queryByRole('button', { name: 'account.delete.modal.delete' })).not.toBeInTheDocument()
  })

  it('should keep the confirm button disabled until the user types DELETE', () => {
    renderModal()

    const confirmButton = screen.getByRole('button', { name: 'account.delete.modal.delete' })
    expect(confirmButton).toBeDisabled()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'delete' } })
    expect(confirmButton).toBeDisabled()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'DELETE' } })
    expect(confirmButton).toBeEnabled()
  })

  it('should unlink every profile and redirect to login when confirmed', async () => {
    renderModal()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'DELETE' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'account.delete.modal.delete' }))
    })

    await waitFor(() => expect(replaceMock).toHaveBeenCalledTimes(1))

    expect(mockGetProfiles).toHaveBeenCalledTimes(1)
    expect(mockUnlinkProfile).toHaveBeenCalledTimes(2)
    // The last profile must be unlinked with allowAccountDeletion: true.
    expect(mockUnlinkProfile).toHaveBeenLastCalledWith(expect.objectContaining({ allowAccountDeletion: true }))
    expect(mockClearIdentity).toHaveBeenCalledWith(ADDRESS)
    expect(mockDisconnect).toHaveBeenCalledTimes(1)
    expect(replaceMock).toHaveBeenCalledWith('https://decentraland.org/auth/login?redirectTo=%2Faccount%2Fdelete')
  })

  it('should surface a generic error and not redirect when deletion fails', async () => {
    mockUnlinkProfile.mockRejectedValueOnce(new Error('boom'))
    renderModal()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'DELETE' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'account.delete.modal.delete' }))
    })

    await waitFor(() => expect(screen.getByRole('button', { name: 'account.delete.modal.delete' })).toBeEnabled())
    expect(screen.getByText('account.delete.modal.generic_error')).toBeInTheDocument()
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('should close without deleting when the cancel button is clicked', () => {
    renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'account.delete.modal.cancel' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(mockGetProfiles).not.toHaveBeenCalled()
  })
})
