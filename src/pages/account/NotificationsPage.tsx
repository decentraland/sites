import { useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import type { NotificationType } from '@dcl/schemas'
import { EmailCard } from '../../components/account/Notifications/EmailCard/EmailCard'
import { NotificationGroupAccordion } from '../../components/account/Notifications/NotificationGroupAccordion/NotificationGroupAccordion'
import { useGetSubscriptionQuery, useUpdateSubscriptionMutation } from '../../features/account-notifications/account-notifications.client'
import {
  SUBSCRIPTION_GROUP_COLUMNS,
  setAllEmail,
  setTypeEmail,
  subscriptionGroups
} from '../../features/account-notifications/account-notifications.helpers'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { GroupsColumn, GroupsColumns, NotificationsPanel, StateMessage } from './NotificationsPage.styled'

const NotificationsPage = () => {
  const t = useFormatMessage()
  const { data: subscription, isLoading, isError } = useGetSubscriptionQuery()
  const [updateSubscription] = useUpdateSubscriptionMutation()

  const details = subscription?.details
  // Per-type toggles only make sense once an email is confirmed — until then the user manages
  // their address in the card above (mirrors the standalone account dapp's `hasEmail` gate).
  const hasConfirmedEmail = !!subscription?.email && !subscription?.unconfirmedEmail

  const handleToggleType = useCallback(
    (type: NotificationType, checked: boolean) => {
      if (!details) return
      void updateSubscription(setTypeEmail(details, type, checked))
    },
    [details, updateSubscription]
  )

  const handleToggleAll = useCallback(
    (enabled: boolean) => {
      if (!details) return
      void updateSubscription(setAllEmail(details, enabled))
    },
    [details, updateSubscription]
  )

  return (
    <>
      <Helmet>
        <title>{`${t('account.pages.notifications.title')} | Decentraland`}</title>
      </Helmet>
      <NotificationsPanel data-role="notifications-page">
        <EmailCard
          email={subscription?.email}
          unconfirmedEmail={subscription?.unconfirmedEmail}
          details={details}
          disabled={isLoading}
          onToggleAll={handleToggleAll}
        />

        {isError && <StateMessage data-role="notifications-error">{t('account.notifications.load_error')}</StateMessage>}

        {isLoading && !details && <StateMessage data-role="notifications-loading">{t('account.notifications.loading')}</StateMessage>}

        {details && (
          <GroupsColumns data-role="notifications-groups">
            {SUBSCRIPTION_GROUP_COLUMNS.map((column, index) => (
              <GroupsColumn key={index}>
                {column.map(group => (
                  <NotificationGroupAccordion
                    key={group}
                    group={group}
                    types={subscriptionGroups[group]}
                    details={details}
                    disabled={!hasConfirmedEmail}
                    onToggleType={handleToggleType}
                  />
                ))}
              </GroupsColumn>
            ))}
          </GroupsColumns>
        )}
      </NotificationsPanel>
    </>
  )
}

export { NotificationsPage }
