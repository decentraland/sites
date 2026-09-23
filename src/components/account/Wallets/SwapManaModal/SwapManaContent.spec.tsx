import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SwapManaContent } from './SwapManaContent'

const mockConnect = jest.fn()
const mockSwitchChain = jest.fn()
const mockWriteContractAsync = jest.fn()
const mockReadContract = jest.fn()
const mockWaitForTransactionReceipt = jest.fn()

let mockWalletReturn: { isConnected: boolean; connect: jest.Mock; connectors: Array<{ uid: string; name: string }> }
let mockAccountReturn: { address?: string; chainId?: number }

jest.mock('@dcl/core-web3', () => ({
  useWallet: () => mockWalletReturn
}))

jest.mock('wagmi', () => ({
  useAccount: () => mockAccountReturn,
  useSwitchChain: () => ({ switchChain: mockSwitchChain, isPending: false }),
  useWriteContract: () => ({ writeContractAsync: mockWriteContractAsync }),
  usePublicClient: () => ({ readContract: mockReadContract, waitForTransactionReceipt: mockWaitForTransactionReceipt })
}))

jest.mock('viem', () => ({
  parseEther: (value: string) => BigInt(Math.round(Number(value) * 1e6)) * BigInt(1e12),
  encodeAbiParameters: () => '0xencoded'
}))

jest.mock('../bridgeContract', () => ({
  ERC20_ALLOWANCE_ABI: ['allowanceAbi'],
  ROOT_CHAIN_MANAGER_ABI: ['rootChainAbi'],
  getErc20PredicateAddress: () => '0xPREDICATE',
  getL1ChainId: () => 11155111,
  getRootChainManagerAddress: () => '0xROOTCHAIN'
}))

jest.mock('../manaContract', () => ({
  getManaAddress: () => '0xMANA'
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../../../hooks/useWalletTransactions', () => ({
  useWalletTransactions: () => ({ addTransaction: jest.fn(), updateTransactionStatus: jest.fn() })
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

describe('SwapManaContent', () => {
  beforeEach(() => {
    mockWalletReturn = { isConnected: true, connect: mockConnect, connectors: [] }
    mockAccountReturn = { address: '0xUSER', chainId: 11155111 }
    mockWriteContractAsync.mockResolvedValue('0xtxhash')
    mockReadContract.mockResolvedValue(0n)
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the wallet is not connected', () => {
    it('should list connectors and connect on click', () => {
      mockWalletReturn = {
        isConnected: false,
        connect: mockConnect,
        connectors: [{ uid: 'c1', name: 'MetaMask' }]
      }

      render(<SwapManaContent balance={100} address="0xUSER" onClose={jest.fn()} />)
      fireEvent.click(screen.getByText('MetaMask'))

      expect(mockConnect).toHaveBeenCalledWith({ uid: 'c1', name: 'MetaMask' })
    })
  })

  describe('when connected to the wrong network', () => {
    it('should prompt switching to the L1 chain', () => {
      mockAccountReturn = { address: '0xUSER', chainId: 1 }

      render(<SwapManaContent balance={100} address="0xUSER" onClose={jest.fn()} />)
      fireEvent.click(screen.getByText('account.wallets.swap.switch_button'))

      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 11155111 })
    })
  })

  describe('when connected on the L1 chain', () => {
    it('should approve then deposit when the allowance is short', async () => {
      mockReadContract.mockResolvedValue(0n)
      render(<SwapManaContent balance={100} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } })
      fireEvent.click(screen.getByText('account.wallets.swap.submit'))

      await waitFor(() => expect(screen.getByText('account.wallets.swap.success')).toBeInTheDocument())
      // approve + depositFor
      expect(mockWriteContractAsync).toHaveBeenCalledTimes(2)
      expect(mockWriteContractAsync).toHaveBeenNthCalledWith(1, expect.objectContaining({ functionName: 'approve' }))
      expect(mockWriteContractAsync).toHaveBeenNthCalledWith(2, expect.objectContaining({ functionName: 'depositFor' }))
    })

    it('should ignore a rapid second click while a swap is already in flight', async () => {
      // Hold the allowance read pending so both clicks race before `phase` flips to busy — only the
      // ref guard can stop the second handleSwap from launching a concurrent flow.
      let resolveAllowance: (value: bigint) => void = () => {}
      mockReadContract.mockReturnValue(new Promise<bigint>(resolve => (resolveAllowance = resolve)))
      render(<SwapManaContent balance={100} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } })
      const submit = screen.getByText('account.wallets.swap.submit')
      fireEvent.click(submit)
      fireEvent.click(submit)
      resolveAllowance(0n)

      await waitFor(() => expect(mockWriteContractAsync).toHaveBeenCalled())
      // The second click returned early at the guard, so the allowance read ran only once.
      expect(mockReadContract).toHaveBeenCalledTimes(1)
    })

    it('should skip the approval when the allowance already covers the amount', async () => {
      mockReadContract.mockResolvedValue(BigInt(1e30))
      render(<SwapManaContent balance={100} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } })
      fireEvent.click(screen.getByText('account.wallets.swap.submit'))

      await waitFor(() => expect(screen.getByText('account.wallets.swap.success')).toBeInTheDocument())
      expect(mockWriteContractAsync).toHaveBeenCalledTimes(1)
      expect(mockWriteContractAsync).toHaveBeenCalledWith(expect.objectContaining({ functionName: 'depositFor' }))
    })

    it('should surface a rejection message without leaking the raw error', async () => {
      mockReadContract.mockResolvedValue(0n)
      mockWriteContractAsync.mockRejectedValue(new Error('User rejected the request'))
      render(<SwapManaContent balance={100} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } })
      fireEvent.click(screen.getByText('account.wallets.swap.submit'))

      await waitFor(() => expect(screen.getByText('account.wallets.swap.rejected')).toBeInTheDocument())
    })

    it('should error (not succeed) when the deposit receipt reverts', async () => {
      mockReadContract.mockResolvedValue(BigInt(1e30))
      mockWaitForTransactionReceipt.mockResolvedValue({ status: 'reverted' })
      render(<SwapManaContent balance={100} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } })
      fireEvent.click(screen.getByText('account.wallets.swap.submit'))

      await waitFor(() => expect(screen.getByText('account.wallets.swap.error')).toBeInTheDocument())
      expect(screen.queryByText('account.wallets.swap.success')).not.toBeInTheDocument()
    })

    it('should call onSuccess after a confirmed deposit', async () => {
      const onSuccess = jest.fn()
      mockReadContract.mockResolvedValue(BigInt(1e30))
      render(<SwapManaContent balance={100} address="0xUSER" onClose={jest.fn()} onSuccess={onSuccess} />)

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } })
      fireEvent.click(screen.getByText('account.wallets.swap.submit'))

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    })

    it('should disable the submit when the amount exceeds the balance', () => {
      render(<SwapManaContent balance={3} address="0xUSER" onClose={jest.fn()} />)

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } })

      expect(screen.getByText('account.wallets.swap.submit')).toBeDisabled()
    })
  })
})
