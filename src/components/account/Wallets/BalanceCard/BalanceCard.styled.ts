import { Box, IconButton, MenuItem, Typography, styled } from 'decentraland-ui2'

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

// Wraps the decentraland-ui2 <Mana> balance. Mana renders as a ButtonBase and doesn't accept `sx`,
// so the bold weight (Figma) is set here and inherited by the amount text.
const BalanceRow = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  fontWeight: 700
}))

const Actions = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1)
}))

// Shared across ActionButton and MoreActionsButton (Figma pill/kebab surface).
const ACTION_PILL_COLOR = '#FCFCFC'
const ACTION_PILL_BACKGROUND = 'rgba(0, 0, 0, 0.4)'
const ACTION_PILL_BACKGROUND_HOVER = 'rgba(0, 0, 0, 0.6)'
const ACTION_PILL_FOCUS_OUTLINE = '2px solid rgba(255, 255, 255, 0.6)'

interface ActionButtonStyleProps {
  // Send/Receive collapse into the kebab menu below the desktop breakpoint (Figma mobile spec,
  // issue #640) — only Buy/Swap stay as standalone pills on mobile/tablet.
  $desktopOnly?: boolean
}

// Solid dark pills with uppercase labels (Figma) — BUY / SWAP always visible, SEND / RECEIVE
// visible as standalone pills from the desktop breakpoint up (see MoreActionsButton below md).
const ActionButton = styled('button', {
  shouldForwardProp: prop => prop !== '$desktopOnly'
})<ActionButtonStyleProps>(({ theme, $desktopOnly }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(1),
  border: 'none',
  background: ACTION_PILL_BACKGROUND,
  color: ACTION_PILL_COLOR,
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
    background: ACTION_PILL_BACKGROUND_HOVER
  },
  ['&:focus-visible']: {
    outline: ACTION_PILL_FOCUS_OUTLINE,
    outlineOffset: 2
  },
  ...($desktopOnly
    ? {
        display: 'none',
        [theme.breakpoints.up('md')]: {
          display: 'flex'
        }
      }
    : {})
}))

// Kebab trigger that exposes Send/Receive on mobile/tablet; hidden once ActionButton's desktop-only
// pills take over at the same breakpoint (Figma mobile spec, issue #640).
const MoreActionsButton = styled(IconButton)(({ theme }) => ({
  display: 'inline-flex',
  padding: theme.spacing(1),
  borderRadius: theme.spacing(1),
  background: ACTION_PILL_BACKGROUND,
  color: ACTION_PILL_COLOR,
  ['& .MuiSvgIcon-root']: {
    fontSize: 16
  },
  ['&:hover']: {
    background: ACTION_PILL_BACKGROUND_HOVER
  },
  ['&:focus-visible']: {
    outline: ACTION_PILL_FOCUS_OUTLINE,
    outlineOffset: 2
  },
  [theme.breakpoints.up('md')]: {
    display: 'none'
  }
}))

const MoreMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  ['& .MuiSvgIcon-root']: {
    fontSize: 16
  }
}))

export { ActionButton, Actions, BalanceInfo, BalanceRow, Card, CardTop, MoreActionsButton, MoreMenuItem, NetworkLabel, NetworkRow }
