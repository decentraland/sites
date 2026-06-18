import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import type { WalletTransaction } from '../../../../hooks/useWalletTransactions.types'
import { TransactionsSection } from './TransactionsSection'

type ChildrenProps = { children?: ReactNode; 'data-role'?: string }
type LinkProps = ChildrenProps & { href?: string }
type HeaderProps = ChildrenProps & { onClick?: () => void; 'aria-expanded'?: boolean }

jest.mock('@mui/icons-material/ExpandMoreRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/NorthEastRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/SwapHorizRounded', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../wallets.helpers', () => ({
  formatMana: (value: number) => `formatted-${value}`,
  getExplorerTxUrl: (network: string, hash: string) => `https://explorer.test/${network}/${hash}`
}))

jest.mock('./TransactionsSection.styled', () => ({
  Section: ({ children, 'data-role': dataRole }: ChildrenProps) => <div data-role={dataRole}>{children}</div>,
  Header: ({ children, onClick, 'aria-expanded': expanded, 'data-role': dataRole }: HeaderProps) => (
    <button type="button" data-role={dataRole} aria-expanded={expanded} onClick={onClick}>
      {children}
    </button>
  ),
  ChevronWrap: ({ children }: ChildrenProps) => <span>{children}</span>,
  List: ({ children, 'data-role': dataRole }: ChildrenProps) => <div data-role={dataRole}>{children}</div>,
  EmptyState: ({ children, 'data-role': dataRole }: ChildrenProps) => <p data-role={dataRole}>{children}</p>,
  Row: ({ children, 'data-role': dataRole }: ChildrenProps) => <div data-role={dataRole}>{children}</div>,
  TypeIcon: ({ children }: ChildrenProps) => <span>{children}</span>,
  RowMain: ({ children }: ChildrenProps) => <div>{children}</div>,
  RowType: ({ children }: ChildrenProps) => <span>{children}</span>,
  RowDate: ({ children }: ChildrenProps) => <span>{children}</span>,
  HashLink: ({ children, href, 'data-role': dataRole }: LinkProps) => (
    <a href={href} data-role={dataRole}>
      {children}
    </a>
  ),
  StatusBadge: ({ children }: ChildrenProps) => <span>{children}</span>,
  Amount: ({ children }: ChildrenProps) => <span>{children}</span>
}))

const tx: WalletTransaction = {
  hash: '0x1234567890abcdef1234567890abcdef12345678',
  type: 'send',
  network: 'ethereum',
  amount: 10,
  timestamp: 1718000000000,
  status: 'pending'
}

describe('TransactionsSection', () => {
  it('should keep the list collapsed until the header is clicked', () => {
    render(<TransactionsSection transactions={[tx]} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /account.wallets.transactions.title/ }))
    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('should show the empty state when expanded with no transactions', () => {
    render(<TransactionsSection transactions={[]} />)
    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByText('account.wallets.transactions.empty')).toBeInTheDocument()
  })

  it('should render a row with type, explorer link, status and amount when expanded', () => {
    render(<TransactionsSection transactions={[tx]} />)
    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByText('account.wallets.transactions.type.send')).toBeInTheDocument()
    expect(screen.getByText('account.wallets.transactions.status.pending')).toBeInTheDocument()
    expect(screen.getByText('formatted-10')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', `https://explorer.test/ethereum/${tx.hash}`)
  })
})
