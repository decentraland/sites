import { useCallback, useEffect, useRef, useState } from 'react'
import { useToggleAttendeeMutation } from '../features/events/events.client'
import { redirectToAuth } from '../utils/authRedirect'
import { useAuthIdentity } from './useAuthIdentity'

type UseRemindMeResult = {
  isReminded: boolean
  isLoading: boolean
  isShaking: boolean
  handleToggle: (e: React.MouseEvent) => void
}

function useRemindMe(eventId: string, attending?: boolean): UseRemindMeResult {
  const { identity, hasValidIdentity } = useAuthIdentity()
  const [toggleAttendee, { isLoading }] = useToggleAttendeeMutation({ fixedCacheKey: `remind-${eventId}` })
  const [isShaking, setIsShaking] = useState(false)
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const shakeTimer = useRef<ReturnType<typeof setTimeout>>()

  const serverValue = Boolean(attending)
  const isReminded = optimistic !== null ? optimistic : serverValue

  useEffect(() => {
    if (optimistic !== null && optimistic === serverValue) {
      setOptimistic(null)
    }
  }, [optimistic, serverValue])

  useEffect(() => {
    return () => clearTimeout(shakeTimer.current)
  }, [])

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isLoading) return
      if (!hasValidIdentity || !identity) {
        redirectToAuth()
        return
      }
      const newValue = !isReminded
      setOptimistic(newValue)
      setIsShaking(true)
      clearTimeout(shakeTimer.current)
      shakeTimer.current = setTimeout(() => setIsShaking(false), 600)
      toggleAttendee({ eventId, attending: newValue, identity })
        .unwrap()
        .catch(() => setOptimistic(null))
    },
    [eventId, isReminded, hasValidIdentity, identity, isLoading, toggleAttendee]
  )

  return { isReminded, isLoading, isShaking, handleToggle }
}

export { useRemindMe }
export type { UseRemindMeResult }
