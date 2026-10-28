// eslint-disable-next-line @typescript-eslint/naming-convention
import SearchIcon from '@mui/icons-material/Search'
import { Box, Dialog, IconButton, InputAdornment, TextField, Typography, styled } from 'decentraland-ui2'

const FriendsDialog = styled(Dialog)(({ theme }) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiDialog-paper': {
    width: '100%',
    maxWidth: 520,
    minHeight: 480,
    maxHeight: '80vh',
    // Near-opaque surface — the 0.6-alpha version let the page bleed through and hurt readability.
    background: 'radial-gradient(140% 100% at 0% 0%, rgba(116, 52, 177, 0.92) 0%, rgba(43, 16, 64, 0.98) 60%, #1a0b29 100%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    color: theme.palette.common.white,
    overflow: 'hidden',
    // Full-screen list on phones (Figma 254:58965 "Friends Modal Mobile").
    [theme.breakpoints.down('sm')]: {
      maxWidth: '100%',
      maxHeight: '100%',
      height: '100%',
      margin: 0,
      borderRadius: 0,
      border: 'none'
    }
  }
}))

// Back chevron used when the list renders as a modal-stack surface (not a dialog).
const BackIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
  marginRight: theme.spacing(0.5)
}))

// Container for the in-modal surface flavour: same column layout the dialog Paper
// provides, sized by the host Paper ('friends' variant).
const FriendsSurfaceRoot = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minHeight: 0,
  width: '100%'
})

const DialogHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
}))

const DialogTitle = styled(Typography)({
  fontWeight: 600,
  fontSize: 18,
  letterSpacing: 0.2
})

const SearchField = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(2, 3, 1),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiOutlinedInput-root': {
    background: 'rgba(0, 0, 0, 0.25)',
    color: theme.palette.common.white,
    borderRadius: 999
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.12)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.24)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.4)'
  }
}))

const FriendList = styled(Box)(({ theme }) => ({
  flex: '1 1 auto',
  overflowY: 'auto',
  padding: theme.spacing(1, 1, 3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5)
}))

const FriendRow = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1, 2),
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderRadius: 12,
  color: theme.palette.common.white,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background-color 160ms ease',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover, &:focus-visible': {
    background: 'rgba(255, 255, 255, 0.08)',
    outline: 'none'
  },
  // Touch feedback on mobile (no hover there).
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:active': {
    background: 'rgba(255, 255, 255, 0.12)'
  }
}))

const FriendNameBlock = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  flex: '1 1 auto'
})

const FriendName = styled(Typography)({
  fontWeight: 600,
  fontSize: 14,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

const FriendAddress = styled(Typography)({
  fontSize: 12,
  opacity: 0.6,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '1 1 auto',
  padding: theme.spacing(6),
  textAlign: 'center',
  color: 'rgba(255, 255, 255, 0.6)'
}))

const LoadingState = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '1 1 auto',
  padding: 48
})

export {
  BackIconButton,
  DialogHeader,
  DialogTitle,
  EmptyState,
  FriendAddress,
  FriendList,
  FriendName,
  FriendNameBlock,
  FriendRow,
  FriendsDialog,
  FriendsSurfaceRoot,
  InputAdornment,
  LoadingState,
  SearchField,
  SearchIcon
}
