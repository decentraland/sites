import { Box, Typography, styled } from 'decentraland-ui2'

const Card = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(1.5),
  background: 'rgba(0, 0, 0, 0.2)'
}))

// Top row: balance on the left, actions on the right (md+); stacked on mobile. The transactions
// section renders full-width below this row.
const CardTop = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  }
}))

const BalanceInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5)
}))

const NetworkRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const NetworkLabel = styled(Typography)(() => ({
  fontSize: 14,
  color: '#A09BA8'
}))

// Balance amount with the MANA diamond mark to its left (Figma). The mark is colored/sized here so
// the shared ManaMarkIcon stays presentation-agnostic.
const BalanceRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  ['& .MuiSvgIcon-root']: {
    fontSize: 30,
    color: '#FF2D55'
  }
}))

const BalanceAmount = styled(Typography)(() => ({
  fontSize: 32,
  fontWeight: 700,
  lineHeight: 1.2,
  color: '#FCFCFC'
}))

const Actions = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1)
}))

// Solid dark pills with uppercase labels (Figma) — BUY / SWAP / SEND / RECEIVE.
const ActionButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(1),
  border: 'none',
  background: 'rgba(0, 0, 0, 0.4)',
  color: '#FCFCFC',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  ['& .MuiSvgIcon-root']: {
    fontSize: 16
  },
  ['&:hover']: {
    background: 'rgba(0, 0, 0, 0.6)'
  },
  ['&:focus-visible']: {
    outline: '2px solid rgba(255, 255, 255, 0.6)',
    outlineOffset: 2
  }
}))

export { ActionButton, Actions, BalanceAmount, BalanceInfo, BalanceRow, Card, CardTop, NetworkLabel, NetworkRow }
