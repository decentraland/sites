import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ModalEventData } from '../components/whats-on/EventDetailModal'
import { normalizeEventEntry } from '../components/whats-on/EventDetailModal/normalizers'
import type { EventEntry } from '../features/events'

function useEventDetailModal() {
  const navigate = useNavigate()
  const [activeEvent, setActiveEvent] = useState<EventEntry | null>(null)
  const modalData: ModalEventData | null = useMemo(() => (activeEvent ? normalizeEventEntry(activeEvent) : null), [activeEvent])

  const openEventDetailModal = useCallback((event: EventEntry) => {
    setActiveEvent(event)
  }, [])

  const closeEventDetailModal = useCallback(() => {
    setActiveEvent(null)
  }, [])

  const editActiveEvent = useCallback(() => {
    if (!activeEvent) return
    navigate(`/whats-on/edit-hangout/${activeEvent.id}`, { state: { event: activeEvent } })
  }, [activeEvent, navigate])

  return {
    activeEvent,
    closeEventDetailModal,
    editActiveEvent,
    modalData,
    openEventDetailModal
  }
}

export { useEventDetailModal }
