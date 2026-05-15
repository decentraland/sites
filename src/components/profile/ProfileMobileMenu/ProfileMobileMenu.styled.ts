import { Box, Drawer, IconButton, Typography, styled } from 'decentraland-ui2'

const MobileDrawer = styled(Drawer)(({ theme }) => ({
  // Sits above the Dialog backdrop (Dialog z-index = 1300) so the drawer also works inside `ProfileModal`.
  zIndex: theme.zIndex.modal + 1,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiDrawer-paper': {
    width: 280,
    maxWidth: '85vw',
    background: 'radial-gradient(123.58% 82% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
    color: theme.palette.text.primary,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2)
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
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(2, 0)
}))

const UserName = styled(Typography)({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 16,
  textAlign: 'center'
})

const UserAddress = styled(Typography)({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 400,
  fontSize: 12,
  color: 'rgba(255, 255, 255, 0.6)'
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
  justifyContent: 'space-between',
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

const TabChevron = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  color: 'rgba(255, 255, 255, 0.5)'
})

export { DrawerHeader, DrawerIconButton, MobileDrawer, TabChevron, TabItem, TabList, UserAddress, UserBlock, UserName }
