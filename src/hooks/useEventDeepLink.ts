import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query/react'
import type { ModalEventData } from '../components/whats-on/EventDetailModal'
import { normalizeEventEntry } from '../components/whats-on/EventDetailModal/normalizers'
import { useGetEventByIdQuery } from '../features/events'
import { EVENT_ID_PARAM } from '../utils/whatsOnUrl'
import { isClientError } from './deepLinkErrors'
import { useAuthIdentity } from './useAuthIdentity'

interface UseEventDeepLinkResult {
  modalData: ModalEventData | null
  isOpen: boolean
  closeDeepLink: () => void
}

function useEventDeepLink(): UseEventDeepLinkResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const eventId = searchParams.get(EVENT_ID_PARAM)
  const { identity } = useAuthIdentity()

  const { data: event, error } = useGetEventByIdQuery(eventId ? { eventId, identity } : skipToken)

  const modalData = useMemo<ModalEventData | null>(() => (event ? normalizeEventEntry(event) : null), [event])

  const closeDeepLink = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(EVENT_ID_PARAM)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  useEffect(() => {
    if (eventId && isClientError(error)) closeDeepLink()
  }, [eventId, error, closeDeepLink])

  return {
    modalData,
    isOpen: Boolean(eventId && modalData),
    closeDeepLink
  }
}

export { useEventDeepLink }
