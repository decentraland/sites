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

  it('should render the fallback and withhold children until the Web3 bundle loads', () => {
    render(
      <BlockchainShell fallback={<div data-testid="fallback" />}>
        <div data-testid="children" />
      </BlockchainShell>
    )

    expect(screen.getByTestId('fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('children')).not.toBeInTheDocument()
    expect(mockInjectWeb3Reducers).not.toHaveBeenCalled()
  })

  it('should inject the Web3 reducers and reveal children once loaded', () => {
    render(
      <BlockchainShell fallback={<div data-testid="fallback" />}>
        <div data-testid="children" />
      </BlockchainShell>
    )

    fireEvent.click(screen.getByTestId('trigger-load'))

    expect(mockInjectWeb3Reducers).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('children')).toBeInTheDocument()
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument()
  })
})
