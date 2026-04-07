import { memo, useCallback, useState } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useLocale } from '../../../intl/LocaleContext'
import { BellIcon } from '../icons'
import {
  BellButton,
  NotificationBadge,
  NotificationDot,
  NotificationEmpty,
  NotificationHeader,
  NotificationItemContent,
  NotificationItemDescription,
  NotificationItemImage,
  NotificationItemTime,
  NotificationItemTitle,
  NotificationList,
  NotificationListItem,
  NotificationPanel as NotificationPanelStyled,
  NotificationTitle,
  NotificationWrapper
} from '../LandingNavbar.styled'
import { formatNotificationType, formatTimeAgo, safeOpenUrl } from '../utils'
import type { NotificationBellProps } from './NotificationBell.types'

// Module-level cache for notification type->component map from ui2.
// Lazy-loaded on first bell click so it doesn't affect initial bundle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _notifComponentMap: Record<string, React.ComponentType<any>> | null = null
let _importPending = false

const NotificationBell = memo(function NotificationBell({ notifications, onBellClick, unreadCount }: NotificationBellProps) {
  const l = useFormatMessage()
  const { locale } = useLocale()
  const [notifMapLoaded, setNotifMapLoaded] = useState(!!_notifComponentMap)

  const handleBellClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onBellClick(e)
      // Lazy-load notification type renderers from ui2 on first click
      if (!_notifComponentMap && !_importPending) {
        _importPending = true
        import('decentraland-ui2/dist/components/Notifications/utils')
          .then(m => {
            _notifComponentMap = m.NotificationComponentByType
            setNotifMapLoaded(true)
          })
          .catch(() => {
            _importPending = false
          })
      }
    },
    [onBellClick]
  )

  return (
    <NotificationWrapper>
      <BellButton
        onClick={handleBellClick}
        aria-label="Notifications"
        aria-expanded={notifications?.isOpen}
        className={unreadCount > 0 ? 'has-unread' : ''}
      >
        <BellIcon />
        {unreadCount > 0 && <NotificationBadge>{unreadCount > 9 ? '9+' : unreadCount}</NotificationBadge>}
      </BellButton>

      {notifications?.isOpen && (
        <NotificationPanelStyled onClick={e => e.stopPropagation()}>
          <NotificationHeader>
            <NotificationTitle>{l('component.landing.navbar.notifications_title')}</NotificationTitle>
          </NotificationHeader>
          <NotificationList>
            {notifications.isLoading ? (
              <NotificationEmpty>{l('component.landing.navbar.notifications_loading')}</NotificationEmpty>
            ) : (
              (() => {
                const items = notifications.items
                if (items.length === 0) {
                  return <NotificationEmpty>{l('component.landing.navbar.notifications_empty_new')}</NotificationEmpty>
                }
                return items.slice(0, 30).map(item => {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  const Comp = _notifComponentMap?.[item.type]
                  if (Comp && notifMapLoaded) {
                    // Use ui2's full notification renderer (correct icon, title, description per type)
                    return (
                      <NotificationListItem key={item.id} style={{ padding: 0 }}>
                        <Comp notification={item} locale={locale} />
                      </NotificationListItem>
                    )
                  }
                  // Fallback while ui2 components load or for unknown types
                  const meta = item.metadata as Record<string, unknown> | undefined
                  const title = String(meta?.title || meta?.nftName || '') || formatNotificationType(item.type)
                  const description =
                    typeof meta?.description === 'string' ? meta.description : typeof meta?.message === 'string' ? meta.message : undefined
                  const rawLink = typeof meta?.link === 'string' ? meta.link : typeof meta?.url === 'string' ? meta.url : undefined
                  const link = rawLink && rawLink.startsWith('http') ? rawLink : undefined
                  return (
                    <NotificationListItem
                      key={item.id}
                      onClick={() => link && safeOpenUrl(link)}
                      style={{ cursor: link ? 'pointer' : 'default' }}
                    >
                      <NotificationItemImage>
                        <BellIcon />
                      </NotificationItemImage>
                      <NotificationItemContent>
                        <NotificationItemTitle>{title}</NotificationItemTitle>
                        {description && <NotificationItemDescription>{description}</NotificationItemDescription>}
                        <NotificationItemTime>{formatTimeAgo(item.timestamp, l)}</NotificationItemTime>
                      </NotificationItemContent>
                      {!item.read && (
                        <NotificationDot
                          className="unread"
                          role="status"
                          tabIndex={0}
                          aria-label="Unread notification"
                          onKeyDown={e => {
                            if ((e.key === 'Enter' || e.key === ' ') && link) {
                              e.preventDefault()
                              safeOpenUrl(link)
                            }
                          }}
                        />
                      )}
                    </NotificationListItem>
                  )
                })
              })()
            )}
          </NotificationList>
        </NotificationPanelStyled>
      )}
    </NotificationWrapper>
  )
})

NotificationBell.displayName = 'NotificationBell'

export { NotificationBell }
