import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ModalEventData } from '../components/events/EventDetailModal'
import { normalizeEventEntry } from '../components/events/EventDetailModal/normalizers'
import type { EventEntry } from '../features/events'
import { getAuthSession } from '../utils/authSession'
import { useAuthIdentity } from './useAuthIdentity'

function useEventDetailModal() {
  const navigate = useNavigate()
  const { address, hasValidIdentity } = useAuthIdentity()
  const account = hasValidIdentity ? address?.toLowerCase() : undefined
  const [scope, setScope] = useState(account)
  const [selectedEvent, setActiveEvent] = useState<EventEntry | null>(null)
  const activeEvent = scope === account ? selectedEvent : null
  // Clear the copied payload in the same render; A -> B -> A must not reopen A's old modal.
  if (scope !== account) {
    setScope(account)
    setActiveEvent(null)
  }
  const modalData: ModalEventData | null = useMemo(() => (activeEvent ? normalizeEventEntry(activeEvent) : null), [activeEvent])

  const openEventDetailModal = useCallback((event: EventEntry) => {
    setActiveEvent(event)
  }, [])

  const closeEventDetailModal = useCallback(() => {
    setActiveEvent(null)
  }, [])

  const editActiveEvent = useCallback(() => {
    if (!activeEvent) return
    navigate(`/events/edit-event/${activeEvent.id}`, { state: { event: activeEvent, account, session: getAuthSession() } })
  }, [activeEvent, account, navigate])

  return {
    activeEvent,
    closeEventDetailModal,
    editActiveEvent,
    modalData,
    openEventDetailModal
  }
}

export { useEventDetailModal }
