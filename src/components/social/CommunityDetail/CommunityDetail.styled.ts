import { Box, Skeleton, styled } from 'decentraland-ui2'

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

// Profile-lookup placeholders shared by the owner row and the member cards: the /v2
// payloads carry addresses only, so a face and a name wait on the Catalyst batch.
// Fills whatever avatar ring it is dropped into.
const AvatarSkeleton = styled(Skeleton)({
  width: '100%',
  height: '100%'
})

// Sized off the body font so the row keeps its height when the name lands; callers
// pass Skeleton's own `width` for the slot they are holding.
const NameSkeleton = styled(Skeleton)(({ theme }) => ({
  fontSize: theme.typography.body1.fontSize
}))

export {
  AvatarSkeleton,
  BottomSection,
  ContentContainer,
  EventsColumn,
  HiddenStatus,
  InitialLoader,
  MembersColumn,
  NameSkeleton,
  PageContainer
}
