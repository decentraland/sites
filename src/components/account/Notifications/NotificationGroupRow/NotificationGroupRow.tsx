import { memo, useCallback } from 'react'
import { Switch } from 'decentraland-ui2'
import type { SubscriptionGroupKey } from '../../../../features/account-notifications/account-notifications.types'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { Label, Row } from './NotificationGroupRow.styled'

interface NotificationGroupRowProps {
  group: SubscriptionGroupKey
  checked: boolean
  disabled?: boolean
  onToggle: (group: SubscriptionGroupKey, checked: boolean) => void
}

const NotificationGroupRow = ({ group, checked, disabled = false, onToggle }: NotificationGroupRowProps) => {
  const t = useFormatMessage()

  const handleChange = useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>, value: boolean) => {
      onToggle(group, value)
    },
    [group, onToggle]
  )

  return (
    <Row data-role="notifications-group-row">
      <Label>{t(`account.notifications.groups.${group}`)}</Label>
      <Switch checked={checked} disabled={disabled} onChange={handleChange} data-role="notifications-group-switch" />
    </Row>
  )
}

const MemoizedNotificationGroupRow = memo(NotificationGroupRow)

export { MemoizedNotificationGroupRow as NotificationGroupRow }
