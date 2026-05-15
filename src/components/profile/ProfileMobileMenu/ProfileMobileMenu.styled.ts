import { Box, Button, Drawer, IconButton, Typography, styled } from 'decentraland-ui2'

const MobileDrawer = styled(Drawer)(({ theme }) => ({
  // Sits above the Dialog backdrop (Dialog z-index = 1300) so the drawer also works inside `ProfileModal`.
  zIndex: theme.zIndex.modal + 1,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiDrawer-paper': {
    width: 320,
    maxWidth: '90vw',
    background: 'radial-gradient(123.58% 82% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
    color: theme.palette.text.primary,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5)
  }
})) as typeof Drawer

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: theme.spacing(1)
}))

const DrawerIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white
}))

const UserBlock = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(1.5)
}))

const UserNameColumn = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
  flex: '1 1 auto'
})

const UserName = styled(Typography)({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 18,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

const UserAddressRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: 'rgba(255, 255, 255, 0.7)'
}))

const UserAddressText = styled(Typography)({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 400,
  fontSize: 12
})

const AddressCopyButton = styled(IconButton)({
  width: 20,
  height: 20,
  color: 'rgba(255, 255, 255, 0.7)',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': {
    fontSize: 12
  }
})

const CtaRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(1),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1)
}))

const DrawerCta = styled(Button)({
  flex: '1 1 0',
  whiteSpace: 'nowrap'
})

const MutualRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  color: theme.palette.text.primary,
  fontFamily: '"Inter", sans-serif',
  fontWeight: 400,
  fontSize: 14
}))

const MutualStack = styled(Box)({
  display: 'flex',
  alignItems: 'center'
})

const MutualSlot = styled('span', { shouldForwardProp: prop => prop !== '$offset' })<{ $offset: number }>(({ $offset }) => ({
  marginLeft: $offset ? -8 : 0,
  flexShrink: 0,
  display: 'inline-flex'
}))

const MutualDot = styled('span', { shouldForwardProp: prop => prop !== '$bg' && prop !== '$offset' })<{ $bg: string; $offset: number }>(
  ({ $bg, $offset }) => ({
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.5)',
    background: $bg,
    marginLeft: $offset ? -8 : 0,
    flexShrink: 0,
    display: 'inline-block'
  })
)

const SectionDivider = styled('div')({
  height: 1,
  background: 'rgba(255, 255, 255, 0.12)',
  margin: 0
})

const TabList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  flex: '1 1 auto'
}))

const TabItem = styled('button', { shouldForwardProp: prop => prop !== '$active' })<{ $active: boolean }>(({ theme, $active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  width: '100%',
  padding: theme.spacing(1.5, 2),
  border: 'none',
  background: $active ? 'rgba(255, 255, 255, 0.10)' : 'transparent',
  color: theme.palette.text.primary,
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 16,
  textTransform: 'uppercase',
  textAlign: 'left',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.06)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:focus-visible': {
    outline: '2px solid rgba(255, 255, 255, 0.6)',
    outlineOffset: 2
  }
}))

const TabLeading = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  color: 'rgba(255, 255, 255, 0.85)'
})

const TabLabel = styled('span')({
  flex: '1 1 auto'
})

const TabChevron = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  color: 'rgba(255, 255, 255, 0.5)'
})

const LogoutButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  width: '100%',
  padding: theme.spacing(1.5, 2),
  border: 'none',
  background: 'transparent',
  color: theme.palette.text.primary,
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 14,
  textTransform: 'uppercase',
  textAlign: 'left',
  borderRadius: 8,
  cursor: 'pointer',
  marginTop: 'auto',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.06)'
  }
}))

export {
  AddressCopyButton,
  CtaRow,
  DrawerCta,
  DrawerHeader,
  DrawerIconButton,
  LogoutButton,
  MobileDrawer,
  MutualDot,
  MutualRow,
  MutualSlot,
  MutualStack,
  SectionDivider,
  TabChevron,
  TabItem,
  TabLabel,
  TabLeading,
  TabList,
  UserAddressRow,
  UserAddressText,
  UserBlock,
  UserName,
  UserNameColumn
}
