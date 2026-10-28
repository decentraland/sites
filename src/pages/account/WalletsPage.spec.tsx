import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import type { WalletNetwork } from '../../components/account/Wallets/manaContract'
import type { WalletTransaction } from '../../hooks/useWalletTransactions.types'
import { WalletsPage } from './WalletsPage'

type ChildrenProps = { children?: ReactNode; 'data-role'?: string }

type BalanceCardProps = {
  network: WalletNetwork
  balance?: number
  isLoading: boolean
  transactions: WalletTransaction[]
  onReceive: () => void
  onSend: () => void
  onSwap: () => void
  onBuy: () => void
  onClaim: (withdrawal: WalletTransaction) => void
}

type ReceiveModalProps = { open: boolean; address: string; onClose: () => void }
type SendModalProps = { open: boolean; network: string; balance?: number; address?: string; onClose: () => void; onSuccess: () => void }
type SwapModalProps = { open: boolean; balance?: number; onClose: () => void; onSuccess: () => void }
type WithdrawModalProps = { open: boolean; balance?: number; onClose: () => void; onSuccess: () => void }
type ClaimModalProps = { withdrawal: WalletTransaction | null; onClose: () => void; onSuccess: () => void }
type BuyModalProps = { open: boolean; network: string; onClose: () => void }

const claimableWithdrawal: WalletTransaction = {
  hash: '0xwithdrawhash',
  type: 'withdraw',
  network: 'polygon',
  amount: 5,
  timestamp: 1700000000,
  status: 'checkpoint'
}

jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: ChildrenProps) => <>{children}</>
}))

jest.mock('./WalletsPage.styled', () => ({
  WalletsPanel: ({ children, 'data-role': dataRole }: ChildrenProps) => <div data-role={dataRole}>{children}</div>
}))

jest.mock('../../components/account/Wallets/BalanceCard/BalanceCard', () => ({
  BalanceCard: ({ network, balance, isLoading, transactions, onReceive, onSend, onSwap, onBuy, onClaim }: BalanceCardProps) => (
    <div
      data-testid={`balance-card-${network}`}
      data-balance={String(balance)}
      data-loading={String(isLoading)}
      data-tx-count={transactions.length}
    >
      <button type="button" onClick={onReceive}>{`receive-${network}`}</button>
      <button type="button" onClick={onSend}>{`send-${network}`}</button>
      <button type="button" onClick={onSwap}>{`swap-${network}`}</button>
      <button type="button" onClick={onBuy}>{`buy-${network}`}</button>
      <button type="button" onClick={() => onClaim(claimableWithdrawal)}>{`claim-${network}`}</button>
    </div>
  )
}))

jest.mock('../../components/account/Wallets/ReceiveModal/ReceiveModal', () => ({
  ReceiveModal: ({ open, address, onClose }: ReceiveModalProps) =>
    open ? (
      <div data-testid="receive-modal" data-address={address}>
        <button type="button" onClick={onClose}>
          receive-close
        </button>
      </div>
    ) : null
}))

jest.mock('../../components/account/Wallets/SendManaModal/SendManaModal', () => ({
  SendManaModal: ({ open, network, balance, address, onClose, onSuccess }: SendModalProps) =>
    open ? (
      <div data-testid="send-modal" data-network={network} data-balance={String(balance)} data-address={String(address)}>
        <button type="button" onClick={onClose}>
          send-close
        </button>
        <button type="button" onClick={onSuccess}>
          send-success
        </button>
      </div>
    ) : null
}))

jest.mock('../../components/account/Wallets/SwapManaModal/SwapManaModal', () => ({
  SwapManaModal: ({ open, balance, onClose, onSuccess }: SwapModalProps) =>
    open ? (
      <div data-testid="swap-modal" data-balance={String(balance)}>
        <button type="button" onClick={onClose}>
          swap-close
        </button>
        <button type="button" onClick={onSuccess}>
          swap-success
        </button>
      </div>
    ) : null
}))

jest.mock('../../components/account/Wallets/WithdrawManaModal/WithdrawManaModal', () => ({
  WithdrawManaModal: ({ open, balance, onClose, onSuccess }: WithdrawModalProps) =>
    open ? (
      <div data-testid="withdraw-modal" data-balance={String(balance)}>
        <button type="button" onClick={onClose}>
          withdraw-close
        </button>
        <button type="button" onClick={onSuccess}>
          withdraw-success
        </button>
      </div>
    ) : null
}))

jest.mock('../../components/account/Wallets/ClaimWithdrawModal/ClaimWithdrawModal', () => ({
  ClaimWithdrawModal: ({ withdrawal, onClose, onSuccess }: ClaimModalProps) =>
    withdrawal ? (
      <div data-testid="claim-modal" data-hash={withdrawal.hash}>
        <button type="button" onClick={onClose}>
          claim-close
        </button>
        <button type="button" onClick={onSuccess}>
          claim-success
        </button>
      </div>
    ) : null
}))

jest.mock('../../components/account/Wallets/BuyManaModal/BuyManaModal', () => ({
  BuyManaModal: ({ open, network, onClose }: BuyModalProps) =>
    open ? (
      <div data-testid="buy-modal" data-network={network}>
        <button type="button" onClick={onClose}>
          buy-close
        </button>
      </div>
    ) : null
}))

const mockUseBridgeWithdrawals = jest.fn()
jest.mock('../../hooks/useBridgeWithdrawals', () => ({
  useBridgeWithdrawals: (...args: unknown[]) => mockUseBridgeWithdrawals(...args)
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

let mockAddress: string | null = '0x1234567890123456789012345678901234567890'
jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ address: mockAddress })
}))

const mockFetchBalances = jest.fn()
const mockUseManaBalancesArgs = jest.fn()
let mockBalances: { ethereum?: number; polygon?: number } | undefined = { ethereum: 100595, polygon: 42 }
let mockIsLoading = false
jest.mock('../../hooks/useManaBalances', () => ({
  useManaBalances: (...args: unknown[]) => {
    mockUseManaBalancesArgs(...args)
    return { balances: mockBalances, isLoading: mockIsLoading, fetchBalances: mockFetchBalances }
  }
}))

let mockTransactions: WalletTransaction[] = []
jest.mock('../../hooks/useWalletHistory', () => ({
  useWalletHistory: () => ({ transactions: mockTransactions, isLoading: false, isError: false })
}))

const ethereumTx: WalletTransaction = {
  hash: '0xethsend',
  type: 'send',
  network: 'ethereum',
  amount: 10,
  timestamp: 1700000001,
  status: 'confirmed'
}
const polygonTx: WalletTransaction = {
  hash: '0xpolygonreceived',
  type: 'received',
  network: 'polygon',
  amount: 20,
  timestamp: 1700000002,
  status: 'confirmed'
}

describe('WalletsPage', () => {
  beforeEach(() => {
    mockAddress = '0x1234567890123456789012345678901234567890'
    mockBalances = { ethereum: 100595, polygon: 42 }
    mockIsLoading = false
    mockTransactions = [ethereumTx, polygonTx]
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the page mounts', () => {
    it('should render an Ethereum and a Polygon balance card', () => {
      render(<WalletsPage />)

      expect(screen.getByTestId('balance-card-ethereum')).toBeInTheDocument()
      expect(screen.getByTestId('balance-card-polygon')).toBeInTheDocument()
    })

    it('should request balances once', () => {
      render(<WalletsPage />)

      expect(mockFetchBalances).toHaveBeenCalledTimes(1)
      expect(mockFetchBalances).toHaveBeenCalledWith()
    })

    it('should poll bridge withdrawals for the connected address', () => {
      render(<WalletsPage />)

      expect(mockUseBridgeWithdrawals).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890')
    })

    it('should pass each network its balance and loading state', () => {
      mockIsLoading = true
      render(<WalletsPage />)

      const ethereumCard = screen.getByTestId('balance-card-ethereum')
      const polygonCard = screen.getByTestId('balance-card-polygon')
      expect(ethereumCard).toHaveAttribute('data-balance', '100595')
      expect(ethereumCard).toHaveAttribute('data-loading', 'true')
      expect(polygonCard).toHaveAttribute('data-balance', '42')
    })

    it('should split transactions by network across the two cards', () => {
      render(<WalletsPage />)

      expect(screen.getByTestId('balance-card-ethereum')).toHaveAttribute('data-tx-count', '1')
      expect(screen.getByTestId('balance-card-polygon')).toHaveAttribute('data-tx-count', '1')
    })

    it('should keep every modal closed initially', () => {
      render(<WalletsPage />)

      expect(screen.queryByTestId('receive-modal')).not.toBeInTheDocument()
      expect(screen.queryByTestId('send-modal')).not.toBeInTheDocument()
      expect(screen.queryByTestId('swap-modal')).not.toBeInTheDocument()
      expect(screen.queryByTestId('withdraw-modal')).not.toBeInTheDocument()
      expect(screen.queryByTestId('claim-modal')).not.toBeInTheDocument()
      expect(screen.queryByTestId('buy-modal')).not.toBeInTheDocument()
    })
  })

  describe('when there is no connected address', () => {
    beforeEach(() => {
      mockAddress = null
    })

    it('should not render the receive modal', () => {
      render(<WalletsPage />)

      fireEvent.click(screen.getByText('receive-ethereum'))
      expect(screen.queryByTestId('receive-modal')).not.toBeInTheDocument()
    })

    it('should still request balances and poll withdrawals with undefined', () => {
      render(<WalletsPage />)

      expect(mockFetchBalances).toHaveBeenCalled()
      expect(mockUseBridgeWithdrawals).toHaveBeenCalledWith(undefined)
      expect(mockUseManaBalancesArgs).toHaveBeenCalledWith(undefined)
    })
  })

  describe('when the receive action is triggered', () => {
    it('should open the receive modal with the connected address', () => {
      render(<WalletsPage />)

      fireEvent.click(screen.getByText('receive-polygon'))

      const modal = screen.getByTestId('receive-modal')
      expect(modal).toBeInTheDocument()
      expect(modal).toHaveAttribute('data-address', '0x1234567890123456789012345678901234567890')
    })

    it('should close the receive modal and reset state', () => {
      render(<WalletsPage />)
      fireEvent.click(screen.getByText('receive-ethereum'))
      expect(screen.getByTestId('receive-modal')).toBeInTheDocument()

      fireEvent.click(screen.getByText('receive-close'))

      expect(screen.queryByTestId('receive-modal')).not.toBeInTheDocument()
    })
  })

  describe('when the send action is triggered', () => {
    it('should open the send modal with the ethereum network and its balance', () => {
      render(<WalletsPage />)

      fireEvent.click(screen.getByText('send-ethereum'))

      const modal = screen.getByTestId('send-modal')
      expect(modal).toHaveAttribute('data-network', 'ethereum')
      expect(modal).toHaveAttribute('data-balance', '100595')
    })

    it('should open the send modal with the polygon network and its balance', () => {
      render(<WalletsPage />)

      fireEvent.click(screen.getByText('send-polygon'))

      const modal = screen.getByTestId('send-modal')
      expect(modal).toHaveAttribute('data-network', 'polygon')
      expect(modal).toHaveAttribute('data-balance', '42')
      expect(modal).toHaveAttribute('data-address', '0x1234567890123456789012345678901234567890')
    })

    it('should refresh balances when the send succeeds', () => {
      render(<WalletsPage />)
      fireEvent.click(screen.getByText('send-ethereum'))

      fireEvent.click(screen.getByText('send-success'))

      expect(mockFetchBalances).toHaveBeenCalledWith(true)
    })

    it('should close the send modal and reset the network', () => {
      render(<WalletsPage />)
      fireEvent.click(screen.getByText('send-ethereum'))

      fireEvent.click(screen.getByText('send-close'))

      expect(screen.queryByTestId('send-modal')).not.toBeInTheDocument()
    })
  })

  describe('when the swap action is triggered', () => {
    it('should open the swap modal only for ethereum', () => {
      render(<WalletsPage />)

      fireEvent.click(screen.getByText('swap-ethereum'))

      const modal = screen.getByTestId('swap-modal')
      expect(modal).toBeInTheDocument()
      expect(modal).toHaveAttribute('data-balance', '100595')
      expect(screen.queryByTestId('withdraw-modal')).not.toBeInTheDocument()
    })

    it('should open the withdraw modal only for polygon', () => {
      render(<WalletsPage />)

      fireEvent.click(screen.getByText('swap-polygon'))

      const modal = screen.getByTestId('withdraw-modal')
      expect(modal).toBeInTheDocument()
      expect(modal).toHaveAttribute('data-balance', '42')
      expect(screen.queryByTestId('swap-modal')).not.toBeInTheDocument()
    })

    it('should refresh balances when the swap succeeds', () => {
      render(<WalletsPage />)
      fireEvent.click(screen.getByText('swap-ethereum'))

      fireEvent.click(screen.getByText('swap-success'))

      expect(mockFetchBalances).toHaveBeenCalledWith(true)
    })

    it('should refresh balances when the withdraw succeeds', () => {
      render(<WalletsPage />)
      fireEvent.click(screen.getByText('swap-polygon'))

      fireEvent.click(screen.getByText('withdraw-success'))

      expect(mockFetchBalances).toHaveBeenCalledWith(true)
    })

    it('should close the swap modal and reset the network', () => {
      render(<WalletsPage />)
      fireEvent.click(screen.getByText('swap-ethereum'))

      fireEvent.click(screen.getByText('swap-close'))

      expect(screen.queryByTestId('swap-modal')).not.toBeInTheDocument()
    })

    it('should close the withdraw modal and reset the network', () => {
      render(<WalletsPage />)
      fireEvent.click(screen.getByText('swap-polygon'))

      fireEvent.click(screen.getByText('withdraw-close'))

      expect(screen.queryByTestId('withdraw-modal')).not.toBeInTheDocument()
    })
  })

  describe('when the buy action is triggered', () => {
    it('should open the buy modal with the ethereum network', () => {
      render(<WalletsPage />)

      fireEvent.click(screen.getByText('buy-ethereum'))

      expect(screen.getByTestId('buy-modal')).toHaveAttribute('data-network', 'ethereum')
    })

    it('should open the buy modal with the polygon network', () => {
      render(<WalletsPage />)

      fireEvent.click(screen.getByText('buy-polygon'))

      expect(screen.getByTestId('buy-modal')).toHaveAttribute('data-network', 'polygon')
    })

    it('should close the buy modal and reset the network', () => {
      render(<WalletsPage />)
      fireEvent.click(screen.getByText('buy-polygon'))

      fireEvent.click(screen.getByText('buy-close'))

      expect(screen.queryByTestId('buy-modal')).not.toBeInTheDocument()
    })
  })

  describe('when the claim action is triggered', () => {
    it('should open the claim modal with the selected withdrawal', () => {
      render(<WalletsPage />)

      fireEvent.click(screen.getByText('claim-polygon'))

      expect(screen.getByTestId('claim-modal')).toHaveAttribute('data-hash', '0xwithdrawhash')
    })

    it('should refresh balances when the claim succeeds', () => {
      render(<WalletsPage />)
      fireEvent.click(screen.getByText('claim-polygon'))

      fireEvent.click(screen.getByText('claim-success'))

      expect(mockFetchBalances).toHaveBeenCalledWith(true)
    })

    it('should close the claim modal and reset the withdrawal', () => {
      render(<WalletsPage />)
      fireEvent.click(screen.getByText('claim-ethereum'))

      fireEvent.click(screen.getByText('claim-close'))

      expect(screen.queryByTestId('claim-modal')).not.toBeInTheDocument()
    })
  })

  describe('when balances are not yet loaded', () => {
    beforeEach(() => {
      mockBalances = undefined
    })

    it('should open the send modal with an undefined balance', () => {
      render(<WalletsPage />)

      fireEvent.click(screen.getByText('send-ethereum'))

      expect(screen.getByTestId('send-modal')).toHaveAttribute('data-balance', 'undefined')
    })
  })
})
