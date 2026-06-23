import { Box, styled } from 'decentraland-ui2'

const ContentContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  width: '100%'
})

// Same lateral cap as InfoSection — legacy account-dapp page padding
// (240px lateral on xl, 80px on lg-xl) collapses Members + Events columns
// inside the Paper. Keep a modest 24/32px inset so columns get the room.
const BottomSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(4),
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(2),
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    gap: theme.spacing(5),
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4)
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: theme.spacing(4)
  },
  [theme.breakpoints.down('xs')]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  }
}))

const BottomSectionColumn = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  minWidth: 0,
  [theme.breakpoints.down('sm')]: { width: '100%', flex: 'none' }
}))

const MembersColumn = styled(BottomSectionColumn)(({ theme }) => ({
  flex: '0 0 320px',
  maxWidth: '320px',
  [theme.breakpoints.down('sm')]: { maxWidth: '100%' }
}))

const EventsColumn = styled(BottomSectionColumn)({
  flex: '2 0 0'
})

const HiddenStatus = styled(Box)({
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1
})

const InitialLoader = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '400px'
})

const PageContainer = styled(Box)(({ theme }) => ({
  paddingTop: 64,
  [theme.breakpoints.up('md')]: { paddingTop: 96 }
}))

export { BottomSection, ContentContainer, EventsColumn, HiddenStatus, InitialLoader, MembersColumn, PageContainer }
