import { Box, Link, Typography, styled } from 'decentraland-ui2'
import type { WalletTransactionStatus } from '../../../../hooks/useWalletTransactions.types'

// Transactions section inside each balance card (Figma "Profile-Account" Wallets): a collapsible
// "Transactions" header that expands to the tracked tx rows. Each row is a column grid — icon chip,
// type, date, explorer hash, status badge, MANA amount — aligned across rows. Hardcoded DCL hexes
// match the sibling wallet styles.
const Section = styled(Box)(() => ({
  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
}))

const Header = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: theme.spacing(1.5, 0),
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 14,
  fontWeight: 600,
  color: '#FCFCFC',
  ['&:focus-visible']: {
    outline: '2px solid rgba(255, 255, 255, 0.6)',
    outlineOffset: -2
  }
}))

const ChevronWrap = styled(Box, { shouldForwardProp: prop => prop !== '$expanded' })<{ $expanded: boolean }>(({ $expanded }) => ({
  display: 'inline-flex',
  color: '#A09BA8',
  transition: 'transform 0.2s ease',
  transform: $expanded ? 'rotate(180deg)' : 'rotate(0deg)'
}))

const List = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  paddingBottom: theme.spacing(1)
}))

const EmptyState = styled(Typography)(({ theme }) => ({
  fontSize: 13,
  color: '#A09BA8',
  padding: theme.spacing(1.5, 0)
}))

// Mobile stacks type/amount, date/status and a full-width hash into three rows beside the icon;
// md+ lays everything out in one aligned six-column row.
const Row = styled(Box)(({ theme }) => ({
  display: 'grid',
  alignItems: 'center',
  columnGap: theme.spacing(2),
  rowGap: theme.spacing(0.25),
  padding: theme.spacing(1.25, 0),
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
  gridTemplateAreas: `
    "icon type amount"
    "icon date status"
    "icon hash hash"
  `,
  ['& + &']: {
    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
  },
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'auto 88px 188px minmax(0, 1fr) auto auto',
    gridTemplateAreas: '"icon type date hash status amount"',
    rowGap: 0
  }
}))

const IconChip = styled('span')(({ theme }) => ({
  gridArea: 'icon',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  flexShrink: 0,
  borderRadius: theme.spacing(1),
  background: 'rgba(255, 255, 255, 0.06)',
  color: '#FCFCFC',
  ['& .MuiSvgIcon-root']: {
    fontSize: 18
  }
}))

const RowType = styled(Typography)(() => ({
  gridArea: 'type',
  fontSize: 14,
  fontWeight: 600,
  color: '#FCFCFC',
  whiteSpace: 'nowrap'
}))

const RowDate = styled(Typography)(() => ({
  gridArea: 'date',
  fontSize: 13,
  color: '#A09BA8',
  whiteSpace: 'nowrap'
}))

const HashLink = styled(Link)(() => ({
  gridArea: 'hash',
  minWidth: 0,
  maxWidth: '100%',
  fontSize: 13,
  // DCL accent red for the explorer link (Figma).
  color: '#FF2D55',
  textDecoration: 'underline',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  ['&:hover']: {
    opacity: 0.85
  }
}))

const StatusBadge = styled('span', { shouldForwardProp: prop => prop !== '$status' })<{ $status: WalletTransactionStatus }>(
  ({ theme, $status }) => ({
    gridArea: 'status',
    justifySelf: 'end',
    flexShrink: 0,
    padding: theme.spacing(0.25, 1),
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'capitalize',
    color: $status === 'failed' ? '#FF2D55' : $status === 'confirmed' ? '#34CE77' : '#FFA500',
    background:
      $status === 'failed' ? 'rgba(255, 45, 85, 0.12)' : $status === 'confirmed' ? 'rgba(52, 206, 119, 0.12)' : 'rgba(255, 165, 0, 0.12)',
    [theme.breakpoints.up('md')]: {
      justifySelf: 'start'
    }
  })
)

const Amount = styled(Typography)(({ theme }) => ({
  gridArea: 'amount',
  justifySelf: 'end',
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  fontSize: 14,
  fontWeight: 600,
  color: '#FCFCFC',
  whiteSpace: 'nowrap',
  ['& .MuiSvgIcon-root']: {
    fontSize: 16,
    color: '#FF2D55'
  }
}))

export { Amount, ChevronWrap, EmptyState, HashLink, Header, IconChip, List, Row, RowDate, RowType, Section, StatusBadge }
