import { Notification, useNotifications } from '../../../features/cast2/contexts/NotificationContext'
import { PresentationDownloadFailedToast } from './PresentationDownloadFailedToast'
import { VideoPlaybackFailedToast } from './VideoPlaybackFailedToast'
import { StackRoot } from './NotificationStack.styled'

function renderNotification(n: Notification, onDismiss: (id: string) => void) {
  switch (n.variant) {
    case 'PresentationDownloadFailed':
      return <PresentationDownloadFailedToast key={n.id} notification={n} onDismiss={onDismiss} />
    case 'VideoPlaybackFailed':
      return <VideoPlaybackFailedToast key={n.id} notification={n} onDismiss={onDismiss} />
  }
}

function NotificationStack() {
  const { notifications, dismiss } = useNotifications()
  if (notifications.length === 0) return null
  return <StackRoot>{notifications.map(n => renderNotification(n, dismiss))}</StackRoot>
}

export { NotificationStack }
