import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from '@dcl/hooks'
import { Tooltip } from 'decentraland-ui2'
import type { EventEntry } from '../../../features/whats-on-events'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useCardActions } from '../../../hooks/useCardActions'
import { useCreatorProfile } from '../../../hooks/useCreatorProfile'
import { useRemindMe } from '../../../hooks/useRemindMe'
import { getCreatorColor } from '../../../utils/creatorColor'
import { optimizedImageUrl } from '../../../utils/imageUrl'
import { getRelativeTimeLabel } from '../../../utils/whatsOnTime'
import { resolveEventRealm } from '../../../utils/whatsOnUrl'
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
  const { creatorName, avatarFace } = useCreatorProfile(event.user, event.user_name, t('all_hangouts.unknown_creator'))
  const fallbackColor = getCreatorColor(event.user)
  const { copied, handleCopy, handleAddToCalendar } = useCardActions({
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

  // 560×315 CSS pixels at 2× DPR ≈ 1120 — keeps the rendered tile crisp while
  // letting the optimizer recompress raw posters into ~80 KB WebP.
  const optimizedSrc = useMemo(() => (event.image ? optimizedImageUrl(event.image, { width: 1120 }) : ''), [event.image])

  return (
    <FutureCardContainer onClick={handleClick}>
      {event.image && (
        <CardImageWrapper>
          <CardImage src={optimizedSrc} alt={event.name} loading="lazy" width={560} height={315} />
        </CardImageWrapper>
      )}
      <CardContent>
        <CardTitle>{event.name}</CardTitle>
        <CreatorRow data-role="creator-row">
          {avatarFace ? (
            <AvatarImage src={avatarFace} alt={creatorName} fallbackColor={fallbackColor} />
          ) : (
            <AvatarFallback fallbackColor={fallbackColor} />
          )}
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
              label={t('all_hangouts.remind_me')}
              onClick={handleRemindToggle}
            />
          ) : (
            <ActionTextButton onClick={handleAddToCalendar}>
              <CalendarIcon />
              <ActionTextLabel>{t('all_hangouts.add_to_calendar')}</ActionTextLabel>
            </ActionTextButton>
          )}
          {hasValidIdentity && (
            <Tooltip title={t('all_hangouts.add_to_calendar')} placement="top" arrow>
              <ActionButton onClick={handleAddToCalendar}>
                <CalendarIcon />
              </ActionButton>
            </Tooltip>
          )}
          <Tooltip title={copied ? t('all_hangouts.copied') : t('all_hangouts.copy_link')} placement="top" arrow>
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
