import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { WithdrawManaContent } from './WithdrawManaContent'

const mockConnect = jest.fn()
const mockSwitchChain = jest.fn()
const mockWriteContractAsync = jest.fn()
const mockWaitForTransactionReceipt = jest.fn()
const mockAddTransaction = jest.fn()

let mockWalletReturn: { isConnected: boolean; connect: jest.Mock; connectors: Array<{ uid: string; name: string }> }
let mockAccountReturn: { address?: string; chainId?: number }

jest.mock('@dcl/core-web3', () => ({
  useWallet: () => mockWalletReturn
}))

jest.mock('wagmi', () => ({
  useAccount: () => mockAccountReturn,
  useSwitchChain: () => ({ switchChain: mockSwitchChain, isPending: false }),
  useWriteContract: () => ({ writeContractAsync: mockWriteContractAsync }),
  usePublicClient: () => ({ waitForTransactionReceipt: mockWaitForTransactionReceipt })
}))

jest.mock('viem', () => ({
  parseEther: (value: string) => BigInt(Math.round(Number(value) * 1e6)) * BigInt(1e12)
}))

jest.mock('../bridgeContract', () => ({
  MANA_CHILD_WITHDRAW_ABI: ['withdrawAbi']
}))

jest.mock('../manaContract', () => ({
  getManaAddress: () => '0xMANA_L2',
  getNetworkChainId: () => 137
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../../../hooks/useWalletTransactions', () => ({
  useWalletTransactions: () => ({ addTransaction: mockAddTransaction })
}))

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick, disabled }: { children?: ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  TextField: ({ value, onChange }: { value?: string; onChange?: (event: { target: { value: string } }) => void }) => (
    <input role="spinbutton" value={value} onChange={onChange} />
  )
}))

jest.mock('../SendManaModal/SendManaModal.styled', () => ({
  Body: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Centered: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  ConnectList: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Description: ({ children }: { children?: ReactNode }) => <p>{children}</p>,
  StateText: ({ children }: { children?: ReactNode }) => <span>{children}</span>
}))

describe('WithdrawManaContent', () => {
  beforeEach(() => {
    mockWalletReturn = { isConnected: true, connect: mockConnect, connectors: [] }
    mockAccountReturn = { address: '0xUSER', chainId: 137 }
    mockWriteContractAsync.mockResolvedValue('0xburnhash')
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success', blockNumber: 999n })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the wallet is not connected', () => {
    it('should list connectors and connect on click', () => {
      mockWalletReturn = { isConnected: false, connect: mockConnect, connectors: [{ uid: 'c1', name: 'MetaMask' }] }

      render(<WithdrawManaContent balance={100} address="0xUSER" onClose={jest.fn()} />)
      fireEvent.click(screen.getByText('MetaMask'))

      expect(mockConnect).toHaveBeenCalledWith({ uid: 'c1', name: 'MetaMask' })
    })
  })

  describe('when connected to the wrong network', () => {
    it('should prompt switching to the Polygon (L2) chain', () => {
      mockAccountReturn = { address: '0xUSER', chainId: 1 }

      render(<WithdrawManaContent balance={100} address="0xUSER" onClose={jest.fn()} />)
      fireEvent.click(screen.getByText('account.wallets.withdraw.switch_button'))

      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 137 })
    })
  })

  describe('when connected on Polygon', () => {
    it('should burn MANA and track a bridging withdrawal keyed by the burn block', async () => {
      render(<WithdrawManaContent balance={100} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } })
      fireEvent.click(screen.getByText('account.wallets.withdraw.submit'))

      await waitFor(() => expect(screen.getByText('account.wallets.withdraw.success')).toBeInTheDocument())
      expect(mockWriteContractAsync).toHaveBeenCalledWith(expect.objectContaining({ functionName: 'withdraw' }))
      expect(mockAddTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ hash: '0xburnhash', type: 'withdraw', network: 'polygon', status: 'bridging' })
      )
    })

    it('should surface a rejection message without leaking the raw error', async () => {
      mockWriteContractAsync.mockRejectedValue(new Error('User rejected the request'))
      render(<WithdrawManaContent balance={100} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } })
      fireEvent.click(screen.getByText('account.wallets.withdraw.submit'))

      await waitFor(() => expect(screen.getByText('account.wallets.withdraw.rejected')).toBeInTheDocument())
      expect(mockAddTransaction).not.toHaveBeenCalled()
    })

    it('should error (not track) when the burn receipt reverts', async () => {
      mockWaitForTransactionReceipt.mockResolvedValue({ status: 'reverted', blockNumber: 1n })
      render(<WithdrawManaContent balance={100} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } })
      fireEvent.click(screen.getByText('account.wallets.withdraw.submit'))

      await waitFor(() => expect(screen.getByText('account.wallets.withdraw.error')).toBeInTheDocument())
      expect(mockAddTransaction).not.toHaveBeenCalled()
      expect(screen.queryByText('account.wallets.withdraw.success')).not.toBeInTheDocument()
    })

    it('should call onSuccess after a confirmed burn', async () => {
      const onSuccess = jest.fn()
      render(<WithdrawManaContent balance={100} address="0xUSER" onClose={jest.fn()} onSuccess={onSuccess} />)

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } })
      fireEvent.click(screen.getByText('account.wallets.withdraw.submit'))

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    })

    it('should disable the submit when the amount exceeds the balance', () => {
      render(<WithdrawManaContent balance={3} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } })

      expect(screen.getByText('account.wallets.withdraw.submit')).toBeDisabled()
    })
  })
})
