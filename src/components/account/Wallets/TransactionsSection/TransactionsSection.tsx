import { memo, useState } from 'react'
import type { ReactNode } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import type { WalletTransaction, WalletTransactionType } from '../../../../hooks/useWalletTransactions.types'
import { formatMana, getExplorerTxUrl } from '../wallets.helpers'
import {
  Amount,
  ChevronWrap,
  EmptyState,
  HashLink,
  Header,
  List,
  Row,
  RowDate,
  RowMain,
  RowType,
  Section,
  StatusBadge,
  TypeIcon
} from './TransactionsSection.styled'

interface TransactionsSectionProps {
  transactions: WalletTransaction[]
}

const TYPE_ICON: Record<WalletTransactionType, ReactNode> = {
  send: <NorthEastRoundedIcon fontSize="small" />,
  swap: <SwapHorizRoundedIcon fontSize="small" />
}

const shortHash = (hash: string): string => (hash.length > 18 ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : hash)

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

const TransactionsSection = ({ transactions }: TransactionsSectionProps) => {
  const t = useFormatMessage()
  const [expanded, setExpanded] = useState(false)

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
            transactions.map(transaction => (
              <Row key={transaction.hash} data-role="transaction-row">
                <TypeIcon>{TYPE_ICON[transaction.type]}</TypeIcon>
                <RowMain>
                  <RowType>{t(`account.wallets.transactions.type.${transaction.type}`)}</RowType>
                  <RowDate>{formatDate(transaction.timestamp)}</RowDate>
                </RowMain>
                <HashLink
                  href={getExplorerTxUrl(transaction.network, transaction.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-role="transaction-hash"
                >
                  {shortHash(transaction.hash)}
                </HashLink>
                <StatusBadge $status={transaction.status}>{t(`account.wallets.transactions.status.${transaction.status}`)}</StatusBadge>
                <Amount>{formatMana(transaction.amount)}</Amount>
              </Row>
            ))
          )}
        </List>
      )}
    </Section>
  )
}

const MemoizedTransactionsSection = memo(TransactionsSection)

export { MemoizedTransactionsSection as TransactionsSection }
