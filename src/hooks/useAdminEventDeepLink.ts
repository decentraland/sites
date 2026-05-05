import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { EventEntry } from '../features/whats-on-events/events.types'
import { EVENT_ID_PARAM } from '../utils/whatsOnUrl'

interface UseAdminEventDeepLinkParams {
  events: EventEntry[]
  isLoaded: boolean
  onMatch: (event: EventEntry) => void
}

interface UseAdminEventDeepLinkResult {
  closeDeepLink: () => void
}

function useAdminEventDeepLink({ events, isLoaded, onMatch }: UseAdminEventDeepLinkParams): UseAdminEventDeepLinkResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const eventId = searchParams.get(EVENT_ID_PARAM)
  // NOTE: deliberately a per-mount ref. Once an id is consumed we never auto-reopen the modal for it, even if the param reappears via back-button or a second arrival in the same session.
  const consumedIdRef = useRef<string | null>(null)

  const stripIdParam = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(EVENT_ID_PARAM)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  const closeDeepLink = useCallback(() => {
    if (!eventId) return
    stripIdParam()
  }, [eventId, stripIdParam])

  useEffect(() => {
    if (!eventId || !isLoaded) return
    if (consumedIdRef.current === eventId) return
    consumedIdRef.current = eventId
    const match = events.find(event => event.id === eventId)
    if (match) {
      onMatch(match)
    } else {
      stripIdParam()
    }
  }, [eventId, isLoaded, events, onMatch, stripIdParam])

  return { closeDeepLink }
}

export { useAdminEventDeepLink }
