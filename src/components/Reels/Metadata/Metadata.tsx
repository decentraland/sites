import { type MouseEvent, memo, useCallback, useEffect, useState } from 'react'
import { LocationOnOutlined } from '@mui/icons-material'
import { useAnalytics } from '@dcl/hooks'
import { buildAvatarUrl, buildJumpInUrl, buildPlaceUrl, buildProfileUrl, formatPhotoDate } from '../../../features/reels'
import type { ImageMetadata } from '../../../features/reels'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { SegmentEvent } from '../../../modules/segment'
import { LoadingText } from '../LoadingText'
import { Logo } from '../Logo'
import { UserMetadata } from './UserMetadata'
import {
  ContentWrapper,
  DateLine,
  Divider,
  JumpInButton,
  LogoHeader,
  MetadataContainer,
  PeopleContainer,
  PeopleTitle,
  PlaceLeftSide,
  PlaceLine,
  PlaceLink,
  PlaceText,
  SectionTitle,
  UserAvatar,
  UserLine,
  UserNameLink
} from './Metadata.styled'

interface MetadataProps {
  metadata: ImageMetadata
  loading: boolean
  visible: boolean
}

const Metadata = memo(({ metadata, loading, visible }: MetadataProps) => {
  const l = useFormatMessage()
  const { track } = useAnalytics()
  const [placeUrl, setPlaceUrl] = useState<string | null>(null)

  const x = metadata.scene.location.x
  const y = metadata.scene.location.y

  useEffect(() => {
    const controller = new AbortController()
    void buildPlaceUrl(x, y, controller.signal).then(url => {
      if (!controller.signal.aborted) setPlaceUrl(url)
    })
    return () => controller.abort()
  }, [x, y])

  const jumpInUrl = buildJumpInUrl(x, y, metadata.realm)
  const profileUrl = metadata.userAddress ? buildProfileUrl(metadata.userAddress) : undefined

  const handlePlaceClick = useCallback(
    (_event: MouseEvent<HTMLAnchorElement>) => {
      track(SegmentEvent.REELS_CLICK_PLACE, { x, y })
    },
    [track, x, y]
  )

  const handleJumpInClick = useCallback(() => {
    track(SegmentEvent.REELS_JUMP_IN, { x, y })
  }, [track, x, y])

  const handleProfileClick = useCallback(() => {
    track(SegmentEvent.REELS_CLICK_PROFILE, { userAddress: metadata.userAddress })
  }, [track, metadata.userAddress])

  return (
    <MetadataContainer
      sx={
        visible
          ? undefined
          : {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              '@media (max-width: 1199px)': { height: 0 }
            }
      }
    >
      <LogoHeader>
        <Logo />
      </LogoHeader>
      <ContentWrapper>
        <SectionTitle variant="h1">{l('component.reels.metadata.title')}</SectionTitle>
        {loading ? (
          <>
            <LoadingText type="span" size="medium" />
            <LoadingText type="span" size="large" />
          </>
        ) : (
          <>
            <DateLine>{formatPhotoDate(metadata.dateTime)}</DateLine>
            <UserLine>
              <span>{l('component.reels.metadata.photo_taken_by')}</span>
              <UserAvatar src={buildAvatarUrl(metadata.userAddress)} alt="" loading="lazy" />
              {profileUrl ? (
                <UserNameLink href={profileUrl} target="_blank" rel="noopener noreferrer" onClick={handleProfileClick}>
                  {metadata.userName}
                </UserNameLink>
              ) : (
                <span style={{ marginLeft: 8 }}>{metadata.userName}</span>
              )}
            </UserLine>
          </>
        )}
        <SectionTitle variant="h1">{l('component.reels.metadata.place')}</SectionTitle>
        {loading ? (
          <LoadingText type="span" size="full" />
        ) : (
          <PlaceLine>
            <PlaceLeftSide>
              <LocationOnOutlined fontSize="small" />
              {placeUrl ? (
                <PlaceLink href={placeUrl} target="_blank" rel="noopener noreferrer" onClick={handlePlaceClick}>
                  {metadata.scene.name} {x},{y}
                </PlaceLink>
              ) : (
                <PlaceText>
                  {metadata.scene.name} {x},{y}
                </PlaceText>
              )}
            </PlaceLeftSide>
            <JumpInButton href={jumpInUrl} target="_blank" rel="noopener noreferrer" onClick={handleJumpInClick}>
              {l('component.reels.metadata.jump_in')}
            </JumpInButton>
          </PlaceLine>
        )}
        <Divider />
      </ContentWrapper>
      <PeopleTitle variant="h1">{l('component.reels.metadata.people')}</PeopleTitle>
      <PeopleContainer>
        {loading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <ContentWrapper key={idx}>
                <LoadingText type="p" size="full" />
              </ContentWrapper>
            ))
          : metadata.visiblePeople.map((user, index) => (
              <UserMetadata
                key={user.userAddress || index}
                user={user}
                isFirst={index === 0}
                initialWearableVisibility={index === 0 && (user.wearablesParsed ?? []).length > 0}
              />
            ))}
      </PeopleContainer>
    </MetadataContainer>
  )
})

export { Metadata }
