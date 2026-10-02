import { useCallback, useMemo } from 'react'
import type { EventEntry } from '../features/events/events.types'

// Cards may render a recurrent row rewritten to its upcoming occurrence (`toUpcomingOccurrence`), but the
// detail modal and the edit prefill need the series as the API returned it: the modal's RRULE counts
// `recurrent_count` from `start_at`, and saving an edit must not move the series start.
function useSeriesEventOpener(seriesEvents: EventEntry[], open: (event: EventEntry) => void): (event: EventEntry) => void {
  const seriesById = useMemo(() => new Map(seriesEvents.map(event => [event.id, event])), [seriesEvents])
  return useCallback((event: EventEntry) => open(seriesById.get(event.id) ?? event), [open, seriesById])
}

export { useSeriesEventOpener }
