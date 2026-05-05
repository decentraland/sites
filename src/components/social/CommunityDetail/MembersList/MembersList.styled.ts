import { Avatar, Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { hexToRgba } from '../../../../utils/colors'

// `caff73` (lime green) is the source dapp's brand accent for member names; not in
// dclColors. Named here so consumers know it's intentional, not a forgotten hex.
const MEMBER_NAME_ACCENT = '#caff73'

const MembersSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: theme.spacing(1.5),
  width: '100%'
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: dclColors.neutral.softWhite,
  paddingBottom: theme.spacing(3),
  borderBottom: `1px solid ${hexToRgba(dclColors.neutral.white, 0.3)}`,
  lineHeight: 1,
  width: '100%'
}))

const MemberListContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing(1.25),
  width: '100%',
  maxHeight: '350px',
  overflowY: 'auto',
  overflowX: 'hidden',
  scrollBehavior: 'smooth',
  paddingRight: theme.spacing(1),
  ['&::-webkit-scrollbar']: { width: '8px' },
  ['&::-webkit-scrollbar-track']: {
    background: dclColors.whiteTransparent.subtle,
    borderRadius: theme.spacing(0.5)
  },
  ['&::-webkit-scrollbar-thumb']: {
    background: hexToRgba(dclColors.neutral.white, 0.3),
    borderRadius: theme.spacing(0.5)
  },
  [theme.breakpoints.between('xs', 'sm')]: {
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'
  }
}))

const MemberItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.25),
  padding: theme.spacing(1.25),
  backgroundColor: hexToRgba(dclColors.neutral.black, 0.3),
  borderRadius: theme.spacing(1.5),
  width: '100%',
  boxSizing: 'border-box'
}))

const MemberAvatarContainer = styled(Box)({
  position: 'relative',
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  border: `3px solid ${hexToRgba(dclColors.neutral.white, 0.5)}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  overflow: 'hidden'
})

const MemberAvatar = styled(Avatar, {
  shouldForwardProp: prop => prop !== 'backgroundColor'
})<{ backgroundColor?: string }>(({ backgroundColor, theme }) => ({
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  backgroundColor: backgroundColor ?? theme.palette.secondary.main
}))

const MemberInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  gap: theme.spacing(0.25),
  minWidth: 0,
  width: '100%'
}))

const MemberNameRow = styled(Box)({
  display: 'flex',
  alignItems: 'center'
})

const MemberName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 600,
  lineHeight: 'normal',
  color: MEMBER_NAME_ACCENT,
  textTransform: 'capitalize',
  fontFamily: theme.typography.fontFamily
}))

const MemberRole = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  backgroundColor: dclColors.whiteTransparent.subtle,
  borderRadius: theme.spacing(0.75),
  padding: theme.spacing(0.625, 0.5),
  width: 'fit-content',
  fontSize: theme.typography.caption.fontSize,
  fontWeight: 400,
  lineHeight: 'normal',
  color: dclColors.neutral.softWhite,
  fontFamily: theme.typography.fontFamily,
  textTransform: 'capitalize'
}))

const LoadMoreSentinel = styled(Box)(({ theme }) => ({
  width: '100%',
  minHeight: theme.spacing(2.5)
}))

const SentinelLoader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(2)
}))

const InitialLoader = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '200px',
  width: '100%'
})

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
  width: '100%'
}))

export {
  EmptyState,
  InitialLoader,
  LoadMoreSentinel,
  MemberAvatar,
  MemberAvatarContainer,
  MemberInfo,
  MemberItem,
  MemberListContainer,
  MemberName,
  MemberNameRow,
  MemberRole,
  MembersSection,
  SectionTitle,
  SentinelLoader
}
