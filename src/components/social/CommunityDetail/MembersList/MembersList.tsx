import { CircularProgress, Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { useInfiniteScrollSentinel } from '../../../../hooks/useInfiniteScrollSentinel'
import { MemberCard } from './MemberCard'
import type { MembersListProps } from './MembersList.types'
import {
  EmptyState,
  InitialLoader,
  LoadMoreSentinel,
  MemberListContainer,
  MembersSection,
  SectionTitle,
  SentinelLoader
} from './MembersList.styled'

function MembersList({
  members,
  isLoading = false,
  isFetchingMore = false,
  hasMore = false,
  onLoadMore,
  hideTitle = false,
  total,
  showCount = true
}: MembersListProps) {
  const t = useFormatMessage()
  const sentinelRef = useInfiniteScrollSentinel({ hasMore, isLoading: isFetchingMore, onLoadMore })

  const baseTitle = t('community.members_list.title')
  const count = typeof total === 'number' ? total : members.length
  const title = showCount ? `${baseTitle} (${count})` : baseTitle

  if (isLoading) {
    return (
      <MembersSection>
        {!hideTitle && <SectionTitle>{title}</SectionTitle>}
        <InitialLoader>
          <CircularProgress />
        </InitialLoader>
      </MembersSection>
    )
  }

  return (
    <MembersSection>
      {!hideTitle && <SectionTitle>{title}</SectionTitle>}
      {members.length === 0 ? (
        <EmptyState>
          <Typography variant="body2" color="textSecondary">
            {t('community.members_list.no_members_found')}
          </Typography>
        </EmptyState>
      ) : (
        <MemberListContainer>
          {members.map(member => (
            <MemberCard key={member.memberAddress} {...member} />
          ))}
          {hasMore && (
            <LoadMoreSentinel ref={sentinelRef}>
              {isFetchingMore && (
                <SentinelLoader>
                  <CircularProgress size={24} />
                </SentinelLoader>
              )}
            </LoadMoreSentinel>
          )}
        </MemberListContainer>
      )}
    </MembersSection>
  )
}

export { MembersList }
