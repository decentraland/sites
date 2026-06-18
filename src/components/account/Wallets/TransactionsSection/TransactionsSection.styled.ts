import { Box, Link, Typography, styled } from 'decentraland-ui2'
import type { WalletTransactionStatus } from '../../../../hooks/useWalletTransactions.types'

// Transactions section inside each balance card (Figma 322:101467): a collapsible "Transactions"
// header that expands to the tracked tx rows. Hardcoded DCL hexes match the sibling wallet styles.
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

const Row = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1, 0),
  ['& + &']: {
    borderTop: '1px solid rgba(255, 255, 255, 0.04)'
  }
}))

const TypeIcon = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: '#A09BA8',
  ['& .MuiSvgIcon-root']: {
    fontSize: 18
  }
}))

const RowMain = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  flexShrink: 0,
  width: 96
}))

const RowType = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 500,
  color: '#FCFCFC'
}))

const RowDate = styled(Typography)(() => ({
  fontSize: 11,
  color: '#A09BA8',
  whiteSpace: 'nowrap'
}))

const HashLink = styled(Link)(() => ({
  flex: 1,
  minWidth: 0,
  fontSize: 12,
  // DCL accent red for the explorer link (Figma).
  color: '#FF2D55',
  textDecoration: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  ['&:hover']: {
    textDecoration: 'underline'
  }
}))

const StatusBadge = styled('span', { shouldForwardProp: prop => prop !== '$status' })<{ $status: WalletTransactionStatus }>(
  ({ theme, $status }) => ({
    flexShrink: 0,
    padding: theme.spacing(0.25, 1),
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'capitalize',
    color: $status === 'failed' ? '#FF2D55' : $status === 'confirmed' ? '#34CE77' : '#FFA500',
    background:
      $status === 'failed' ? 'rgba(255, 45, 85, 0.12)' : $status === 'confirmed' ? 'rgba(52, 206, 119, 0.12)' : 'rgba(255, 165, 0, 0.12)'
  })
)

const Amount = styled(Typography)(({ theme }) => ({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  fontSize: 13,
  fontWeight: 600,
  color: '#FCFCFC',
  whiteSpace: 'nowrap'
}))

export { Amount, ChevronWrap, EmptyState, HashLink, Header, List, Row, RowDate, RowMain, RowType, Section, StatusBadge, TypeIcon }
