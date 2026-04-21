import { Box, styled } from 'decentraland-ui2'
import { AttendeesBadge, CardCreator, CardDate, CardLocation, CreatorAvatar, UserProfileLink } from '../Card/Card.styled'

const MobileCardContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  background: 'linear-gradient(96.05deg, #2E013E 36.2%, #7F0D59 100.69%)',
  paddingBottom: 25
})

const MobileTopSection = styled(Box)({
  position: 'relative',
  width: '100%',
  height: 250,
  overflow: 'hidden'
})

const MobileMiddleSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  padding: '32px 24px 0px 24px'
})

const MobileStickyBottomContainer = styled(Box)({
  position: 'fixed',
  bottom: -1,
  left: 0,
  right: 0,
  minHeight: 115,
  padding: '32px 24px',
  background: 'linear-gradient(100.12deg, #130119 0%, #320524 100%)',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'row',
  gap: 12,
  backdropFilter: 'blur(8px)',
  boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.2)'
})

const MobileAttendeesBadge = styled(AttendeesBadge)({
  padding: '6px 12px',
  borderRadius: 6,
  gap: 6,
  fontSize: 12
})

const MobileCardContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 12
})

const MobileCardTitle = styled('h1')({
  fontSize: 28,
  fontWeight: 600,
  margin: 0,
  color: '#ffffff',
  lineHeight: 1.2,
  marginBottom: 16
})

const MobileCardCreator = styled(CardCreator)({
  gap: 6,
  fontSize: 16,
  marginBottom: 16
})

const MobileCardDate = styled(CardDate)({
  gap: 6,
  fontSize: 14,
  lineHeight: 1.5,
  borderRadius: 6
})

const MobileCardLocation = styled(CardLocation)({
  gap: 6,
  fontSize: 14,
  lineHeight: 1.5,
  borderRadius: 6
})

const MobileCreatorAvatar = styled(CreatorAvatar)({
  width: 24,
  height: 24,
  borderRadius: '50%',
  borderWidth: 1.5
})

const MobileUserProfileLink = styled(UserProfileLink)({
  fontSize: 16
})

export {
  MobileAttendeesBadge,
  MobileCardContainer,
  MobileCardContent,
  MobileCardCreator,
  MobileCardDate,
  MobileCardLocation,
  MobileCardTitle,
  MobileCreatorAvatar,
  MobileMiddleSection,
  MobileStickyBottomContainer,
  MobileTopSection,
  MobileUserProfileLink
}
