import { useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
import { CircularProgress, IconButton } from 'decentraland-ui2'
import { useFriendsList } from '../../../features/profile/profile.social.rpc'
import type { FriendProfile } from '../../../features/profile/profile.social.rpc'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { ProfileAvatar } from '../ProfileAvatar'
import {
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
} from './FriendsModal.styled'

interface FriendsModalProps {
  open: boolean
  onClose: () => void
  /** Called when the user picks a friend — typically navigates to their profile. */
  onSelect: (friend: FriendProfile) => void
}

function truncateAddress(value: string): string {
  if (value.length < 12) return value
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

function FriendsModal({ open, onClose, onSelect }: FriendsModalProps) {
  const t = useFormatMessage()
  const { friends, total, isLoading } = useFriendsList(open)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return friends
    return friends.filter(friend => friend.name?.toLowerCase().includes(needle) || friend.address.toLowerCase().includes(needle))
  }, [friends, query])

  return (
    <FriendsDialog open={open} onClose={onClose} aria-labelledby="friends-modal-title">
      <DialogHeader>
        <DialogTitle id="friends-modal-title">{t('profile.friends_modal.title', { count: total ?? friends.length })}</DialogTitle>
        <IconButton aria-label={t('profile.friends_modal.close')} onClick={onClose} sx={{ color: 'common.white' }}>
          <CloseIcon />
        </IconButton>
      </DialogHeader>
      <SearchField
        placeholder={t('profile.friends_modal.search_placeholder')}
        value={query}
        onChange={event => setQuery(event.target.value)}
        size="small"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18 }} />
              </InputAdornment>
            )
          }
        }}
      />
      {isLoading && friends.length === 0 ? (
        <LoadingState>
          <CircularProgress size={24} />
        </LoadingState>
      ) : filtered.length === 0 ? (
        <EmptyState>{query ? t('profile.friends_modal.no_results') : t('profile.friends_modal.empty')}</EmptyState>
      ) : (
        <FriendList>
          {filtered.map(friend => (
            <FriendRow key={friend.address} type="button" onClick={() => onSelect(friend)}>
              <ProfileAvatar address={friend.address} size={40} />
              <FriendNameBlock>
                <FriendName>{friend.name || truncateAddress(friend.address)}</FriendName>
                <FriendAddress>{truncateAddress(friend.address)}</FriendAddress>
              </FriendNameBlock>
            </FriendRow>
          ))}
        </FriendList>
      )}
    </FriendsDialog>
  )
}

export { FriendsModal }
export type { FriendsModalProps }
