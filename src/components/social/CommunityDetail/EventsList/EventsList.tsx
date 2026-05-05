import { CircularProgress } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { useInfiniteScrollSentinel } from '../../../../hooks/useInfiniteScrollSentinel'
import { UpcomingCard } from '../../../whats-on/Upcoming/UpcomingCard'
import { EmptyEventsIcon } from './EmptyEventsIcon'
import type { EventsListProps } from './EventsList.types'
import {
  EmptyState,
  EmptyStateText,
  EventsGrid,
  EventsSection,
  InitialLoader,
  LoadMoreSentinel,
  SectionTitle,
  SentinelLoader
} from './EventsList.styled'

function EventsList({
  events,
  isLoading = false,
  isFetchingMore = false,
  hasMore = false,
  onLoadMore,
  onEventClick,
  hideTitle = false
}: EventsListProps) {
  const t = useFormatMessage()
  const sentinelRef = useInfiniteScrollSentinel({ hasMore, isLoading: isFetchingMore, onLoadMore })

  if (isLoading) {
    return (
      <EventsSection>
        {!hideTitle && <SectionTitle>{t('community.events.upcoming_events')}</SectionTitle>}
        <InitialLoader>
          <CircularProgress />
        </InitialLoader>
      </EventsSection>
    )
  }

  return (
    <EventsSection>
      {!hideTitle && <SectionTitle>{t('community.events.upcoming_events')}</SectionTitle>}
      {events.length === 0 ? (
        <EmptyState>
          <EmptyEventsIcon />
          <EmptyStateText color="textPrimary">{t('community.events.no_upcoming_events')}</EmptyStateText>
        </EmptyState>
      ) : (
        <EventsGrid>
          {events.map(event => (
            <UpcomingCard key={event.id} event={event} onClick={onEventClick} />
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
        </EventsGrid>
      )}
    </EventsSection>
  )
}

export { EventsList }
