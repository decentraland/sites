import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { SwapManaModal } from './SwapManaModal'

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

jest.mock('./SwapManaContent', () => ({
  SwapManaContent: ({ balance }: { balance?: number }) => <div data-testid="swap-content">{balance}</div>
}))

jest.mock('../SendManaModal/SendManaModal.styled', () => ({
  StyledDialog: ({ open, children }: { open: boolean; children?: ReactNode }) => (open ? <div>{children}</div> : null),
  Header: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Title: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
  CloseButton: ({ children }: { children?: ReactNode }) => <button type="button">{children}</button>,
  Centered: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  StateText: ({ children }: { children?: ReactNode }) => <span>{children}</span>
}))

describe('SwapManaModal', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should not mount the Web3 shell while closed', () => {
    render(<SwapManaModal open={false} balance={100} address="0xabc" onClose={jest.fn()} />)

    expect(screen.queryByTestId('blockchain-shell')).not.toBeInTheDocument()
    expect(screen.queryByTestId('swap-content')).not.toBeInTheDocument()
  })

  it('should mount the shell and the swap content with the balance when open', () => {
    render(<SwapManaModal open balance={42} address="0xabc" onClose={jest.fn()} />)

    expect(screen.getByTestId('blockchain-shell')).toBeInTheDocument()
    expect(screen.getByTestId('swap-content')).toHaveTextContent('42')
  })
})
