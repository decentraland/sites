import { Box, Typography, styled } from 'decentraland-ui2'

// Figma 522:122213 — Notifications section. The whole section sits on the rgba(0,0,0,0.2) panel
// (the "#00000033" design token) used by the sibling account sections; text #FCFCFC, muted
// #A09BA8.

const NotificationsPanel = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  width: '100%',
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  background: 'rgba(0, 0, 0, 0.2)',
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3)
  }
}))

// Two independent columns (Figma masonry): on md+ they sit side by side and each flows on its own,
// so expanding an accordion grows only its column. `alignItems: flex-start` keeps each column at
// its natural height instead of stretching to the tallest one. Below md they stack into one column.
const GroupsColumns = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  }
}))

const GroupsColumn = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  flex: 1,
  minWidth: 0
}))

const StateMessage = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  color: '#A09BA8',
  padding: theme.spacing(2, 0)
}))

export { GroupsColumn, GroupsColumns, NotificationsPanel, StateMessage }
