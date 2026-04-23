import { useCallback, useEffect, useRef, useState } from 'react'
import { buildCalendarUrl, buildEventJumpInUrl } from '../utils/whatsOnUrl'

interface CardActionsParams {
  name: string
  description: string | null
  startAt: string
  finishAt: string
  x: number
  y: number
}

function useCardActions(event: CardActionsParams) {
  const eventUrl = buildEventJumpInUrl(event.x, event.y)
  const [copied, setCopied] = useState(false)
  const [calendarAdded, setCalendarAdded] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const calendarTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
      if (calendarTimer.current) clearTimeout(calendarTimer.current)
    }
  }, [])

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      navigator.clipboard
        ?.writeText(eventUrl)
        ?.then(() => {
          setCopied(true)
          if (copiedTimer.current) clearTimeout(copiedTimer.current)
          copiedTimer.current = setTimeout(() => setCopied(false), 2000)
        })
        .catch(err => console.warn('[useCardActions] Failed to copy:', err))
    },
    [eventUrl]
  )

  const handleAddToCalendar = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      const url = buildCalendarUrl({
        name: event.name,
        description: event.description,
        startAt: event.startAt,
        finishAt: event.finishAt,
        x: event.x,
        y: event.y,
        url: eventUrl
      })
      if (url) {
        window.open(url, 'calendar', 'width=1090,height=870,noopener,noreferrer')
        setCalendarAdded(true)
        if (calendarTimer.current) clearTimeout(calendarTimer.current)
        calendarTimer.current = setTimeout(() => setCalendarAdded(false), 2000)
      }
    },
    [event.name, event.description, event.startAt, event.finishAt, event.x, event.y, eventUrl]
  )

  return { eventUrl, copied, calendarAdded, handleCopy, handleAddToCalendar }
}

export { useCardActions }
export type { CardActionsParams }
