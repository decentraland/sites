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

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5)
}))

const Title = styled(Typography)(() => ({
  fontWeight: 700,
  color: '#FCFCFC'
}))

const Subtitle = styled(Typography)(() => ({
  fontSize: 14,
  color: '#A09BA8'
}))

const GroupsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing(1.5),
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: '1fr 1fr'
  }
}))

const StateMessage = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  color: '#A09BA8',
  padding: theme.spacing(2, 0)
}))

export { GroupsGrid, Header, NotificationsPanel, StateMessage, Subtitle, Title }
