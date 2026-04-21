/* eslint-disable @typescript-eslint/naming-convention */
import { type ReactNode, memo } from 'react'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CircleRoundedIcon from '@mui/icons-material/CircleRounded'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import PersonIcon from '@mui/icons-material/Person'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import { Box, CircularProgress, Skeleton } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import { eventHasEnded } from '../../../features/jump/jump.helpers'
import type { CardData, Creator } from '../../../features/jump/jump.types'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import cardCreatorPlaceholder from '../../../images/jump/card-creator-placeholder.webp'
import cardEventsPlaceholder from '../../../images/jump/card-events-placeholder.webp'
import cardPlacesPlaceholder from '../../../images/jump/card-places-placeholder.webp'
import { CardImage, CardLoadingContainer, CreatorLabel } from '../Card/Card.styled'
import { LiveEventIcon } from '../LiveEventIcon'
import { ShareLinkButton } from '../ShareLinkButton'
import { TextWrapper } from '../TextWrapper'
import {
  MobileAttendeesBadge,
  MobileCardContainer,
  MobileCardContent,
  MobileCardCreator,
  MobileCardDate,
  MobileCardLocation,
  MobileCardTitle,
  MobileCreatorAvatar,
  MobileMiddleSection,
  MobileStickyBottomContainer,
  MobileTopSection,
  MobileUserProfileLink
} from './MobileCard.styled'

interface MobileCardProps {
  data?: CardData
  isLoading?: boolean
  creator?: Creator
  children?: ReactNode
  stickyContent?: ReactNode
}

function formatLocation(coordinates: [number, number]): string {
  return `${coordinates[0]}, ${coordinates[1]}`
}

const MobileCard = memo(function MobileCard({ data, isLoading = false, creator, children, stickyContent }: MobileCardProps) {
  const formatMessage = useFormatMessage()
  const profileUrlBase = getEnv('PROFILE_URL') ?? 'https://decentraland.org/profile/'

  if (isLoading || !data) {
    return (
      <MobileCardContainer>
        <MobileTopSection>
          <CardLoadingContainer>
            <CircularProgress disableShrink />
          </CardLoadingContainer>
        </MobileTopSection>
        <MobileMiddleSection style={{ paddingBottom: 175 }}>
          <MobileCardContent>
            <Skeleton variant="text" animation="wave" sx={{ fontSize: 24, fontWeight: 700, marginBottom: '8px' }} />
            <Skeleton variant="text" animation="wave" sx={{ fontSize: 14, marginBottom: '6px' }} />
            <Skeleton variant="text" animation="wave" sx={{ fontSize: 14, marginBottom: '6px' }} />
            <Skeleton variant="text" animation="wave" sx={{ fontSize: 14, marginBottom: '12px' }} />
            <Skeleton variant="rectangular" animation="wave" sx={{ height: 60 }} />
          </MobileCardContent>
        </MobileMiddleSection>
        {stickyContent && <MobileStickyBottomContainer>{stickyContent}</MobileStickyBottomContainer>}
      </MobileCardContainer>
    )
  }

  const isEvent = data.type === 'event'
  const displayUserName = creator?.user_name || data.user_name
  const displayUser = creator?.user || data.user
  const displayAvatar = creator?.avatar || cardCreatorPlaceholder
  const hasEnded = eventHasEnded(data)
  const imageSrc = data.image || (isEvent ? cardEventsPlaceholder : cardPlacesPlaceholder)
  const altKey = isEvent ? 'component.jump.card.accessibility.event_image' : 'component.jump.card.accessibility.place_image'

  return (
    <MobileCardContainer>
      <MobileTopSection>
        <CardImage src={imageSrc} alt={formatMessage(altKey, { title: data.title })} />
        {isEvent && (
          <MobileAttendeesBadge backgroundColor={data.live ? '#FF2D55' : '#FCFCFC'} style={{ color: data.live ? '#ffffff' : '#161518' }}>
            {data.live ? (
              <>
                <LiveEventIcon />
                {formatMessage('component.jump.card.event.live')} +{data.user_count || 0}
              </>
            ) : (
              <>
                <NotificationsRoundedIcon sx={{ fontSize: 14, color: '#FF2D55' }} />+{data.total_attendees ?? 0}
              </>
            )}
          </MobileAttendeesBadge>
        )}
        {!isEvent && data.user_count && data.user_count > 0 ? (
          <MobileAttendeesBadge backgroundColor="#FCFCFC">
            <CircleRoundedIcon sx={{ fontSize: 14 }} htmlColor="#00A146" />
            <PersonIcon sx={{ fontSize: 14 }} />
            {data.user_count}
          </MobileAttendeesBadge>
        ) : null}
      </MobileTopSection>

      <MobileMiddleSection>
        <MobileCardContent>
          <MobileCardTitle>{data.title}</MobileCardTitle>
          <MobileCardCreator>
            <MobileCreatorAvatar
              src={displayAvatar}
              alt={formatMessage('component.jump.card.accessibility.creator_avatar', { userName: displayUserName })}
            />
            <CreatorLabel>{formatMessage('component.jump.card.creator.by')} </CreatorLabel>
            {displayUser ? (
              <MobileUserProfileLink
                href={`${profileUrlBase}accounts/${displayUser}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={formatMessage('component.jump.card.accessibility.user_profile_link', { userName: displayUserName })}
              >
                {displayUserName}
              </MobileUserProfileLink>
            ) : (
              <Box component="span" sx={{ color: '#FF2D55', fontSize: 16, fontWeight: 500 }}>
                {displayUserName}
              </Box>
            )}
          </MobileCardCreator>
          <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {isEvent && data.start_at && (
              <MobileCardDate eventHasEnded={hasEnded}>
                <AccessTimeIcon sx={{ fontSize: 16 }} />
                {hasEnded ? formatMessage('component.jump.event.has_ended') : data.start_at}
              </MobileCardDate>
            )}
            <MobileCardLocation>
              <PlaceOutlinedIcon sx={{ fontSize: 16 }} />
              {data?.realm ?? formatLocation(data.coordinates)}
            </MobileCardLocation>
          </Box>
          <TextWrapper maxHeight={250} gradientColor="#2E013E">
            <Box sx={{ fontSize: 16, color: '#ffffff', lineHeight: 1.5 }}>
              {data.description || formatMessage('component.jump.card.place.default_description')}
            </Box>
          </TextWrapper>
        </MobileCardContent>
      </MobileMiddleSection>

      <MobileStickyBottomContainer>{children ?? <ShareLinkButton url={data?.url} title={data?.title} />}</MobileStickyBottomContainer>
    </MobileCardContainer>
  )
})

export { MobileCard }
export type { MobileCardProps }
