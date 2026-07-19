import { useState } from 'react'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { useWalletTransactions } from '../../../../hooks/useWalletTransactions'
import { SendManaContent } from './SendManaContent'

// Crash repro (React #185 white page): uses the REAL tx store, with a parent that subscribes to it
// and passes an unstable onSuccess — the wiring that made the confirm effect loop until React aborted.

const mockWriteContract = jest.fn()

jest.mock('@dcl/core-web3', () => ({
  useWallet: () => ({ isConnected: true, connect: jest.fn(), connectors: [] })
}))

jest.mock('wagmi', () => ({
  useAccount: () => ({ chainId: 137 }),
  useSwitchChain: () => ({ switchChain: jest.fn(), isPending: false }),
  useWriteContract: () => ({ writeContract: mockWriteContract, data: '0xLOOPHASH', isPending: false, error: null }),
  useWaitForTransactionReceipt: () => ({ isLoading: false, isSuccess: true })
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
  Button: ({ children, onClick }: { children?: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  TextField: () => <input />
}))

jest.mock('./SendManaModal.styled', () => ({
  Body: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Centered: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  ConnectList: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Description: ({ children }: { children?: ReactNode }) => <p>{children}</p>,
  StateText: ({ children }: { children?: ReactNode }) => <span>{children}</span>
}))

const Harness = ({ address, onSuccessSpy }: { address: string; onSuccessSpy: jest.Mock }) => {
  const { transactions } = useWalletTransactions(address)
  const [refreshes, setRefreshes] = useState(0)
  return (
    <div data-testid="harness" data-tx-count={transactions.length} data-refreshes={refreshes}>
      <SendManaContent
        network="polygon"
        address={address}
        onClose={jest.fn()}
        onSuccess={() => {
          onSuccessSpy()
          setRefreshes(current => current + 1)
        }}
      />
    </div>
  )
}

describe('SendManaContent wired to the real transaction store', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the receipt confirms while the parent re-renders on store notifications', () => {
    it('should settle after a single confirmation instead of looping to a crash', () => {
      const onSuccessSpy = jest.fn()
      const address = '0xB00000000000000000000000000000000000C0DE'

      render(<Harness address={address} onSuccessSpy={onSuccessSpy} />)

      expect(screen.getByText('account.wallets.send.success')).toBeInTheDocument()
      expect(onSuccessSpy).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('harness')).toHaveAttribute('data-tx-count', '1')

      const stored: unknown = JSON.parse(window.localStorage.getItem(`dcl-account-wallet-txs-${address.toLowerCase()}`) ?? '[]')
      expect(stored).toEqual([expect.objectContaining({ hash: '0xLOOPHASH', type: 'send', network: 'polygon', status: 'confirmed' })])
    })
  })
})
