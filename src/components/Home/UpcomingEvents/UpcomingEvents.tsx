import { memo, useMemo } from 'react'
import { AnimatedBackground } from 'decentraland-ui2'
import { useGetUpcomingEventsQuery } from '../../../features/events/events.client'
import type { EventEntry } from '../../../features/events/events.types'
import { useGetProfileQuery } from '../../../features/profile/profile.client'
import {
  AuthorAvatar,
  AuthorRow,
  AuthorText,
  CardBody,
  CardImage,
  CardTitle,
  CardsGrid,
  EventCardRoot,
  SectionTitle,
  SkeletonAuthorRow,
  SkeletonAuthorText,
  SkeletonAvatar,
  SkeletonBody,
  SkeletonCardRoot,
  SkeletonImage,
  SkeletonTitle,
  SkeletonTitleShort,
  UpcomingContainer
} from './UpcomingEvents.styled'

const LOADING_PLACEHOLDERS = [0, 1, 2, 3]

const UpcomingEventCard = memo(({ event }: { event: EventEntry }) => {
  const { data: profile } = useGetProfileQuery(event.user, { skip: !event.user })
  const avatar = profile?.avatars?.[0]
  const displayName = event.user_name || avatar?.name || 'Anonymous'
  const faceUrl = avatar?.avatar?.snapshots?.face256

  return (
    <EventCardRoot href={event.url} target="_blank" rel="noopener noreferrer" aria-label={event.name}>
      <CardImage
        role="img"
        aria-hidden="true"
        style={event.image ? { backgroundImage: `url(${event.image})` } : undefined}
      />
      <CardBody>
        <CardTitle>{event.name}</CardTitle>
        <AuthorRow>
          <AuthorAvatar
            role="img"
            aria-hidden="true"
            style={faceUrl ? { backgroundImage: `url(${faceUrl})` } : undefined}
          />
          <AuthorText>
            by <strong>{displayName}</strong>
          </AuthorText>
        </AuthorRow>
      </CardBody>
    </EventCardRoot>
  )
})

UpcomingEventCard.displayName = 'UpcomingEventCard'

const SkeletonCard = memo(() => (
  <SkeletonCardRoot>
    <SkeletonImage variant="rectangular" />
    <SkeletonBody>
      <SkeletonTitle variant="rectangular" />
      <SkeletonTitleShort variant="rectangular" />
      <SkeletonAuthorRow>
        <SkeletonAvatar variant="circular" />
        <SkeletonAuthorText variant="rectangular" />
      </SkeletonAuthorRow>
    </SkeletonBody>
  </SkeletonCardRoot>
))

SkeletonCard.displayName = 'SkeletonCard'

const UpcomingEvents = memo(() => {
  const { data, isLoading } = useGetUpcomingEventsQuery()

  const events = useMemo(() => (data ?? []).slice(0, 4), [data])

  if (!isLoading && events.length === 0) return null

  return (
    <UpcomingContainer>
      <AnimatedBackground variant="absolute" />
      <SectionTitle variant="h3">Upcoming</SectionTitle>
      <CardsGrid>
        {isLoading
          ? LOADING_PLACEHOLDERS.map(i => <SkeletonCard key={i} />)
          : events.map(event => <UpcomingEventCard key={event.id} event={event} />)}
      </CardsGrid>
    </UpcomingContainer>
  )
})

UpcomingEvents.displayName = 'UpcomingEvents'

export { UpcomingEvents }
