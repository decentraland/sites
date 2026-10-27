import { useEffect, useMemo, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { EventDetailModal, normalizeEventEntry, normalizeLiveNowCard } from '../components/events/EventDetailModal'
import type { ModalEventData } from '../components/events/EventDetailModal'
import { liveNowCardFromExploreItem } from '../components/Home/HomeDetailModal/HomeDetailModal.helpers'
import type { HomeDetailSelection } from '../components/Home/HomeDetailModal/HomeDetailModal.types'
import { HomeDetailPendingOverlay } from '../components/Home/HomeDetailModal/HomeDetailPendingOverlay'
import { getEnv } from '../config/env'
import { useGetEventByIdQuery } from '../features/events'
import { enrichPlaceCards } from '../features/events/events.helpers'
import type { LiveNowCard } from '../features/events/events.helpers'
import { useAuthIdentity } from '../hooks/useAuthIdentity'

interface HomeDetailModalProps {
  selection: HomeDetailSelection
  onClose: () => void
  onError: (error: unknown) => void
}

function HomeDetailModal({ selection, onClose, onError }: HomeDetailModalProps) {
  const { identity } = useAuthIdentity()
  const eventId = selection.kind === 'event' ? selection.id : undefined
  const place = selection.kind === 'place' ? selection.item : undefined

  const { currentData: event, error: eventError } = useGetEventByIdQuery(eventId ? { eventId, identity } : skipToken)
  const [placeCard, setPlaceCard] = useState<LiveNowCard | null>(null)

  useEffect(() => {
    if (eventError) onError(eventError)
  }, [eventError, onError])

  // The homepage card only carries the live-scene basics; the place description, categories and creator
  // come from the same enrichment the /events Live Now rail applies before opening this modal.
  useEffect(() => {
    if (!place) return undefined
    let cancelled = false
    enrichPlaceCards([liveNowCardFromExploreItem(place)], { placesUrl: getEnv('PLACES_API_URL'), peerUrl: getEnv('PEER_URL') })
      .then(([card]) => {
        if (!cancelled) setPlaceCard(card)
      })
      .catch(error => {
        if (!cancelled) onError(error)
      })
    return () => {
      cancelled = true
    }
  }, [place, onError])

  const data = useMemo<ModalEventData | null>(() => {
    if (event) return normalizeEventEntry(event)
    return placeCard ? normalizeLiveNowCard(placeCard) : null
  }, [event, placeCard])

  if (!data) return <HomeDetailPendingOverlay onClose={onClose} />

  return <EventDetailModal open onClose={onClose} data={data} />
}

export { HomeDetailModal }
export type { HomeDetailModalProps }
