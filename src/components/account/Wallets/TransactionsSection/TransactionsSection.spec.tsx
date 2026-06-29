import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import type { WalletTransaction } from '../../../../hooks/useWalletTransactions.types'
import { TransactionsSection } from './TransactionsSection'

type ChildrenProps = { children?: ReactNode; 'data-role'?: string }
type LinkProps = ChildrenProps & { href?: string }
type HeaderProps = ChildrenProps & { onClick?: () => void; 'aria-expanded'?: boolean }

jest.mock('@mui/icons-material/ExpandMoreRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/NorthEastRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/SouthWestRounded', () => ({ __esModule: true, default: () => <span /> }))

// The MANA mark renders nothing in tests so the amount's text stays matchable by getByText.
jest.mock('decentraland-ui2', () => ({
  SvgIcon: () => null
}))

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
  IconChip: ({ children }: ChildrenProps) => <span>{children}</span>,
  RowType: ({ children }: ChildrenProps) => <span>{children}</span>,
  RowDate: ({ children }: ChildrenProps) => <span>{children}</span>,
  HashLink: ({ children, href, 'data-role': dataRole }: LinkProps) => (
    <a href={href} data-role={dataRole}>
      {children}
    </a>
  ),
  StatusBadge: ({ children }: ChildrenProps) => <span>{children}</span>,
  GroupHeader: ({ children, 'data-role': dataRole }: ChildrenProps) => <p data-role={dataRole}>{children}</p>,
  ClaimButton: ({ children, onClick, 'data-role': dataRole }: ChildrenProps & { onClick?: () => void }) => (
    <button type="button" data-role={dataRole} onClick={onClick}>
      {children}
    </button>
  ),
  LoadMoreButton: ({ children, onClick, 'data-role': dataRole }: ChildrenProps & { onClick?: () => void }) => (
    <button type="button" data-role={dataRole} onClick={onClick}>
      {children}
    </button>
  ),
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

const withdrawTx: WalletTransaction = {
  hash: '0xabcabcabcabcabcabcabcabcabcabcabcabcabca',
  type: 'withdraw',
  network: 'polygon',
  amount: 50,
  timestamp: 1718000500000,
  status: 'checkpoint'
}

const confirmedTx: WalletTransaction = { ...tx, hash: '0xdeadbeef', status: 'confirmed' }

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

  it('should render a row with type, full explorer hash link, status and amount when expanded', () => {
    render(<TransactionsSection transactions={[tx]} />)
    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByText('account.wallets.transactions.type.send')).toBeInTheDocument()
    expect(screen.getByText('account.wallets.transactions.status.pending')).toBeInTheDocument()
    expect(screen.getByText('formatted-10')).toBeInTheDocument()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', `https://explorer.test/ethereum/${tx.hash}`)
    expect(link).toHaveTextContent(tx.hash)
  })

  it('should link a claimed withdrawal to its Ethereum exit tx (claimHash) instead of the burn', () => {
    const claimed: WalletTransaction = { ...withdrawTx, status: 'pending', claimHash: '0xexit1234' }
    render(<TransactionsSection transactions={[claimed]} />)
    fireEvent.click(screen.getByRole('button', { name: /account.wallets.transactions.title/ }))

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://explorer.test/ethereum/0xexit1234')
    expect(link).toHaveTextContent('0xexit1234')
  })

  it('should split in-progress txs into a pending group and settled txs into a latest group', () => {
    render(<TransactionsSection transactions={[tx, confirmedTx]} />)
    fireEvent.click(screen.getByRole('button', { name: /account.wallets.transactions.title/ }))

    expect(screen.getByText('account.wallets.transactions.pending_title')).toBeInTheDocument()
    expect(screen.getByText('account.wallets.transactions.latest_title')).toBeInTheDocument()
  })

  it('should show the first 20 settled transactions and reveal the rest via Load more', () => {
    // 25 settled txs, already newest-first as they arrive from mergeManaTransferFeeds.
    const many: WalletTransaction[] = Array.from({ length: 25 }, (_, i) => ({
      ...confirmedTx,
      hash: `0xc${i}`,
      timestamp: confirmedTx.timestamp - i
    }))
    render(<TransactionsSection transactions={many} />)
    fireEvent.click(screen.getByRole('button', { name: /account.wallets.transactions.title/ }))

    expect(screen.getAllByRole('link')).toHaveLength(20)
    expect(screen.getByText('0xc0')).toBeInTheDocument() // most recent shown
    expect(screen.queryByText('0xc20')).not.toBeInTheDocument() // 21st-newest not shown yet

    fireEvent.click(screen.getByRole('button', { name: 'account.wallets.transactions.load_more' }))

    expect(screen.getAllByRole('link')).toHaveLength(25)
    expect(screen.getByText('0xc20')).toBeInTheDocument()
    // no more pages left → the button is gone
    expect(screen.queryByRole('button', { name: 'account.wallets.transactions.load_more' })).not.toBeInTheDocument()
  })

  it('should not show Load more when the settled history fits in a single page', () => {
    render(<TransactionsSection transactions={[confirmedTx]} />)
    fireEvent.click(screen.getByRole('button', { name: /account.wallets.transactions.title/ }))

    expect(screen.queryByRole('button', { name: 'account.wallets.transactions.load_more' })).not.toBeInTheDocument()
  })

  it('should not cap pending transactions so an old unclaimed withdrawal stays reachable', () => {
    const manyPending: WalletTransaction[] = Array.from({ length: 22 }, (_, i) => ({
      ...withdrawTx,
      hash: `0xp${i}`,
      timestamp: withdrawTx.timestamp - i
    }))
    render(<TransactionsSection transactions={manyPending} />)
    fireEvent.click(screen.getByRole('button', { name: /account.wallets.transactions.title/ }))

    expect(screen.getAllByRole('link')).toHaveLength(22)
  })

  it('should render a claim button on a checkpointed withdrawal and call onClaim', () => {
    const onClaim = jest.fn()
    render(<TransactionsSection transactions={[withdrawTx]} onClaim={onClaim} />)
    fireEvent.click(screen.getByRole('button', { name: /account.wallets.transactions.title/ }))

    const claim = screen.getByRole('button', { name: 'account.wallets.transactions.claim' })
    fireEvent.click(claim)
    expect(onClaim).toHaveBeenCalledWith(withdrawTx)
  })

  it('should fall back to a status badge for a checkpointed withdrawal when no onClaim is given', () => {
    render(<TransactionsSection transactions={[withdrawTx]} />)
    fireEvent.click(screen.getByRole('button', { name: /account.wallets.transactions.title/ }))

    expect(screen.getByText('account.wallets.transactions.status.checkpoint')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'account.wallets.transactions.claim' })).not.toBeInTheDocument()
  })
})
