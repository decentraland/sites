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

// Capped height with an internal scroll so a long history never pushes the card past the viewport;
// extra rows scroll within this box (and load in batches via the Load more button below).
const List = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  paddingBottom: theme.spacing(1),
  maxHeight: 360,
  overflowY: 'auto',
  // Reserve room for the scrollbar so the (overlay) thumb never sits on top of the row amounts.
  paddingRight: theme.spacing(1.5),
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
  ['&::-webkit-scrollbar']: {
    width: 6
  },
  ['&::-webkit-scrollbar-thumb']: {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3
  }
}))

// Pulls the next batch of settled transactions into the scroll area (Figma has no spec for this — it
// matches the muted secondary controls used elsewhere in the account area).
const LoadMoreButton = styled('button')(({ theme }) => ({
  alignSelf: 'center',
  marginTop: theme.spacing(1),
  padding: theme.spacing(0.75, 2),
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: theme.spacing(1),
  background: 'transparent',
  color: '#FCFCFC',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.15s ease',
  ['&:hover']: {
    background: 'rgba(255, 255, 255, 0.08)'
  },
  ['&:focus-visible']: {
    outline: '2px solid rgba(255, 255, 255, 0.6)',
    outlineOffset: 2
  }
}))

const EmptyState = styled(Typography)(({ theme }) => ({
  fontSize: 13,
  color: '#A09BA8',
  padding: theme.spacing(1.5, 0)
}))

// Sub-section label inside the expanded list ("Pending transactions" / "Latest transactions"),
// separating in-flight swaps/withdrawals from the settled history (Figma "Profile-Account" Wallets).
const GroupHeader = styled(Typography)(({ theme }) => ({
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.6,
  textTransform: 'uppercase',
  color: '#A09BA8',
  padding: theme.spacing(1.5, 0, 0.5)
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

// pending: in-page submit lifecycle. bridging: swap/withdraw mined on its origin chain, waiting for
// the destination-chain credit (~20-30 min). checkpoint: withdrawal checkpointed, claimable (shown as
// the claim button, not this badge). confirmed: settled. failed: reverted.
const STATUS_COLOR: Record<WalletTransactionStatus, string> = {
  confirmed: '#34CE77',
  failed: '#FF2D55',
  bridging: '#4A8FE7',
  checkpoint: '#2EE6C5',
  pending: '#FFA500'
}
const STATUS_BACKGROUND: Record<WalletTransactionStatus, string> = {
  confirmed: 'rgba(52, 206, 119, 0.12)',
  failed: 'rgba(255, 45, 85, 0.12)',
  bridging: 'rgba(74, 143, 231, 0.14)',
  checkpoint: 'rgba(46, 230, 197, 0.14)',
  pending: 'rgba(255, 165, 0, 0.12)'
}

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
    color: STATUS_COLOR[$status],
    background: STATUS_BACKGROUND[$status],
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

// Replaces the status badge on a checkpointed withdrawal row: the "claim on Ethereum" (exit) action.
const ClaimButton = styled('button')(({ theme }) => ({
  gridArea: 'status',
  justifySelf: 'end',
  flexShrink: 0,
  padding: theme.spacing(0.5, 1.25),
  border: 'none',
  borderRadius: 6,
  fontFamily: 'inherit',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
  color: '#1B0F2B',
  background: '#2EE6C5',
  transition: 'opacity 0.15s ease',
  ['&:hover']: {
    opacity: 0.85
  },
  ['&:focus-visible']: {
    outline: '2px solid rgba(255, 255, 255, 0.6)',
    outlineOffset: 2
  },
  ['&:disabled']: {
    opacity: 0.6,
    cursor: 'default'
  },
  [theme.breakpoints.up('md')]: {
    justifySelf: 'start'
  }
}))

export {
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
}
