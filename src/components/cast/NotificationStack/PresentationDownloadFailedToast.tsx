import { Notification } from '../../../features/cast2/contexts/NotificationContext'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { Toast } from './Toast'

interface PresentationDownloadFailedToastProps {
  notification: Notification
  onDismiss: (id: string) => void
}

function PresentationDownloadFailedToast({ notification, onDismiss }: PresentationDownloadFailedToastProps) {
  const { t } = useCastTranslation()
  const body = notification.message ?? t('notifications.presentation_download_failed.default_message')

  return (
    <Toast.Root id={notification.id} onDismiss={() => onDismiss(notification.id)}>
      <Toast.Header>
        <Toast.Body>
          <Toast.Title>{t('notifications.presentation_download_failed.title')}</Toast.Title>
          <Toast.Message>{body}</Toast.Message>
        </Toast.Body>
        <Toast.DismissButton />
      </Toast.Header>
    </Toast.Root>
  )
}

export { PresentationDownloadFailedToast }
