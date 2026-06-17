import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { SendManaContent } from './SendManaContent'

const mockConnect = jest.fn()
const mockSwitchChain = jest.fn()
const mockWriteContract = jest.fn()

let mockWalletReturn: { isConnected: boolean; connect: jest.Mock; connectors: Array<{ uid: string; name: string }> }
let mockAccountReturn: { chainId: number | undefined }
let mockSwitchReturn: { switchChain: jest.Mock; isPending: boolean }
let mockWriteReturn: { writeContract: jest.Mock; data: string | undefined; isPending: boolean; error: Error | null }
let mockReceiptReturn: { isLoading: boolean; isSuccess: boolean }

jest.mock('@dcl/core-web3', () => ({
  useWallet: () => mockWalletReturn
}))

jest.mock('wagmi', () => ({
  useAccount: () => mockAccountReturn,
  useSwitchChain: () => mockSwitchReturn,
  useWriteContract: () => mockWriteReturn,
  useWaitForTransactionReceipt: () => mockReceiptReturn
}))

jest.mock('viem', () => ({
  parseEther: (value: string) => `parsed:${value}`
}))

jest.mock('../manaContract', () => ({
  getManaAddress: () => '0xMANA',
  getNetworkChainId: () => 137,
  ERC20_TRANSFER_ABI: ['abi']
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick, disabled }: { children?: ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),

  TextField: ({
    type,
    value,
    onChange,
    helperText
  }: {
    type?: string
    value?: string
    onChange?: (event: { target: { value: string } }) => void
    helperText?: ReactNode
  }) => (
    <span>
      <input role={type === 'number' ? 'spinbutton' : 'textbox'} value={value} onChange={onChange} />
      <span>{helperText}</span>
    </span>
  )
}))

jest.mock('./SendManaModal.styled', () => ({
  Body: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Centered: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  ConnectList: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Description: ({ children }: { children?: ReactNode }) => <p>{children}</p>,
  StateText: ({ children }: { children?: ReactNode }) => <span>{children}</span>
}))

const VALID_ADDRESS = `0x${'1'.repeat(40)}`

describe('SendManaContent', () => {
  beforeEach(() => {
    mockWalletReturn = { isConnected: false, connect: mockConnect, connectors: [] }
    mockAccountReturn = { chainId: undefined }
    mockSwitchReturn = { switchChain: mockSwitchChain, isPending: false }
    mockWriteReturn = { writeContract: mockWriteContract, data: undefined, isPending: false, error: null }
    mockReceiptReturn = { isLoading: false, isSuccess: false }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the wallet is not connected', () => {
    it('should list the available connectors and connect on click', () => {
      mockWalletReturn = {
        isConnected: false,
        connect: mockConnect,
        connectors: [
          { uid: 'c1', name: 'MetaMask' },
          { uid: 'c2', name: 'WalletConnect' }
        ]
      }

      render(<SendManaContent network="polygon" onClose={jest.fn()} />)

      fireEvent.click(screen.getByText('MetaMask'))

      expect(mockConnect).toHaveBeenCalledWith({ uid: 'c1', name: 'MetaMask' })
    })
  })

  describe('when connected to the wrong network', () => {
    it('should prompt a network switch to the target chain', () => {
      mockWalletReturn = { isConnected: true, connect: mockConnect, connectors: [] }
      mockAccountReturn = { chainId: 1 }

      render(<SendManaContent network="polygon" onClose={jest.fn()} />)

      fireEvent.click(screen.getByText('account.wallets.send.switch_button'))

      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 137 })
    })
  })

  describe('when connected to the right network', () => {
    beforeEach(() => {
      mockWalletReturn = { isConnected: true, connect: mockConnect, connectors: [] }
      mockAccountReturn = { chainId: 137 }
    })

    it('should disable the submit and show a hint for an invalid address', () => {
      render(<SendManaContent network="polygon" onClose={jest.fn()} />)

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'not-an-address' } })

      expect(screen.getByText('account.wallets.send.invalid_address')).toBeInTheDocument()
      expect(screen.getByText('account.wallets.send.send_button')).toBeDisabled()
    })

    it('should call writeContract with the transfer args for a valid form', () => {
      render(<SendManaContent network="polygon" onClose={jest.fn()} />)

      fireEvent.change(screen.getByRole('textbox'), { target: { value: VALID_ADDRESS } })
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } })
      fireEvent.click(screen.getByText('account.wallets.send.send_button'))

      expect(mockWriteContract).toHaveBeenCalledWith({
        address: '0xMANA',
        abi: ['abi'],
        functionName: 'transfer',
        args: [VALID_ADDRESS, 'parsed:5'],
        chainId: 137
      })
    })

    it('should surface a rejection message without leaking the raw error', () => {
      mockWriteReturn = {
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        error: new Error('User rejected the request')
      }

      render(<SendManaContent network="polygon" onClose={jest.fn()} />)

      expect(screen.getByText('account.wallets.send.rejected')).toBeInTheDocument()
      expect(screen.queryByText(/User rejected the request/)).not.toBeInTheDocument()
    })

    it('should surface a generic message for non-rejection errors', () => {
      mockWriteReturn = { writeContract: mockWriteContract, data: undefined, isPending: false, error: new Error('boom') }

      render(<SendManaContent network="polygon" onClose={jest.fn()} />)

      expect(screen.getByText('account.wallets.send.error')).toBeInTheDocument()
    })
  })

  describe('when the transfer succeeds', () => {
    it('should show the success state and close on confirm', () => {
      mockWalletReturn = { isConnected: true, connect: mockConnect, connectors: [] }
      mockAccountReturn = { chainId: 137 }
      mockReceiptReturn = { isLoading: false, isSuccess: true }
      const onClose = jest.fn()

      render(<SendManaContent network="polygon" onClose={onClose} />)

      expect(screen.getByText('account.wallets.send.success')).toBeInTheDocument()
      fireEvent.click(screen.getByText('account.wallets.send.close'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
