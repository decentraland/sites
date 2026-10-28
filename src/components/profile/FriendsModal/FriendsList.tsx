import { useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
import { CircularProgress, IconButton } from 'decentraland-ui2'
import { useFriendsList, useMutualFriendsList } from '../../../features/profile/profile.social.rpc'
import type { FriendProfile } from '../../../features/profile/profile.social.rpc'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { truncateAddress } from '../../../utils/address'
import { ProfileAvatar } from '../ProfileAvatar'
import {
  BackIconButton,
  DialogHeader,
  DialogTitle,
  EmptyState,
  FriendAddress,
  FriendList,
  FriendName,
  FriendNameBlock,
  FriendRow,
  InputAdornment,
  LoadingState,
  SearchField,
  SearchIcon
} from './FriendsModal.styled'

interface FriendsListProps {
  /** Gates the RPC fetch — pass the dialog/surface visibility. */
  enabled: boolean
  /** Called when the user picks a friend — navigate (page) or push a profile surface (modal). */
  onSelect: (friend: FriendProfile) => void
  onClose: () => void
  /** Renders a back chevron in the header — used by the modal-stack surface flavour. */
  onBack?: () => void
  /**
   * When set, lists the mutual friends between the signed user and this address
   * (member-profile header cluster) instead of the signed user's own friends list.
   */
  mutualOfAddress?: string
}

/** Header + search + list shared by the FriendsModal dialog and the in-modal FriendsSurface. */
function FriendsList({ enabled, onSelect, onClose, onBack, mutualOfAddress }: FriendsListProps) {
  const t = useFormatMessage()
  const isMutualMode = Boolean(mutualOfAddress)
  const ownFriends = useFriendsList(enabled && !isMutualMode)
  const mutualFriends = useMutualFriendsList(mutualOfAddress, enabled && isMutualMode)
  const { friends, total, isLoading } = isMutualMode ? mutualFriends : ownFriends
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return friends
    return friends.filter(friend => friend.name?.toLowerCase().includes(needle) || friend.address.toLowerCase().includes(needle))
  }, [friends, query])

  return (
    <>
      <DialogHeader>
        {onBack ? (
          <BackIconButton aria-label={t('profile.header.back')} onClick={onBack}>
            <ArrowBackIosNewIcon fontSize="small" />
          </BackIconButton>
        ) : null}
        <DialogTitle id="friends-modal-title">
          {t(isMutualMode ? 'profile.friends_modal.mutual_title' : 'profile.friends_modal.title', { count: total ?? friends.length })}
        </DialogTitle>
        <IconButton aria-label={t('profile.friends_modal.close')} onClick={onClose} sx={{ color: 'common.white' }}>
          <CloseIcon />
        </IconButton>
      </DialogHeader>
      <SearchField
        placeholder={t('profile.friends_modal.search_placeholder')}
        value={query}
        onChange={event => setQuery(event.target.value)}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18 }} />
            </InputAdornment>
          )
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
    </>
  )
}

export { FriendsList }
export type { FriendsListProps }
