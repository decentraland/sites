import { useCallback, useMemo } from 'react'
import { CircularProgress } from 'decentraland-ui2'
import type { LiveNowCard } from '../../../../features/whats-on-events'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { useInfiniteScrollSentinel } from '../../../../hooks/useInfiniteScrollSentinel'
import { LiveNowCardItem } from '../../../whats-on/LiveNow/LiveNowCardItem'
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

function mapEventToLiveNowCard(event: EventsListProps['events'][number]): LiveNowCard {
  return {
    id: event.id,
    type: 'event',
    title: event.name,
    image: event.image ?? '',
    users: event.total_attendees,
    coordinates: `${event.x},${event.y}`,
    creatorAddress: event.user || undefined,
    creatorName: event.user_name || undefined,
    isGenesisPlaza: false,
    description: event.description,
    categories: event.categories,
    startAt: event.start_at,
    finishAt: event.finish_at,
    recurrent: event.recurrent,
    recurrentFrequency: event.recurrent_frequency,
    recurrentDates: event.recurrent_dates,
    attending: event.attending,
    world: event.world,
    server: event.server
  }
}

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
  const cards = useMemo(() => events.map(mapEventToLiveNowCard), [events])
  const eventsById = useMemo(() => new Map(events.map(event => [event.id, event])), [events])
  const handleCardClick = useCallback(
    (card: LiveNowCard) => {
      const event = eventsById.get(card.id)
      if (event) onEventClick(event)
    },
    [eventsById, onEventClick]
  )

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
          {cards.map((card, index) => (
            <LiveNowCardItem key={card.id} card={card} onClick={handleCardClick} eager={index === 0} />
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
