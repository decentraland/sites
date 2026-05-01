import { Box, Chip, Typography, styled } from 'decentraland-ui2'

interface ContainerProps {
  isFirst: boolean
}

/* eslint-disable @typescript-eslint/naming-convention */
const UserMetadataContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'isFirst'
})<ContainerProps>(({ isFirst }) => ({
  marginLeft: 24,
  marginRight: 'auto',
  width: 'calc(561px - 48px)',
  borderTop: isFirst ? 'none' : '1px solid #716b7c',
  '@media (max-width: 991px)': {
    width: 'calc(100% - 48px)',
    marginRight: 24
  },
  '@media (max-width: 767px)': {
    width: 'calc(100% - 42px)',
    marginLeft: 16,
    marginRight: 26
  }
}))

const UserMetadataRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  height: 86,
  paddingTop: 20,
  paddingBottom: 20,
  color: '#fcfcfc'
})

const UserMetadataWrapper = styled(Box)({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  lineHeight: '46px',
  height: 46
})

const UserAvatar = styled('img')({
  width: 46,
  height: 46,
  borderRadius: '50%',
  flexShrink: 0,
  objectFit: 'cover',
  background: '#716b7c'
})

const UserAvatarFallback = styled(Box)({
  width: 46,
  height: 46,
  borderRadius: '50%',
  flexShrink: 0,
  background: 'linear-gradient(243.96deg, #FF2D55 -11.67%, #FFBC5B 88.23%)'
})

const UserName = styled('a')({
  color: '#fcfcfc',
  fontSize: 16,
  fontWeight: 600,
  marginLeft: 10,
  textDecoration: 'none',
  '&:hover': { textDecoration: 'underline' }
})

const UserNameStatic = styled('span')({
  color: '#fcfcfc',
  fontSize: 16,
  fontWeight: 600,
  marginLeft: 10
})

const GuestBadge = styled(Chip)({
  borderRadius: 34,
  background: '#716b7c',
  marginLeft: 7,
  padding: '2px 8px',
  height: 'auto',
  '& .MuiChip-label': {
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '18px',
    textTransform: 'uppercase',
    padding: 0
  }
})

const ChevronButton = styled(Box)({
  cursor: 'pointer',
  padding: 16,
  marginRight: -16,
  marginTop: -8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

interface WearableContainerProps {
  visible: boolean
}

const WearablesPanel = styled(Box, {
  shouldForwardProp: prop => prop !== 'visible'
})<WearableContainerProps>(({ visible }) => ({
  display: 'flex',
  flexDirection: 'column',
  marginTop: 10,
  transition: 'opacity 1s',
  overflow: 'hidden',
  opacity: visible ? 1 : 0,
  height: visible ? 'auto' : 0
}))

const WearablesTitle = styled(Typography)({
  color: '#fcfcfc',
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  marginTop: 10,
  marginBottom: 20
})

const NoWearablesBox = styled(Box)({
  width: 288,
  height: 101,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'center',
  margin: 'auto',
  '& img': { width: 24, height: 22, flexShrink: 0 }
})

const NoWearablesText = styled(Typography)({
  color: '#cfcdd4',
  textAlign: 'center',
  fontSize: 16,
  fontWeight: 400,
  marginTop: 12
})
/* eslint-enable @typescript-eslint/naming-convention */

export {
  ChevronButton,
  GuestBadge,
  NoWearablesBox,
  NoWearablesText,
  UserAvatar,
  UserAvatarFallback,
  UserMetadataContainer,
  UserMetadataRow,
  UserMetadataWrapper,
  UserName,
  UserNameStatic,
  WearablesPanel,
  WearablesTitle
}
