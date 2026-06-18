import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { WalletsPage } from './WalletsPage'

type ChildrenProps = { children?: ReactNode }

jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: ChildrenProps) => <>{children}</>
}))

jest.mock('./WalletsPage.styled', () => ({
  WalletsPanel: ({ children }: ChildrenProps) => <div>{children}</div>
}))

jest.mock('../../components/account/Wallets/BalanceCard/BalanceCard', () => ({
  BalanceCard: ({ network }: { network: string }) => <div data-testid={`balance-card-${network}`} />
}))

jest.mock('../../components/account/Wallets/ReceiveModal/ReceiveModal', () => ({
  ReceiveModal: ({ open }: { open: boolean }) => (open ? <div data-testid="receive-modal" /> : null)
}))

jest.mock('../../components/account/Wallets/SendManaModal/SendManaModal', () => ({
  SendManaModal: ({ open, network }: { open: boolean; network: string }) => (open ? <div data-testid="send-modal">{network}</div> : null)
}))

jest.mock('../../components/account/Wallets/SwapManaModal/SwapManaModal', () => ({
  SwapManaModal: ({ open }: { open: boolean }) => (open ? <div data-testid="swap-modal" /> : null)
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ address: '0x1234567890123456789012345678901234567890' })
}))

const mockFetchBalances = jest.fn()
jest.mock('../../hooks/useManaBalances', () => ({
  useManaBalances: () => ({ balances: { ethereum: 100595, polygon: 42 }, isLoading: false, fetchBalances: mockFetchBalances })
}))

jest.mock('../../hooks/useWalletTransactions', () => ({
  useWalletTransactions: () => ({ transactions: [], addTransaction: jest.fn(), updateTransactionStatus: jest.fn() })
}))

describe('WalletsPage', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render an Ethereum and a Polygon balance card', () => {
    render(<WalletsPage />)

    expect(screen.getByTestId('balance-card-ethereum')).toBeInTheDocument()
    expect(screen.getByTestId('balance-card-polygon')).toBeInTheDocument()
  })

  it('should request balances on mount', () => {
    render(<WalletsPage />)

    expect(mockFetchBalances).toHaveBeenCalled()
  })
})
