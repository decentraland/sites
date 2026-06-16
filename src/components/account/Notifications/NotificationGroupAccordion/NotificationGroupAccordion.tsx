import { memo, useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import type { NotificationType, SubscriptionDetails } from '@dcl/schemas'
import { Switch } from 'decentraland-ui2'
import { isTypeEmailEnabled } from '../../../../features/account-notifications/account-notifications.helpers'
import type { SubscriptionGroupKey } from '../../../../features/account-notifications/account-notifications.types'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { AccordionRoot, ChevronIconWrap, Content, Header, TypeLabel, TypeRow } from './NotificationGroupAccordion.styled'

interface NotificationGroupAccordionProps {
  group: SubscriptionGroupKey
  types: NotificationType[]
  details: SubscriptionDetails
  disabled?: boolean
  onToggleType: (type: NotificationType, checked: boolean) => void
}

const NotificationGroupAccordion = ({ group, types, details, disabled = false, onToggleType }: NotificationGroupAccordionProps) => {
  const t = useFormatMessage()
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = useCallback(() => setExpanded(prev => !prev), [])

  return (
    <AccordionRoot data-role="notifications-group">
      <Header type="button" onClick={toggleExpanded} aria-expanded={expanded} data-role="notifications-group-header">
        {t(`account.notifications.groups.${group}`)}
        <ChevronIconWrap $expanded={expanded}>
          <ExpandMoreRoundedIcon fontSize="small" />
        </ChevronIconWrap>
      </Header>
      {expanded && (
        <Content data-role="notifications-group-content">
          {types.map(type => (
            <TypeRow key={type} data-role="notifications-type-row">
              <TypeLabel>{t(`account.notifications.types.${type}`)}</TypeLabel>
              <Switch
                checked={isTypeEmailEnabled(details, type)}
                disabled={disabled}
                onChange={(_event, checked) => onToggleType(type, checked)}
                data-role="notifications-type-switch"
              />
            </TypeRow>
          ))}
        </Content>
      )}
    </AccordionRoot>
  )
}

const MemoizedNotificationGroupAccordion = memo(NotificationGroupAccordion)

export { MemoizedNotificationGroupAccordion as NotificationGroupAccordion }
