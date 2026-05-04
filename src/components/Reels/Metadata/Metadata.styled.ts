import { Box, Typography, styled } from 'decentraland-ui2'

const MetadataContainer = styled(Box)(({ theme }) => ({
  width: 571,
  height: '100vh',
  backgroundColor: '#43404a',
  position: 'absolute',
  top: 0,
  right: 0,
  zIndex: 0,
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('lg')]: {
    position: 'relative',
    width: '100vw',
    height: 'auto',
    overflow: 'hidden',
    transition: 'height 0.35s'
  }
}))

const LogoHeader = styled(Box)(({ theme }) => ({
  minHeight: 56,
  background: '#3d3b43',
  display: 'flex',
  alignItems: 'center',
  [theme.breakpoints.down('lg')]: {
    display: 'none'
  }
}))

const ContentWrapper = styled(Box)(({ theme }) => ({
  marginTop: 32,
  marginLeft: 24,
  color: '#fcfcfc',
  width: 'calc(561px - 48px)',
  [theme.breakpoints.down('lg')]: {
    marginLeft: 24,
    marginRight: 24,
    width: 'calc(100% - 48px)'
  },
  [theme.breakpoints.down('md')]: {
    marginLeft: 16,
    marginRight: 26,
    width: 'calc(100% - 42px)'
  }
}))

const SectionTitle = styled(Typography)({
  color: '#fcfcfc',
  fontSize: 16,
  fontWeight: 600,
  textTransform: 'uppercase',
  marginTop: 0,
  marginBottom: 7.5
})

const PeopleTitle = styled(SectionTitle)(({ theme }) => ({
  paddingBottom: 20,
  marginLeft: 24,
  [theme.breakpoints.down('md')]: { marginLeft: 16 }
}))

const DateLine = styled(Box)({
  marginBottom: 16,
  fontSize: 16
})

const UserLine = styled(Box)({
  marginBottom: 16,
  display: 'flex',
  alignItems: 'center'
})

const UserAvatar = styled('img')({
  width: 24,
  height: 24,
  borderRadius: '50%',
  marginLeft: 12
})

const UserNameLink = styled('a')({
  color: '#fcfcfc',
  textDecoration: 'none',
  marginLeft: 8,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': { textDecoration: 'underline' }
})

const PlaceLine = styled(Box)({
  position: 'relative',
  fontSize: 16,
  display: 'flex',
  height: 34,
  alignItems: 'center',
  justifyContent: 'space-between'
})

const PlaceLeftSide = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8
})

const PlaceLink = styled('a')({
  color: '#fcfcfc',
  textDecoration: 'none',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': { textDecoration: 'underline' }
})

const PlaceText = styled('span')({
  color: '#fcfcfc'
})

const JumpInButton = styled('a')(({ theme }) => ({
  padding: '8px 16.5px',
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: 6,
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 14,
  textTransform: 'uppercase',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'background 0.2s',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    background: theme.palette.primary.dark
  }
}))

const Divider = styled(Box)({
  width: '100%',
  marginTop: 24,
  marginBottom: 20,
  borderBottom: '1px solid #a09ba8'
})

const PeopleContainer = styled(Box)({
  overflowY: 'auto',
  overflowX: 'hidden'
})

export {
  ContentWrapper,
  DateLine,
  Divider,
  JumpInButton,
  LogoHeader,
  MetadataContainer,
  PeopleContainer,
  PeopleTitle,
  PlaceLeftSide,
  PlaceLine,
  PlaceLink,
  PlaceText,
  SectionTitle,
  UserAvatar,
  UserLine,
  UserNameLink
}
