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
import { JumpInButton } from '../JumpInButton'
import { LiveEventIcon } from '../LiveEventIcon'
import { TextWrapper } from '../TextWrapper'
import {
  AttendeesBadge,
  CardContainer,
  CardContent,
  CardCreator,
  CardDate,
  CardImage,
  CardLoadingContainer,
  CardLocation,
  CardTitle,
  CreatorAvatar,
  CreatorLabel,
  LeftSection,
  MetaRow,
  RightSection,
  UserProfileLink
} from './Card.styled'

interface CardProps {
  data?: CardData
  isLoading?: boolean
  creator?: Creator
  children?: ReactNode
}

function formatLocation(coordinates: [number, number]): string {
  return `${coordinates[0]}, ${coordinates[1]}`
}

const Card = memo(function Card({ data, isLoading = false, creator, children }: CardProps) {
  const formatMessage = useFormatMessage()
  const profileUrlBase = getEnv('PROFILE_URL') ?? 'https://decentraland.org/profile/'

  if (isLoading || !data) {
    return (
      <CardContainer>
        <LeftSection>
          <CardLoadingContainer>
            <CircularProgress disableShrink />
          </CardLoadingContainer>
        </LeftSection>
        <RightSection>
          <CardContent sx={{ gap: 1.5 }}>
            <Skeleton variant="text" animation="wave" sx={{ fontSize: 28, fontWeight: 700, marginBottom: '12px' }} />
            <Skeleton variant="text" animation="wave" sx={{ fontSize: 16, marginBottom: '8px' }} />
            <Skeleton variant="text" animation="wave" sx={{ fontSize: 16, marginBottom: '8px' }} />
            <Skeleton variant="text" animation="wave" sx={{ fontSize: 16, marginBottom: '16px' }} />
            <Skeleton variant="rectangular" animation="wave" sx={{ height: 80 }} />
          </CardContent>
        </RightSection>
      </CardContainer>
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
    <CardContainer>
      <LeftSection>
        <CardImage src={imageSrc} alt={formatMessage(altKey, { title: data.title })} />
        {isEvent && (
          <AttendeesBadge backgroundColor={data.live ? '#FF2D55' : '#FCFCFC'} style={{ color: data.live ? '#ffffff' : '#161518' }}>
            {data.live ? (
              <>
                <LiveEventIcon />
                {formatMessage('component.jump.card.event.live')} +{data.user_count || 0}
              </>
            ) : (
              <>
                <NotificationsRoundedIcon sx={{ fontSize: 16, color: '#FF2D55' }} />+{data.total_attendees ?? 0}
              </>
            )}
          </AttendeesBadge>
        )}
        {!isEvent && data.user_count && data.user_count > 0 ? (
          <AttendeesBadge backgroundColor="#FCFCFC">
            <CircleRoundedIcon sx={{ fontSize: 16, color: '#00A146' }} />
            <PersonIcon sx={{ fontSize: 16, color: '#161518' }} />
            {data.user_count}
          </AttendeesBadge>
        ) : null}
      </LeftSection>
      <RightSection>
        <CardContent>
          <CardTitle style={{ marginBottom: 16 }}>{data.title}</CardTitle>
          <CardCreator>
            <CreatorAvatar
              src={displayAvatar}
              alt={formatMessage('component.jump.card.accessibility.creator_avatar', { userName: displayUserName })}
            />
            <CreatorLabel>{formatMessage('component.jump.card.creator.by')} </CreatorLabel>
            {displayUser ? (
              <UserProfileLink
                href={`${profileUrlBase}accounts/${displayUser}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={formatMessage('component.jump.card.accessibility.user_profile_link', { userName: displayUserName })}
              >
                {displayUserName}
              </UserProfileLink>
            ) : (
              displayUserName
            )}
          </CardCreator>
          <MetaRow>
            {isEvent && data.start_at && (
              <CardDate eventHasEnded={hasEnded}>
                <AccessTimeIcon sx={{ fontSize: 16 }} />
                {hasEnded ? formatMessage('component.jump.event.has_ended') : data.start_at}
              </CardDate>
            )}
            <CardLocation>
              <PlaceOutlinedIcon sx={{ fontSize: 16 }} />
              {data?.realm ?? formatLocation(data.coordinates)}
            </CardLocation>
          </MetaRow>
          <TextWrapper maxHeight={128} gradientColor="#380A4D">
            <Box sx={{ fontSize: 20, color: '#ffffff', lineHeight: 1.6 }}>
              {data.description || formatMessage('component.jump.card.place.default_description')}
            </Box>
          </TextWrapper>
        </CardContent>

        {children}

        {!children && (!isEvent || data.live) && (
          <JumpInButton position={data.position} realm={data.realm} fullWidth size="large">
            {formatMessage('component.jump.jump_in_button.jump_in')}
          </JumpInButton>
        )}
      </RightSection>
    </CardContainer>
  )
})

export { Card }
export type { CardProps }
