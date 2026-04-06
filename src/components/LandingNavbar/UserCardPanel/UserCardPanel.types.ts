export interface UserCardPanelProps {
  isLoadingProfile: boolean
  address?: string
  avatar?: { name?: string; avatar?: { snapshots?: { face256?: string; body?: string } } }
  userCardOpen: boolean
  onToggleUserCard: () => void
  onClickSignOut: () => void
}
