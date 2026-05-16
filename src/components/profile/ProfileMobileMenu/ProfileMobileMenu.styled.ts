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

// Figma 35:26031 — mobile drawer name: Inter SemiBold 24, line 1.6, #fcfcfc
const UserName = styled(Typography)({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 24,
  lineHeight: 1.6,
  color: '#FCFCFC',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

const UserAddressRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: '#FCFCFC'
}))

// Figma 35:26034 — mobile drawer addr: Inter Regular 16, line 1.75, #fcfcfc
const UserAddressText = styled(Typography)({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.75,
  color: '#FCFCFC'
})

// Figma 35:26035 — copy icon 16×16
const AddressCopyButton = styled(IconButton)({
  width: 16,
  height: 16,
  color: '#FCFCFC',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': {
    fontSize: 16
  }
})

// Figma 35:26092 — CTAs row: gap 12, full width
const CtaRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: 12,
  width: '100%',
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1)
}))

// Figma 35:26072 — drawer pill CTA: h40, bg rgba(0,0,0,0.4), radius 12, px12, Inter Regular 16 line 1.75
const DrawerCta = styled(Button)({
  flex: '1 1 0',
  height: 40,
  padding: '0 12px',
  borderRadius: 12,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  color: '#FCFCFC',
  fontFamily: '"Inter", sans-serif',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.75,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.55)'
  }
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

// Figma I322:49249;34:25838;33:25239 — drawer tab item: h44, py8, gap8, radius 12
// Label: Inter Regular 400, 16, line 1.5, #cfcdd4 (NOT uppercase, NOT semibold)
const TabItem = styled('button', { shouldForwardProp: prop => prop !== '$active' })<{ $active: boolean }>(({ $active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  height: 44,
  padding: '8px 0',
  border: 'none',
  background: $active ? 'rgba(255, 255, 255, 0.10)' : 'transparent',
  color: '#CFCDD4',
  fontFamily: '"Inter", sans-serif',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.5,
  textTransform: 'none',
  textAlign: 'left',
  borderRadius: 12,
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

// Figma I322:49249;34:25851 — logout button: px16 py8, gap12, radius 12, Inter Regular 16 line 1.75 #cfcdd4
const LogoutButton = styled('button')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  padding: '8px 16px',
  border: 'none',
  background: 'transparent',
  color: '#CFCDD4',
  fontFamily: '"Inter", sans-serif',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.75,
  textTransform: 'none',
  textAlign: 'left',
  borderRadius: 12,
  cursor: 'pointer',
  marginTop: 'auto',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.06)'
  }
})

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
