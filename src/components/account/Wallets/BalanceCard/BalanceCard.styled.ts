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

const ActionButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.spacing(1),
  border: '1px solid rgba(255, 255, 255, 0.15)',
  background: 'rgba(0, 0, 0, 0.2)',
  color: '#FCFCFC',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'background 0.2s ease, border-color 0.2s ease',
  ['&:hover']: {
    background: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  ['&:focus-visible']: {
    outline: '2px solid rgba(255, 255, 255, 0.6)',
    outlineOffset: 2
  }
}))

export { ActionButton, Actions, BalanceAmount, BalanceInfo, Card, CardTop, NetworkLabel, NetworkRow }
