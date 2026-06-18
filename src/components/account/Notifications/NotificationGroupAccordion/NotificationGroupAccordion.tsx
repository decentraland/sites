import { memo, useCallback, useState } from 'react'
import type { ReactNode } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import type { NotificationType, SubscriptionDetails } from '@dcl/schemas'
import { Switch } from 'decentraland-ui2'
import { isTypeEmailEnabled } from '../../../../features/account-notifications/account-notifications.helpers'
import { SubscriptionGroupKey } from '../../../../features/account-notifications/account-notifications.types'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import {
  AccordionRoot,
  ChevronIconWrap,
  Content,
  GroupIcon,
  Header,
  HeaderLabel,
  TypeLabel,
  TypeRow
} from './NotificationGroupAccordion.styled'

// Per-group icon (Figma 522:122213 — each accordion header carries its category icon). Outlined
// MUI icons to match the sidebar's icon style.
const GROUP_ICON: Record<SubscriptionGroupKey, ReactNode> = {
  [SubscriptionGroupKey.MARKETPLACE]: <StorefrontOutlinedIcon fontSize="small" />,
  [SubscriptionGroupKey.CREDITS]: <CreditCardOutlinedIcon fontSize="small" />,
  [SubscriptionGroupKey.EVENTS]: <EventOutlinedIcon fontSize="small" />,
  [SubscriptionGroupKey.REWARDS]: <RedeemOutlinedIcon fontSize="small" />,
  [SubscriptionGroupKey.DAO]: <AccountBalanceOutlinedIcon fontSize="small" />,
  [SubscriptionGroupKey.WORLDS]: <PublicOutlinedIcon fontSize="small" />,
  [SubscriptionGroupKey.STREAMING]: <SensorsOutlinedIcon fontSize="small" />,
  [SubscriptionGroupKey.TIPS]: <PaidOutlinedIcon fontSize="small" />,
  [SubscriptionGroupKey.REFERRAL]: <GroupAddOutlinedIcon fontSize="small" />
}

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
        <HeaderLabel>
          <GroupIcon>{GROUP_ICON[group]}</GroupIcon>
          {t(`account.notifications.groups.${group}`)}
        </HeaderLabel>
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
