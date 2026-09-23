import { memo, useCallback, useState } from 'react'
import type { ReactNode } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import type { NotificationType, SubscriptionDetails } from '@dcl/schemas'
import { Switch } from 'decentraland-ui2'
import { isTypeEmailEnabled } from '../../../../features/account-notifications/account-notifications.helpers'
import { SubscriptionGroupKey } from '../../../../features/account-notifications/account-notifications.types'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import {
  DaoIcon,
  EventsIcon,
  MarketplaceCreditsIcon,
  MarketplaceIcon,
  ReferralsIcon,
  RewardsIcon,
  StreamingIcon,
  TipsIcon,
  WorldsIcon
} from './groupIcons'
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

// Per-group icon (Figma 522:122213 — the category SVGs provided by design, wrapped as MUI SvgIcons).
const GROUP_ICON: Record<SubscriptionGroupKey, ReactNode> = {
  [SubscriptionGroupKey.MARKETPLACE]: <MarketplaceIcon fontSize="small" />,
  [SubscriptionGroupKey.CREDITS]: <MarketplaceCreditsIcon fontSize="small" />,
  [SubscriptionGroupKey.EVENTS]: <EventsIcon fontSize="small" />,
  [SubscriptionGroupKey.REWARDS]: <RewardsIcon fontSize="small" />,
  [SubscriptionGroupKey.DAO]: <DaoIcon fontSize="small" />,
  [SubscriptionGroupKey.WORLDS]: <WorldsIcon fontSize="small" />,
  [SubscriptionGroupKey.STREAMING]: <StreamingIcon fontSize="small" />,
  [SubscriptionGroupKey.TIPS]: <TipsIcon fontSize="small" />,
  [SubscriptionGroupKey.REFERRAL]: <ReferralsIcon fontSize="small" />
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
