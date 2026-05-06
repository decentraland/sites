import type { EventEntry } from '../../../../features/whats-on-events'

type EventsListProps = {
  events: EventEntry[]
  isLoading?: boolean
  isFetchingMore?: boolean
  hasMore?: boolean
  onLoadMore: () => void
  onEventClick: (event: EventEntry) => void
  hideTitle?: boolean
}

export type { EventsListProps }
