import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import type { WalletTransaction } from '../../../../hooks/useWalletTransactions.types'
import { ClaimWithdrawModal } from './ClaimWithdrawModal'

jest.mock('@mui/icons-material/CloseRounded', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('decentraland-ui2', () => ({
  CircularProgress: () => <span data-testid="spinner" />
}))

// The shell is exercised by its own smoke test; here it is a passthrough so the modal wiring is isolated.
jest.mock('../../../../shells/BlockchainShell', () => ({
  BlockchainShell: ({ children }: { children?: ReactNode }) => <div data-testid="blockchain-shell">{children}</div>
}))

jest.mock('./ClaimWithdrawContent', () => ({
  ClaimWithdrawContent: ({ withdrawal }: { withdrawal: WalletTransaction }) => <div data-testid="claim-content">{withdrawal.amount}</div>
}))

jest.mock('../SendManaModal/SendManaModal.styled', () => ({
  StyledDialog: ({ open, children }: { open: boolean; children?: ReactNode }) => (open ? <div>{children}</div> : null),
  Header: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Title: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
  CloseButton: ({ children }: { children?: ReactNode }) => <button type="button">{children}</button>,
  Centered: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  StateText: ({ children }: { children?: ReactNode }) => <span>{children}</span>
}))

const withdrawal: WalletTransaction = {
  hash: '0xburn',
  type: 'withdraw',
  network: 'polygon',
  amount: 42,
  timestamp: 1,
  status: 'checkpoint'
}

describe('ClaimWithdrawModal', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should stay closed (no shell) when there is no withdrawal to claim', () => {
    render(<ClaimWithdrawModal withdrawal={null} address="0xabc" onClose={jest.fn()} />)

    expect(screen.queryByTestId('blockchain-shell')).not.toBeInTheDocument()
    expect(screen.queryByTestId('claim-content')).not.toBeInTheDocument()
  })

  it('should mount the shell and the claim content for the given withdrawal', () => {
    render(<ClaimWithdrawModal withdrawal={withdrawal} address="0xabc" onClose={jest.fn()} />)

    expect(screen.getByTestId('blockchain-shell')).toBeInTheDocument()
    expect(screen.getByTestId('claim-content')).toHaveTextContent('42')
  })
})
