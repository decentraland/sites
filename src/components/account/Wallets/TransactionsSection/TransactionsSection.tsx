import { memo, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import type { WalletTransaction, WalletTransactionStatus, WalletTransactionType } from '../../../../hooks/useWalletTransactions.types'
import { ManaMarkIcon } from '../ManaMarkIcon'
import { formatMana, getExplorerTxUrl } from '../wallets.helpers'
import { TransactionReceivedIcon, TransactionSentIcon, TransactionSwapIcon } from './TransactionTypeIcon'
import {
  Amount,
  ChevronWrap,
  ClaimButton,
  EmptyState,
  GroupHeader,
  HashLink,
  Header,
  IconChip,
  List,
  LoadMoreButton,
  Row,
  RowDate,
  RowType,
  Section,
  StatusBadge
} from './TransactionsSection.styled'

interface TransactionsSectionProps {
  transactions: WalletTransaction[]
  // Opens the exit (claim on Ethereum) flow for a checkpointed withdrawal row.
  onClaim?: (withdrawal: WalletTransaction) => void
}

const TYPE_ICON: Record<WalletTransactionType, ReactNode> = {
  send: <TransactionSentIcon />,
  received: <TransactionReceivedIcon />,
  swap: <TransactionSwapIcon />,
  withdraw: <SwapVertRoundedIcon fontSize="small" />
}

// In-flight bridge lifecycle goes in the "Pending" group; settled/failed txs go in "Latest".
const PENDING_STATUSES: ReadonlySet<WalletTransactionStatus> = new Set(['pending', 'bridging', 'checkpoint'])

// Settled history is paged so a long record never renders hundreds of rows at once: the list shows this
// many rows, scrolls internally, and reveals the next batch via "Load more". Pending txs are never paged
// — they are few and actionable (e.g. an unclaimed withdrawal must stay reachable).
const LATEST_PAGE_SIZE = 20

// Local timezone — the tx was submitted from the user's device, so a UTC anchor would be wrong here.
const formatDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })

const TransactionsSection = ({ transactions, onClaim }: TransactionsSectionProps) => {
  const t = useFormatMessage()
  const [expanded, setExpanded] = useState(false)
  const [visibleLatest, setVisibleLatest] = useState(LATEST_PAGE_SIZE)

  const { pending, latest } = useMemo(
    () => ({
      pending: transactions.filter(transaction => PENDING_STATUSES.has(transaction.status)),
      latest: transactions.filter(transaction => !PENDING_STATUSES.has(transaction.status))
    }),
    [transactions]
  )

  // transactions arrive newest-first (see mergeManaTransferFeeds), so this is the most recent page.
  const visibleRows = latest.slice(0, visibleLatest)
  const hasMore = latest.length > visibleLatest

  const renderRow = (transaction: WalletTransaction, index: number) => {
    // A claimed withdrawal's L1 exit lives on Ethereum; once we have its hash (claimHash), link to it
    // instead of the Polygon burn so "view tx" points at the in-flight/settled exit, not the anchor.
    const explorerNetwork = transaction.claimHash ? 'ethereum' : transaction.network
    const explorerHash = transaction.claimHash ?? transaction.hash
    return (
      <Row key={`${transaction.hash}-${index}`} data-role="transaction-row">
        <IconChip>{TYPE_ICON[transaction.type]}</IconChip>
        <RowType>{t(`account.wallets.transactions.type.${transaction.type}`)}</RowType>
        <RowDate>{formatDate(transaction.timestamp)}</RowDate>
        <HashLink
          href={getExplorerTxUrl(explorerNetwork, explorerHash)}
          target="_blank"
          rel="noopener noreferrer"
          data-role="transaction-hash"
        >
          {explorerHash}
        </HashLink>
        {transaction.status === 'checkpoint' && onClaim ? (
          <ClaimButton type="button" onClick={() => onClaim(transaction)} data-role="transaction-claim">
            {t('account.wallets.transactions.claim')}
          </ClaimButton>
        ) : (
          <StatusBadge $status={transaction.status}>{t(`account.wallets.transactions.status.${transaction.status}`)}</StatusBadge>
        )}
        <Amount>
          <ManaMarkIcon />
          {formatMana(transaction.amount)}
        </Amount>
      </Row>
    )
  }

  return (
    <Section data-role="transactions-section">
      <Header type="button" onClick={() => setExpanded(prev => !prev)} aria-expanded={expanded} data-role="transactions-toggle">
        {t('account.wallets.transactions.title')}
        <ChevronWrap $expanded={expanded}>
          <ExpandMoreRoundedIcon fontSize="small" />
        </ChevronWrap>
      </Header>
      {expanded && (
        <List data-role="transactions-list">
          {transactions.length === 0 ? (
            <EmptyState data-role="transactions-empty">{t('account.wallets.transactions.empty')}</EmptyState>
          ) : (
            <>
              {pending.length > 0 && (
                <>
                  <GroupHeader data-role="transactions-group-pending">{t('account.wallets.transactions.pending_title')}</GroupHeader>
                  {pending.map(renderRow)}
                </>
              )}
              {latest.length > 0 && (
                <>
                  <GroupHeader data-role="transactions-group-latest">{t('account.wallets.transactions.latest_title')}</GroupHeader>
                  {visibleRows.map(renderRow)}
                  {hasMore && (
                    <LoadMoreButton
                      type="button"
                      onClick={() => setVisibleLatest(count => count + LATEST_PAGE_SIZE)}
                      data-role="transactions-load-more"
                    >
                      {t('account.wallets.transactions.load_more')}
                    </LoadMoreButton>
                  )}
                </>
              )}
            </>
          )}
        </List>
      )}
    </Section>
  )
}

const MemoizedTransactionsSection = memo(TransactionsSection)

export { MemoizedTransactionsSection as TransactionsSection }
