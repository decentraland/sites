/* eslint-disable @typescript-eslint/naming-convention */
import { type ReactNode, memo } from 'react'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CircleRoundedIcon from '@mui/icons-material/CircleRounded'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import PersonIcon from '@mui/icons-material/Person'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import { CircularProgress, Skeleton, useMobileMediaQuery } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import { eventHasEnded, formatLocation } from '../../../features/jump/jump.helpers'
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
  ContentSection,
  CreatorAvatar,
  CreatorLabel,
  DescriptionText,
  ImageSection,
  MetaRow,
  StickyBottomContainer,
  UserProfileLink
} from './Card.styled'

interface CardProps {
  data?: CardData
  isLoading?: boolean
  creator?: Creator
  children?: ReactNode
}

const Card = memo(function Card({ data, isLoading = false, creator, children }: CardProps) {
  const formatMessage = useFormatMessage()
  const isMobile = useMobileMediaQuery()
  const profileUrlBase = getEnv('PROFILE_URL') ?? 'https://decentraland.org/profile/'

  if (isLoading || !data) {
    return (
      <CardContainer>
        <ImageSection>
          <CardLoadingContainer>
            <CircularProgress disableShrink />
          </CardLoadingContainer>
        </ImageSection>
        <ContentSection>
          <CardContent sx={{ gap: 1.5 }}>
            <Skeleton variant="text" animation="wave" sx={{ fontSize: 28, fontWeight: 700, marginBottom: '12px' }} />
            <Skeleton variant="text" animation="wave" sx={{ fontSize: 16, marginBottom: '8px' }} />
            <Skeleton variant="text" animation="wave" sx={{ fontSize: 16, marginBottom: '8px' }} />
            <Skeleton variant="text" animation="wave" sx={{ fontSize: 16, marginBottom: '16px' }} />
            <Skeleton variant="rectangular" animation="wave" sx={{ height: 80 }} />
          </CardContent>
        </ContentSection>
      </CardContainer>
    )
  }

  const isEvent = data.type === 'event'
  const displayUserName = creator?.user_name || data.user_name
  const displayUser = creator?.user || data.user
  const displayAvatar = creator?.avatar || data.user_avatar || cardCreatorPlaceholder
  const hasEnded = eventHasEnded(data)
  const imageSrc = data.image || (isEvent ? cardEventsPlaceholder : cardPlacesPlaceholder)
  const altKey = isEvent ? 'component.jump.card.accessibility.event_image' : 'component.jump.card.accessibility.place_image'

  const jumpInFallback =
    !isEvent || data.live ? (
      <JumpInButton position={data.position} realm={data.realm} fullWidth size="large">
        {formatMessage('component.jump.jump_in_button.jump_in')}
      </JumpInButton>
    ) : null
  const bottomSlot = children ?? jumpInFallback

  return (
    <CardContainer>
      <ImageSection>
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
      </ImageSection>
      <ContentSection>
        <CardContent>
          <CardTitle>{data.title}</CardTitle>
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
          <TextWrapper maxHeight={isMobile ? 250 : 128} gradientColor={isMobile ? '#2E013E' : '#380A4D'}>
            <DescriptionText>{data.description || formatMessage('component.jump.card.place.default_description')}</DescriptionText>
          </TextWrapper>
        </CardContent>
        {!isMobile && bottomSlot}
      </ContentSection>
      {isMobile && bottomSlot && <StickyBottomContainer>{bottomSlot}</StickyBottomContainer>}
    </CardContainer>
  )
})

export { Card }
export type { CardProps }
