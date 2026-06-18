import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { UserCreditsStatus } from '../../features/account-credits/account-credits.types'
import { CreditsPage } from './CreditsPage'

type ChildrenProps = { children?: ReactNode }

jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: ChildrenProps) => <>{children}</>
}))

jest.mock('./CreditsPage.styled', () => ({
  CreditsPanel: ({ children }: ChildrenProps) => <div>{children}</div>
}))

type StatusCardProps = { status?: string; isLoading: boolean; onJoin: () => void; onLeave: () => void }
jest.mock('../../components/account/Credits/CreditsStatusCard/CreditsStatusCard', () => ({
  CreditsStatusCard: ({ status, isLoading, onJoin, onLeave }: StatusCardProps) => (
    <div data-testid="status-card" data-status={status ?? ''} data-loading={String(isLoading)}>
      <button type="button" onClick={onJoin}>
        join
      </button>
      <button type="button" onClick={onLeave}>
        leave
      </button>
    </div>
  )
}))

type ModalProps = { open: boolean; isLeaving: boolean; errorKey: string | null; onConfirm: () => void; onClose: () => void }
jest.mock('../../components/account/Credits/OptOutConfirmModal/OptOutConfirmModal', () => ({
  OptOutConfirmModal: ({ open, errorKey, onConfirm, onClose }: ModalProps) =>
    open ? (
      <div data-testid="opt-out-modal" data-error={errorKey ?? ''}>
        <button type="button" onClick={onConfirm}>
          confirm
        </button>
        <button type="button" onClick={onClose}>
          close
        </button>
      </div>
    ) : null
}))

jest.mock('../../components/account/Credits/credits.errors', () => ({
  mapOptOutErrorToI18nKey: () => 'account.credits.leave_modal.errors.generic',
  mapJoinErrorToI18nKey: () => 'account.credits.join_errors.generic'
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

const mockUseGetUserCreditsStatusQuery = jest.fn()
const mockOptOut = jest.fn()
const mockRegister = jest.fn()
jest.mock('../../features/account-credits', () => ({
  useGetUserCreditsStatusQuery: (...args: unknown[]) => mockUseGetUserCreditsStatusQuery(...args),
  useOptOutFromCreditsMutation: () => [mockOptOut, { isLoading: false }],
  useRegisterForCreditsMutation: () => [mockRegister, { isLoading: false }]
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ address: '0x1234567890123456789012345678901234567890' })
}))

describe('CreditsPage', () => {
  beforeEach(() => {
    mockUseGetUserCreditsStatusQuery.mockReturnValue({ data: { status: UserCreditsStatus.ENROLLED, optedOutAt: null }, isLoading: false })
    mockOptOut.mockReturnValue({ unwrap: () => Promise.resolve(undefined) })
    mockRegister.mockReturnValue({ unwrap: () => Promise.resolve(undefined) })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should pass the fetched status down to the status card', () => {
    render(<CreditsPage />)

    expect(screen.getByTestId('status-card')).toHaveAttribute('data-status', UserCreditsStatus.ENROLLED)
  })

  it('should register via the credits API when Join is clicked', async () => {
    mockUseGetUserCreditsStatusQuery.mockReturnValue({
      data: { status: UserCreditsStatus.NOT_REGISTERED, optedOutAt: null },
      isLoading: false
    })
    render(<CreditsPage />)

    fireEvent.click(screen.getByText('join'))

    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890'))
  })

  it('should not show the confirm modal until Leave is clicked', () => {
    render(<CreditsPage />)

    expect(screen.queryByTestId('opt-out-modal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('leave'))
    expect(screen.getByTestId('opt-out-modal')).toBeInTheDocument()
  })

  it('should opt out and close the modal on confirm success', async () => {
    render(<CreditsPage />)
    fireEvent.click(screen.getByText('leave'))

    fireEvent.click(screen.getByText('confirm'))

    await waitFor(() => expect(mockOptOut).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890'))
    await waitFor(() => expect(screen.queryByTestId('opt-out-modal')).not.toBeInTheDocument())
  })

  it('should surface a mapped error and keep the modal open on confirm failure', async () => {
    mockOptOut.mockReturnValue({ unwrap: () => Promise.reject({ status: 400 }) })
    render(<CreditsPage />)
    fireEvent.click(screen.getByText('leave'))

    fireEvent.click(screen.getByText('confirm'))

    await waitFor(() =>
      expect(screen.getByTestId('opt-out-modal')).toHaveAttribute('data-error', 'account.credits.leave_modal.errors.generic')
    )
  })
})
