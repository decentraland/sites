import { memo, useCallback } from 'react'
import { useTranslation } from '@dcl/hooks'
import { Tooltip } from 'decentraland-ui2'
import type { EventEntry } from '../../features/events'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useCardActions } from '../../hooks/useCardActions'
import { useRemindMe } from '../../hooks/useRemindMe'
import { getRelativeTimeLabel } from '../../utils/time'
import {
  ActionButton,
  ActionTextButton,
  ActionTextLabel,
  AvatarFallback,
  AvatarImage,
  CalendarIcon,
  CopyIcon,
  CreatorName,
  CreatorNameHighlight,
  CreatorRow,
  HoverActions,
  TimeIcon,
  TimeLabel,
  TimePill
} from '../common/CardActions.styled'
import { RemindMeButton } from '../common/RemindMeButton'
import { CardContent, CardImage, CardImageWrapper, CardTitle, FutureCardContainer } from './AllExperiencesCard.styled'

interface FutureCardProps {
  event: EventEntry
  onClick: (event: EventEntry) => void
}

const FutureCard = memo(({ event, onClick }: FutureCardProps) => {
  const { t } = useTranslation()
  const { hasValidIdentity } = useAuthIdentity()
  const { data: profile } = useGetProfileQuery(event.user, { skip: !event.user })
  const avatar = profile?.avatars?.[0]
  const avatarFace = avatar?.avatar?.snapshots?.face256
  const creatorName = avatar?.name || event.user_name || t('all_experiences.coming_soon')
  const { copied, handleCopy, handleAddToCalendar } = useCardActions({
    name: event.name,
    description: event.description,
    startAt: event.start_at,
    finishAt: event.finish_at,
    x: event.x,
    y: event.y
  })
  const { isReminded, isLoading: isRemindLoading, isShaking, handleToggle: handleRemindToggle } = useRemindMe(event.id, event.attending)

  const handleClick = useCallback(() => {
    onClick(event)
  }, [onClick, event])

  return (
    <FutureCardContainer onClick={handleClick}>
      {event.image && (
        <CardImageWrapper>
          <CardImage src={event.image} alt={event.name} loading="lazy" />
        </CardImageWrapper>
      )}
      <CardContent>
        <CardTitle>{event.name}</CardTitle>
        <CreatorRow data-role="creator-row">
          {avatarFace ? <AvatarImage src={avatarFace} alt={creatorName} /> : <AvatarFallback />}
          <CreatorName>
            {t('upcoming.by_prefix')}
            <CreatorNameHighlight>{creatorName}</CreatorNameHighlight>
          </CreatorName>
        </CreatorRow>
        <TimePill data-role="time-pill">
          <TimeIcon />
          <TimeLabel>{getRelativeTimeLabel(event.start_at, t)}</TimeLabel>
        </TimePill>
        <HoverActions data-role="hover-actions">
          {hasValidIdentity ? (
            <RemindMeButton
              isReminded={isReminded}
              isLoading={isRemindLoading}
              isShaking={isShaking}
              label={t('all_experiences.remind_me')}
              onClick={handleRemindToggle}
            />
          ) : (
            <ActionTextButton onClick={handleAddToCalendar}>
              <CalendarIcon />
              <ActionTextLabel>{t('all_experiences.add_to_calendar')}</ActionTextLabel>
            </ActionTextButton>
          )}
          {hasValidIdentity && (
            <Tooltip title={t('all_experiences.add_to_calendar')} placement="top" arrow>
              <ActionButton onClick={handleAddToCalendar}>
                <CalendarIcon />
              </ActionButton>
            </Tooltip>
          )}
          <Tooltip title={copied ? t('all_experiences.copied') : t('all_experiences.copy_link')} placement="top" arrow>
            <ActionButton onClick={handleCopy}>
              <CopyIcon />
            </ActionButton>
          </Tooltip>
        </HoverActions>
      </CardContent>
    </FutureCardContainer>
  )
})

FutureCard.displayName = 'FutureCard'

export { FutureCard }
