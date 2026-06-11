import { Box, Button, IconButton, Typography, styled } from 'decentraland-ui2'

const HeaderRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  width: '100%',
  padding: theme.spacing(2, 3),
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: theme.spacing(2),
    gap: theme.spacing(1.5)
  }
}))

const IdentityBlock = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flex: '1 1 auto',
  minWidth: 0
}))

const NameAddressBlock = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
  minWidth: 0
}))

const NameRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5)
}))

// Figma 248:57059 — name typography: Inter Medium 500, 24px, line-height 1.334
const NameText = styled(Typography, {
  shouldForwardProp: prop => prop !== '$nameColor'
})<{ $nameColor: string }>(({ $nameColor, theme }) => ({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 500,
  fontSize: 24,
  lineHeight: 1.334,
  color: $nameColor,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '20ch',
  [theme.breakpoints.down('md')]: {
    fontSize: 18
  }
}))

const Discriminator = styled('span')(({ theme }) => ({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 500,
  fontSize: 24,
  lineHeight: 1.334,
  color: theme.palette.text.secondary,
  [theme.breakpoints.down('md')]: {
    fontSize: 18
  }
}))

const VerifiedBadge = styled('span', {
  shouldForwardProp: prop => prop !== '$nameColor'
})<{ $nameColor: string }>(({ $nameColor }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  borderRadius: '50%',
  backgroundColor: $nameColor,
  color: '#0F0E11',
  fontSize: 10,
  fontWeight: 700,
  flexShrink: 0
}))

const Divider = styled('span')(({ theme }) => ({
  width: 1,
  height: 16,
  backgroundColor: theme.palette.divider,
  display: 'inline-block'
}))

const AddressRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  color: theme.palette.text.secondary
}))

// Figma 248:57090 — address: Inter Regular 16, line-height 1.75
const AddressText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.75,
  color: theme.palette.text.primary
}))

const ActionsBlock = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexShrink: 0,
  [theme.breakpoints.down('md')]: {
    width: '100%',
    justifyContent: 'flex-start',
    flexWrap: 'wrap'
  }
}))

// Rendered as a <button> (Figma note 677:58358: "Mutual friends should be clickable") —
// clicking opens the mutual-friends modal. Carries its own reset + interactive states.
/* eslint-disable @typescript-eslint/naming-convention */
const MutualFriendsRow = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  color: '#ECEBED',
  background: 'none',
  border: 'none',
  padding: theme.spacing(0.5, 1),
  marginLeft: -theme.spacing(1),
  borderRadius: 8,
  font: 'inherit',
  cursor: 'pointer',
  transition: 'background-color 150ms ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  '&:focus-visible': {
    outline: '2px solid rgba(252, 252, 252, 0.6)',
    outlineOffset: 2
  },
  '&:active': {
    backgroundColor: 'rgba(255, 255, 255, 0.14)'
  },
  '&:disabled': {
    cursor: 'default',
    backgroundColor: 'transparent'
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

const MutualStack = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center'
})

const MutualPic = styled('span', {
  shouldForwardProp: prop => prop !== '$bg' && prop !== '$offset'
})<{ $bg: string; $offset: number }>(({ $bg, $offset }) => ({
  width: 28,
  height: 28,
  borderRadius: '50%',
  border: '2px solid rgba(255, 255, 255, 0.5)',
  background: $bg,
  marginLeft: $offset ? -8 : 0,
  flexShrink: 0,
  display: 'inline-block'
}))

const MutualAvatarSlot = styled('span', { shouldForwardProp: prop => prop !== '$offset' })<{ $offset: number }>(({ $offset }) => ({
  marginLeft: $offset ? -8 : 0,
  flexShrink: 0,
  display: 'inline-flex'
}))

/* eslint-disable @typescript-eslint/naming-convention */
// Figma 248:57036 — mutual: Inter Regular 16, count uses SemiBold 600, line-height 1
const MutualText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1,
  color: theme.palette.text.primary,
  '& strong': { fontWeight: 600 }
}))
/* eslint-enable @typescript-eslint/naming-convention */

const CloseIconButton = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  color: theme.palette.text.primary
}))

const MobileMenuIconButton = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  color: theme.palette.text.primary,
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'inline-flex'
  }
}))

const BackIconButton = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  color: theme.palette.text.primary,
  marginRight: theme.spacing(1)
}))

const CopyButton = styled(IconButton)(({ theme }) => ({
  width: 24,
  height: 24,
  color: theme.palette.text.secondary
}))

const WalletIcon = styled(Box)({
  display: 'inline-flex',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': {
    fontSize: 18
  }
})

const CopyButtonIcon = styled(Box)({
  display: 'inline-flex',
  // Figma 254:59241 — copy icon glyph 16×16
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': {
    fontSize: 16
  }
})

const MoreActionsButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white
}))

// Figma FriendCta 248:57656 — 180×40, padding 9/35, radius 10, bg #ff2d55, label Inter SemiBold 14 / tracking 0.4 / line 24 / uppercase
const FriendCtaButton = styled(Button)(({ theme }) => ({
  width: 180,
  height: 40,
  padding: '9px 35px',
  borderRadius: 10,
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 14,
  letterSpacing: '0.4px',
  lineHeight: '24px',
  textTransform: 'uppercase',
  [theme.breakpoints.down('md')]: {
    width: 'auto',
    minWidth: 140
  }
}))

const BlockMenuItemIcon = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  marginRight: theme.spacing(1)
}))

export {
  ActionsBlock,
  AddressRow,
  AddressText,
  BackIconButton,
  BlockMenuItemIcon,
  CloseIconButton,
  CopyButton,
  CopyButtonIcon,
  Discriminator,
  Divider,
  FriendCtaButton,
  HeaderRoot,
  IdentityBlock,
  MobileMenuIconButton,
  MoreActionsButton,
  MutualAvatarSlot,
  MutualFriendsRow,
  MutualPic,
  MutualStack,
  MutualText,
  NameAddressBlock,
  NameRow,
  NameText,
  VerifiedBadge,
  WalletIcon
}
