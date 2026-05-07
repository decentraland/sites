import { Notification, useNotifications } from '../../../features/media/cast/contexts/NotificationContext'
import { PresentationDownloadFailedToast } from './PresentationDownloadFailedToast'
import { ScreenShareFailedToast } from './ScreenShareFailedToast'
import { VideoPlaybackFailedToast } from './VideoPlaybackFailedToast'
import { StackRoot } from './NotificationStack.styled'

function renderNotification(n: Notification, onDismiss: (id: string) => void) {
  switch (n.variant) {
    case 'PresentationDownloadFailed':
      return <PresentationDownloadFailedToast key={n.id} notification={n} onDismiss={onDismiss} />
    case 'VideoPlaybackFailed':
      return <VideoPlaybackFailedToast key={n.id} notification={n} onDismiss={onDismiss} />
    case 'ScreenShareFailed':
      return <ScreenShareFailedToast key={n.id} notification={n} onDismiss={onDismiss} />
  }
}

function NotificationStack() {
  const { notifications, dismiss } = useNotifications()
  if (notifications.length === 0) return null
  return <StackRoot>{notifications.map(n => renderNotification(n, dismiss))}</StackRoot>
}

export { NotificationStack }
