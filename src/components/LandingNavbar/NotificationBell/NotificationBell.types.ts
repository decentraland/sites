import type { NotificationsData } from '../types'

export interface NotificationBellProps {
  notifications: NotificationsData | undefined
  onBellClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  unreadCount: number
}
