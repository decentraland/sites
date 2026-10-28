import { useCallback, useRef } from 'react'
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
import type { SubscriptionDetails } from '../../features/account-notifications/account-notifications.types'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { GroupsColumn, GroupsColumns, NotificationsPanel, StateMessage } from './NotificationsPage.styled'

const NotificationsContent = ({ address }: { address: string }) => {
  const t = useFormatMessage()
  const { currentData: subscription, isLoading, isError } = useGetSubscriptionQuery({ address })
  const [updateSubscription, { isLoading: isUpdating, isError: updateFailed }] = useUpdateSubscriptionMutation()
  const saving = useRef(false)
  const saveDetails = useCallback(
    (nextDetails: SubscriptionDetails) => {
      if (saving.current) return
      saving.current = true
      // The mutation error state below owns the generic feedback; raw server bodies stay hidden.
      void updateSubscription({ address, details: nextDetails })
        .unwrap()
        .catch(() => undefined)
        .finally(() => {
          saving.current = false
        })
    },
    [address, updateSubscription]
  )

  const details = subscription?.details
  // Per-type toggles only make sense once an email is confirmed — until then the user manages
  // their address in the card above (mirrors the standalone account dapp's `hasEmail` gate).
  const hasConfirmedEmail = !!subscription?.email && !subscription?.unconfirmedEmail

  const handleToggleType = useCallback(
    (type: NotificationType, checked: boolean) => {
      if (!details) return
      saveDetails(setTypeEmail(details, type, checked))
    },
    [details, saveDetails]
  )

  const handleToggleAll = useCallback(
    (enabled: boolean) => {
      if (!details) return
      saveDetails(setAllEmail(details, enabled))
    },
    [details, saveDetails]
  )

  return (
    <>
      <Helmet>
        <title>{`${t('account.pages.notifications.title')} | Decentraland`}</title>
      </Helmet>
      <NotificationsPanel data-role="notifications-page">
        <EmailCard
          address={address}
          email={subscription?.email}
          unconfirmedEmail={subscription?.unconfirmedEmail}
          details={details}
          disabled={isLoading || isUpdating}
          onToggleAll={handleToggleAll}
        />

        {(isError || updateFailed) && <StateMessage data-role="notifications-error">{t('account.notifications.load_error')}</StateMessage>}

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
                    disabled={!hasConfirmedEmail || isUpdating}
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

const NotificationsPage = () => {
  const { address, hasValidIdentity } = useAuthIdentity()
  return address && hasValidIdentity ? <NotificationsContent key={address.toLowerCase()} address={address.toLowerCase()} /> : null
}

export { NotificationsPage }
