import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { WalletTransaction } from '../../../../hooks/useWalletTransactions.types'
import { ClaimWithdrawContent } from './ClaimWithdrawContent'

const mockConnect = jest.fn()
const mockSwitchChain = jest.fn()
const mockWriteContractAsync = jest.fn()
const mockWaitForTransactionReceipt = jest.fn()
const mockUpdateTransaction = jest.fn()
const mockFetchExitPayload = jest.fn()

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

jest.mock('../bridgeContract', () => ({
  ROOT_CHAIN_MANAGER_ABI: ['rootChainAbi'],
  getL1ChainId: () => 1,
  getRootChainManagerAddress: () => '0xROOTCHAIN'
}))

jest.mock('../bridgeProof', () => ({
  fetchExitPayload: (hash: string) => mockFetchExitPayload(hash)
}))

jest.mock('../wallets.helpers', () => ({
  formatMana: (value: number) => `formatted-${value}`
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../../../hooks/useWalletTransactions', () => ({
  useWalletTransactions: () => ({ updateTransaction: mockUpdateTransaction })
}))

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick, disabled }: { children?: ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}))

jest.mock('../SendManaModal/SendManaModal.styled', () => ({
  Body: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Centered: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  ConnectList: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Description: ({ children }: { children?: ReactNode }) => <p>{children}</p>,
  StateText: ({ children }: { children?: ReactNode }) => <span>{children}</span>
}))

const withdrawal: WalletTransaction = {
  hash: '0xburn',
  type: 'withdraw',
  network: 'polygon',
  amount: 50,
  timestamp: 1718000000000,
  status: 'checkpoint'
}

describe('ClaimWithdrawContent', () => {
  beforeEach(() => {
    mockWalletReturn = { isConnected: true, connect: mockConnect, connectors: [] }
    mockAccountReturn = { address: '0xUSER', chainId: 1 }
    mockFetchExitPayload.mockResolvedValue('0xpayload')
    mockWriteContractAsync.mockResolvedValue('0xexithash')
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the wallet is not connected', () => {
    it('should list connectors and connect on click', () => {
      mockWalletReturn = { isConnected: false, connect: mockConnect, connectors: [{ uid: 'c1', name: 'MetaMask' }] }

      render(<ClaimWithdrawContent withdrawal={withdrawal} address="0xUSER" onClose={jest.fn()} />)
      fireEvent.click(screen.getByText('MetaMask'))

      expect(mockConnect).toHaveBeenCalledWith({ uid: 'c1', name: 'MetaMask' })
    })
  })

  describe('when connected to the wrong network', () => {
    it('should prompt switching to the Ethereum (L1) chain', () => {
      mockAccountReturn = { address: '0xUSER', chainId: 137 }

      render(<ClaimWithdrawContent withdrawal={withdrawal} address="0xUSER" onClose={jest.fn()} />)
      fireEvent.click(screen.getByText('account.wallets.claim.switch_button'))

      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 1 })
    })
  })

  describe('when connected on Ethereum', () => {
    it('should fetch the exit payload, call exit, and settle the row pending→confirmed', async () => {
      render(<ClaimWithdrawContent withdrawal={withdrawal} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.click(screen.getByText('account.wallets.claim.submit'))

      await waitFor(() => expect(screen.getByText('account.wallets.claim.success')).toBeInTheDocument())
      expect(mockFetchExitPayload).toHaveBeenCalledWith('0xburn')
      expect(mockWriteContractAsync).toHaveBeenCalledWith(expect.objectContaining({ functionName: 'exit', args: ['0xpayload'] }))
      expect(mockUpdateTransaction).toHaveBeenNthCalledWith(1, '0xburn', { status: 'pending', claimHash: '0xexithash' })
      expect(mockUpdateTransaction).toHaveBeenNthCalledWith(2, '0xburn', { status: 'confirmed' })
    })

    it('should surface a rejection message without leaking the raw error', async () => {
      mockWriteContractAsync.mockRejectedValue(new Error('User rejected the request'))
      render(<ClaimWithdrawContent withdrawal={withdrawal} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.click(screen.getByText('account.wallets.claim.submit'))

      await waitFor(() => expect(screen.getByText('account.wallets.claim.rejected')).toBeInTheDocument())
    })

    it('should roll the row back to checkpoint when the exit receipt reverts', async () => {
      mockWaitForTransactionReceipt.mockResolvedValue({ status: 'reverted' })
      render(<ClaimWithdrawContent withdrawal={withdrawal} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.click(screen.getByText('account.wallets.claim.submit'))

      await waitFor(() => expect(screen.getByText('account.wallets.claim.error')).toBeInTheDocument())
      expect(mockUpdateTransaction).toHaveBeenLastCalledWith('0xburn', { status: 'checkpoint' })
      expect(screen.queryByText('account.wallets.claim.success')).not.toBeInTheDocument()
    })

    it('should revert to bridging and show a not-ready message when the exit is not claimable yet', async () => {
      mockFetchExitPayload.mockResolvedValue(null)
      render(<ClaimWithdrawContent withdrawal={withdrawal} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.click(screen.getByText('account.wallets.claim.submit'))

      await waitFor(() => expect(screen.getByText('account.wallets.claim.not_ready')).toBeInTheDocument())
      expect(mockUpdateTransaction).toHaveBeenCalledWith('0xburn', { status: 'bridging' })
      expect(mockWriteContractAsync).not.toHaveBeenCalled()
    })

    it('should surface a generic error when the proof request throws (transport error)', async () => {
      mockFetchExitPayload.mockRejectedValue(new Error('network down'))
      render(<ClaimWithdrawContent withdrawal={withdrawal} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.click(screen.getByText('account.wallets.claim.submit'))

      await waitFor(() => expect(screen.getByText('account.wallets.claim.error')).toBeInTheDocument())
      expect(mockWriteContractAsync).not.toHaveBeenCalled()
    })

    it('should call onSuccess after a confirmed exit', async () => {
      const onSuccess = jest.fn()
      render(<ClaimWithdrawContent withdrawal={withdrawal} address="0xUSER" onClose={jest.fn()} onSuccess={onSuccess} />)

      fireEvent.click(screen.getByText('account.wallets.claim.submit'))

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    })
  })
})
