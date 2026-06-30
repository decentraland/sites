import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { DeleteAccountPage } from './DeleteAccountPage'

type ChildrenProps = { children?: ReactNode }

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: ChildrenProps) => <>{children}</>
}))

jest.mock('./DeleteAccountPage.styled', () => ({
  PageRoot: ({ children }: ChildrenProps) => <div>{children}</div>,
  LoadingState: ({ children, 'data-role': dataRole }: ChildrenProps & { 'data-role'?: string }) => (
    <div data-role={dataRole}>{children}</div>
  )
}))

jest.mock('decentraland-ui2', () => ({
  CircularProgress: () => <span data-role="spinner" />
}))

const ADDRESS = '0x1234567890123456789012345678901234567890'
jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ address: ADDRESS })
}))

let mockCanDelete = true
let mockIsMagic = false
let mockIsResolvingProvider = false
jest.mock('../../hooks/useCanDeleteAccount', () => ({
  useCanDeleteAccount: () => ({
    canDelete: mockCanDelete,
    isMagic: mockIsMagic,
    isResolvingProvider: mockIsResolvingProvider
  })
}))

jest.mock('../../components/account/DeleteAccount/DeleteAccountUnavailable/DeleteAccountUnavailable', () => ({
  DeleteAccountUnavailable: () => <div data-role="unavailable" />
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

type SectionProps = { address?: string; onOpenConfirmModal: () => void; onGoToWallets: () => void }
jest.mock('../../components/account/DeleteAccount/DeleteAccountSection/DeleteAccountSection', () => ({
  DeleteAccountSection: ({ address, onOpenConfirmModal, onGoToWallets }: SectionProps) => (
    <div data-role="section">
      <span>{`section-address:${address ?? 'none'}`}</span>
      <button type="button" onClick={onOpenConfirmModal}>
        open-modal
      </button>
      <button type="button" onClick={onGoToWallets}>
        go-to-wallets
      </button>
    </div>
  )
}))

type ModalProps = { open: boolean; address?: string; onClose: () => void }
jest.mock('../../components/account/DeleteAccount/DeleteAccountConfirmModal/DeleteAccountConfirmModal', () => ({
  DeleteAccountConfirmModal: ({ open, address, onClose }: ModalProps) =>
    open ? (
      <div data-role="modal">
        <span>{`modal-address:${address ?? 'none'}`}</span>
        <button type="button" onClick={onClose}>
          close-modal
        </button>
      </div>
    ) : null
}))

describe('DeleteAccountPage', () => {
  beforeEach(() => {
    mockCanDelete = true
    mockIsMagic = false
    mockIsResolvingProvider = false
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should show the unavailable message (not the danger zone) for an account that cannot be deleted', () => {
    mockCanDelete = false
    const { container } = render(<DeleteAccountPage />)

    expect(container.querySelector('[data-role="unavailable"]')).toBeTruthy()
    expect(screen.queryByText(`section-address:${ADDRESS}`)).not.toBeInTheDocument()
  })

  it('should show the danger zone (not the unavailable message) for a Magic account', () => {
    mockCanDelete = true
    mockIsMagic = true
    render(<DeleteAccountPage />)

    expect(screen.getByText(`section-address:${ADDRESS}`)).toBeInTheDocument()
  })

  it('should show a loading indicator (not the unavailable message) while provider detection resolves', () => {
    mockCanDelete = false
    mockIsResolvingProvider = true
    const { container } = render(<DeleteAccountPage />)

    expect(container.querySelector('[data-role="delete-account-loading"]')).toBeTruthy()
    expect(container.querySelector('[data-role="unavailable"]')).toBeNull()
    expect(screen.queryByText(`section-address:${ADDRESS}`)).not.toBeInTheDocument()
  })

  it('should render the section with the authenticated address and the modal closed by default', () => {
    render(<DeleteAccountPage />)

    expect(screen.getByText(`section-address:${ADDRESS}`)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'close-modal' })).not.toBeInTheDocument()
  })

  it('should open the confirm modal when the section requests it', () => {
    render(<DeleteAccountPage />)

    fireEvent.click(screen.getByRole('button', { name: 'open-modal' }))

    expect(screen.getByText(`modal-address:${ADDRESS}`)).toBeInTheDocument()
  })

  it('should navigate to the wallets section when requested', () => {
    render(<DeleteAccountPage />)

    fireEvent.click(screen.getByRole('button', { name: 'go-to-wallets' }))

    expect(mockNavigate).toHaveBeenCalledWith('/account/wallets')
  })

  it('should close the modal when onClose fires', () => {
    render(<DeleteAccountPage />)

    fireEvent.click(screen.getByRole('button', { name: 'open-modal' }))
    fireEvent.click(screen.getByRole('button', { name: 'close-modal' }))

    expect(screen.queryByRole('button', { name: 'close-modal' })).not.toBeInTheDocument()
  })
})
