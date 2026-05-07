import { Notification } from '../../../features/media/cast/contexts/NotificationContext'
import { useCastTranslation } from '../../../features/media/cast/useCastTranslation'
import { Toast } from './Toast'

interface ScreenShareFailedToastProps {
  notification: Notification
  onDismiss: (id: string) => void
}

function ScreenShareFailedToast({ notification, onDismiss }: ScreenShareFailedToastProps) {
  const { t } = useCastTranslation()
  const body = notification.message ?? t('notifications.screen_share_failed.default_message')

  return (
    <Toast.Root id={notification.id} onDismiss={() => onDismiss(notification.id)}>
      <Toast.Header>
        <Toast.Body>
          <Toast.Title>{t('notifications.screen_share_failed.title')}</Toast.Title>
          <Toast.Message>{body}</Toast.Message>
        </Toast.Body>
        <Toast.DismissButton />
      </Toast.Header>
    </Toast.Root>
  )
}

export { ScreenShareFailedToast }
