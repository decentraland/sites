import { memo, useCallback } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { useTranslation } from '@dcl/hooks'
import { EventSmallCard, Tooltip } from 'decentraland-ui2'
import type { EventEntry } from '../../../features/events'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useCardActions } from '../../../hooks/useCardActions'
import { useCreatorProfile } from '../../../hooks/useCreatorProfile'
import { useRemindMe } from '../../../hooks/useRemindMe'
import { getRelativeTimeLabel } from '../../../utils/whatsOnTime'
import { resolveEventRealm } from '../../../utils/whatsOnUrl'
import { CalendarAddIcon } from '../common/CalendarAddIcon'
import { ActionButton, ActionTextButton, ActionTextLabel, CalendarIcon, CopyIcon } from '../common/CardActions.styled'
import { RemindMeButton } from '../common/RemindMeButton'
import { RemindMeIcon } from '../common/RemindMeIcon'
import { EventSmallCardWrapper, MobileActionButton } from './UpcomingCard.styled'

const UpcomingCard = memo(function UpcomingCard({
  event,
  onClick,
  disableHover
}: {
  event: EventEntry
  onClick: (event: EventEntry) => void
  disableHover?: boolean
}) {
  const { t } = useTranslation()
  const { hasValidIdentity } = useAuthIdentity()
  const { creatorName, avatarFace } = useCreatorProfile(event.user, event.user_name, t('upcoming.unknown_creator'))
  const { copied, calendarAdded, handleCopy, handleAddToCalendar } = useCardActions({
    name: event.name,
    description: event.description,
    startAt: event.start_at,
    finishAt: event.finish_at,
    x: event.x,
    y: event.y,
    realm: resolveEventRealm(event.world, event.server)
  })
  const { isReminded, isLoading: isRemindLoading, isShaking, handleToggle: handleRemindToggle } = useRemindMe(event.id, event.attending)

  const handleClick = useCallback(() => {
    onClick(event)
  }, [onClick, event])

  const mobileAction = hasValidIdentity ? (
    <MobileActionButton onClick={handleRemindToggle} disabled={isRemindLoading} aria-label={t('upcoming.remind_me')}>
      <RemindMeIcon active={isReminded} shaking={isShaking} size={16} />
    </MobileActionButton>
  ) : (
    <MobileActionButton onClick={handleAddToCalendar} aria-label={t('upcoming.add_to_calendar')}>
      <CalendarMonthIcon sx={{ fontSize: 16 }} />
    </MobileActionButton>
  )

  const desktopHoverActions = (
    <>
      {hasValidIdentity ? (
        <RemindMeButton
          isReminded={isReminded}
          isLoading={isRemindLoading}
          isShaking={isShaking}
          label={t('upcoming.remind_me')}
          onClick={handleRemindToggle}
        />
      ) : (
        <ActionTextButton onClick={handleAddToCalendar}>
          <CalendarAddIcon />
          <ActionTextLabel>{t('upcoming.add_to_calendar')}</ActionTextLabel>
        </ActionTextButton>
      )}
      {hasValidIdentity && (
        <Tooltip title={t('upcoming.add_to_calendar')} placement="top" arrow>
          <ActionButton onClick={handleAddToCalendar} data-active={calendarAdded}>
            <CalendarIcon />
          </ActionButton>
        </Tooltip>
      )}
      <Tooltip title={copied ? t('upcoming.copied') : t('upcoming.copy_link')} placement="top" arrow>
        <ActionButton onClick={handleCopy} data-active={copied}>
          <CopyIcon />
        </ActionButton>
      </Tooltip>
    </>
  )

  return (
    <EventSmallCardWrapper>
      <EventSmallCard
        image={event.image ?? undefined}
        title={event.name}
        creatorName={creatorName}
        creatorAvatarUrl={avatarFace}
        timeLabel={getRelativeTimeLabel(event.start_at, t)}
        onClick={handleClick}
        disableHover={disableHover}
        action={mobileAction}
        hoverActions={desktopHoverActions}
      />
    </EventSmallCardWrapper>
  )
})

UpcomingCard.displayName = 'UpcomingCard'

export { UpcomingCard }
