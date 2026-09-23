import { fireEvent, render, screen } from '@testing-library/react'
import { BlockchainShell } from './BlockchainShell'

const mockInjectWeb3Reducers = jest.fn()

jest.mock('./store', () => ({
  injectWeb3Reducers: () => mockInjectWeb3Reducers()
}))

jest.mock('./web3Config', () => ({
  getWeb3Config: () => ({})
}))

// Stand in for core-web3's lazy boundary: render the wallet provider as a passthrough and expose a
// button that fires `onLoad` so the test controls the load timing the real provider triggers async.
jest.mock('@dcl/core-web3/lazy', () => ({
  WalletStateProvider: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Web3LazyProvider: ({ onLoad, children }: { onLoad: () => void; children?: React.ReactNode }) => (
    <div>
      <button type="button" data-testid="trigger-load" onClick={() => onLoad()}>
        load
      </button>
      {children}
    </div>
  )
}))

describe('BlockchainShell', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should inject the Web3 reducers on mount and withhold children until the bundle loads', () => {
    render(
      <BlockchainShell fallback={<div data-testid="fallback" />}>
        <div data-testid="children" />
      </BlockchainShell>
    )

    // Reducers are injected synchronously on mount — before Web3Inner mounts and reads the wallet
    // slice — not in onLoad.
    expect(mockInjectWeb3Reducers).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('children')).not.toBeInTheDocument()
  })

  it('should reveal children once the Web3 bundle has loaded', () => {
    render(
      <BlockchainShell fallback={<div data-testid="fallback" />}>
        <div data-testid="children" />
      </BlockchainShell>
    )

    fireEvent.click(screen.getByTestId('trigger-load'))

    expect(screen.getByTestId('children')).toBeInTheDocument()
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument()
  })
})
