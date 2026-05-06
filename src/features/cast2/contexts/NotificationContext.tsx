/* eslint-disable @typescript-eslint/naming-convention */
import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type NotificationVariant = 'PresentationDownloadFailed' | 'VideoPlaybackFailed'

interface NotificationAction {
  label: string
  onClick: () => void
}

interface NotificationOptions {
  message?: string
  code?: string
  action?: NotificationAction
  // Errors the user must read (e.g. failed upload) — opt out of auto-dismiss.
  persistent?: boolean
}

interface Notification {
  id: string
  variant: NotificationVariant
  message?: string
  code?: string
  action?: NotificationAction
  persistent?: boolean
}

interface NotificationContextValue {
  notifications: Notification[]
  show: (variant: NotificationVariant, options?: NotificationOptions) => string
  dismiss: (id: string) => void
}

// Auto-dismiss only when there is no action button — losing a Retry to a
// timer would be a bug, not a feature.
const AUTO_DISMISS_MS = 6000

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

let counter = 0
const nextId = (): string => {
  counter += 1
  return `cast-notification-${Date.now()}-${counter}`
}

const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const show = useCallback((variant: NotificationVariant, options?: NotificationOptions): string => {
    const id = nextId()
    const notification: Notification = {
      id,
      variant,
      message: options?.message,
      code: options?.code,
      action: options?.action,
      persistent: options?.persistent
    }
    setNotifications(prev => [...prev, notification])

    if (!notification.action && !notification.persistent) {
      const timer = setTimeout(() => {
        timersRef.current.delete(id)
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, AUTO_DISMISS_MS)
      timersRef.current.set(id, timer)
    }
    return id
  }, [])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [])

  return <NotificationContext.Provider value={{ notifications, show, dismiss }}>{children}</NotificationContext.Provider>
}

const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return ctx
}

export { NotificationProvider, useNotifications }
export type { Notification, NotificationAction, NotificationContextValue, NotificationOptions, NotificationVariant }
