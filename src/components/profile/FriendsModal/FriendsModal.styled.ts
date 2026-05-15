// eslint-disable-next-line @typescript-eslint/naming-convention
import SearchIcon from '@mui/icons-material/Search'
import { Box, Dialog, InputAdornment, TextField, Typography, styled } from 'decentraland-ui2'

const FriendsDialog = styled(Dialog)(({ theme }) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiDialog-paper': {
    width: '100%',
    maxWidth: 520,
    minHeight: 480,
    maxHeight: '80vh',
    background: 'radial-gradient(140% 100% at 0% 0%, rgba(116, 52, 177, 0.6) 0%, rgba(43, 16, 64, 0.95) 60%, #1a0b29 100%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    color: theme.palette.common.white,
    overflow: 'hidden'
  }
}))

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
    background: 'rgba(255, 255, 255, 0.06)',
    outline: 'none'
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
  DialogHeader,
  DialogTitle,
  EmptyState,
  FriendAddress,
  FriendList,
  FriendName,
  FriendNameBlock,
  FriendRow,
  FriendsDialog,
  InputAdornment,
  LoadingState,
  SearchField,
  SearchIcon
}
