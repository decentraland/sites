import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { SendManaModal } from './SendManaModal'

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

jest.mock('./SendManaContent', () => ({
  SendManaContent: ({ network }: { network: string }) => <div data-testid="send-content">{network}</div>
}))

jest.mock('./SendManaModal.styled', () => ({
  // MUI Dialog renders its content only while open — mirror that so we test the lazy-mount behaviour.
  StyledDialog: ({ open, children }: { open: boolean; children?: ReactNode }) => (open ? <div>{children}</div> : null),
  Header: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Title: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
  CloseButton: ({ children }: { children?: ReactNode }) => <button type="button">{children}</button>,
  Centered: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  StateText: ({ children }: { children?: ReactNode }) => <span>{children}</span>
}))

describe('SendManaModal', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should not mount the Web3 shell while closed', () => {
    render(<SendManaModal open={false} network="polygon" onClose={jest.fn()} />)

    expect(screen.queryByTestId('blockchain-shell')).not.toBeInTheDocument()
    expect(screen.queryByTestId('send-content')).not.toBeInTheDocument()
  })

  it('should mount the shell and the send content for the given network when open', () => {
    render(<SendManaModal open network="ethereum" onClose={jest.fn()} />)

    expect(screen.getByTestId('blockchain-shell')).toBeInTheDocument()
    expect(screen.getByTestId('send-content')).toHaveTextContent('ethereum')
  })
})
