import { useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { EmailCard } from '../../components/account/Notifications/EmailCard/EmailCard'
import { NotificationGroupRow } from '../../components/account/Notifications/NotificationGroupRow/NotificationGroupRow'
import { useGetSubscriptionQuery, useUpdateSubscriptionMutation } from '../../features/account-notifications/account-notifications.client'
import {
  SUBSCRIPTION_GROUP_ORDER,
  isGroupEnabled,
  setGroupEnabled
} from '../../features/account-notifications/account-notifications.helpers'
import type { SubscriptionGroupKey } from '../../features/account-notifications/account-notifications.types'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { GroupsGrid, Header, NotificationsPanel, StateMessage, Subtitle, Title } from './NotificationsPage.styled'

const NotificationsPage = () => {
  const t = useFormatMessage()
  const { data: subscription, isLoading, isError } = useGetSubscriptionQuery()
  const [updateSubscription, { isLoading: isSaving }] = useUpdateSubscriptionMutation()

  const details = subscription?.details
  // Group toggles only make sense once an email is confirmed — until then the user manages
  // their address in the card above (mirrors the standalone account dapp's `hasEmail` gate).
  const hasConfirmedEmail = !!subscription?.email && !subscription?.unconfirmedEmail

  const handleToggleGroup = useCallback(
    (group: SubscriptionGroupKey, checked: boolean) => {
      if (!details) return
      void updateSubscription(setGroupEnabled(details, group, checked))
    },
    [details, updateSubscription]
  )

  return (
    <>
      <Helmet>
        <title>{`${t('account.pages.notifications.title')} | Decentraland`}</title>
      </Helmet>
      <NotificationsPanel data-role="notifications-page">
        <Header>
          <Title variant="h4">{t('account.notifications.title')}</Title>
          <Subtitle>{t('account.notifications.description')}</Subtitle>
        </Header>

        <EmailCard email={subscription?.email} unconfirmedEmail={subscription?.unconfirmedEmail} disabled={isLoading} />

        {isError && <StateMessage data-role="notifications-error">{t('account.notifications.load_error')}</StateMessage>}

        {isLoading && !details && <StateMessage data-role="notifications-loading">{t('account.notifications.loading')}</StateMessage>}

        {details && (
          <GroupsGrid data-role="notifications-groups">
            {SUBSCRIPTION_GROUP_ORDER.map(group => (
              <NotificationGroupRow
                key={group}
                group={group}
                checked={isGroupEnabled(details, group)}
                disabled={!hasConfirmedEmail || isSaving}
                onToggle={handleToggleGroup}
              />
            ))}
          </GroupsGrid>
        )}
      </NotificationsPanel>
    </>
  )
}

export { NotificationsPage }
