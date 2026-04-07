import { NotificationActiveTab } from 'decentraland-ui2/dist/components/Notifications/Notifications.types'

interface NotificationItem {
  id: string
  read: boolean
  type: string
  timestamp: number
  metadata: Record<string, unknown>
}

interface NotificationsData {
  items: NotificationItem[]
  isLoading: boolean
  isOpen: boolean
  activeTab: NotificationActiveTab
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  onClose: () => void
  onChangeTab: (e: unknown, tab: NotificationActiveTab) => void
}

export { NotificationActiveTab }
export type { NotificationItem, NotificationsData }
