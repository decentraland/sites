import { Box, IconButton, Typography, styled } from 'decentraland-ui2'

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

const NameText = styled(Typography, {
  shouldForwardProp: prop => prop !== '$nameColor'
})<{ $nameColor: string }>(({ $nameColor, theme }) => ({
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

const AddressText = styled(Typography)(({ theme }) => ({
  fontWeight: 400,
  fontSize: 14,
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

const MutualFriendsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  color: '#ECEBED'
}))

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
const MutualText = styled(Typography)(({ theme }) => ({
  fontWeight: 400,
  fontSize: 16,
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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': {
    fontSize: 14
  }
})

const MoreActionsButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white
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
