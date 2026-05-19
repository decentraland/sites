import type { MemberCardProps } from './MemberCard.types'

type MembersListProps = {
  members: MemberCardProps[]
  isLoading?: boolean
  isFetchingMore?: boolean
  hasMore?: boolean
  onLoadMore: () => void
  hideTitle?: boolean
  total?: number
  showCount?: boolean
}

export type { MembersListProps }
