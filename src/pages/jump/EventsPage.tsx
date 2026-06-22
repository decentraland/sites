/* eslint-disable @typescript-eslint/naming-convention */
import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ShareIcon from '@mui/icons-material/Share'
import { AnimatedBackground, useMobileMediaQuery } from 'decentraland-ui2'
import { Card } from '../../components/jump/Card'
import { CalendarAddIcon } from '../../components/whats-on/common/CalendarAddIcon'
import { RemindMeButton as WatsonRemindMeButton } from '../../components/whats-on/common/RemindMeButton'
import { getEnv } from '../../config/env'
import {
  DEFAULT_POSITION,
  DEFAULT_REALM,
  eventHasEnded,
  formatDateForGoogleCalendar,
  fromEvent,
  parsePosition,
  useGetJumpEventByIdQuery,
  useGetJumpEventsQuery,
  useGetJumpPlacesQuery,
  useGetProfileCreatorQuery
} from '../../features/places'
import type { CardData, JumpEvent } from '../../features/places/places.types'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useRemindMe } from '../../hooks/useRemindMe'
import { appendRealmParam, resolveEventRealm } from '../../utils/whatsOnUrl'
import { CalendarButton, DeletedNotice, DeletedNoticeLink, EventActions, ExploreEventsButton, ShareIconButton } from './EventsPage.styled'
import { JumpPageContainer, JumpPageContent } from './PageContainer.styled'

function buildJumpEventShareUrl(event: JumpEvent): string {
  const base = `${getEnv('JUMP_IN_URL') ?? 'https://decentraland.org/jump'}/events?position=${event.x},${event.y}`
  return appendRealmParam(base, resolveEventRealm(event.world, event.server))
}

function buildGoogleCalendarUrl(event: JumpEvent, label: string): string {
  const params = new URLSearchParams()
  params.set('text', event.name)
  const jumpInUrl = buildJumpEventShareUrl(event)
  const details = event.description ? `${event.description}\n\n${label}: ${jumpInUrl}` : `${label}: ${jumpInUrl}`
  params.set('details', details)
  const start = formatDateForGoogleCalendar(new Date(event.start_at))
  const finish = formatDateForGoogleCalendar(new Date(event.finish_at))
  params.set('dates', `${start}/${finish}`)
  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`
}

const EventsPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const formatMessage = useFormatMessage()
  const isMobile = useMobileMediaQuery()
  const { address } = useAuthIdentity()

  const rawPositionParam = searchParams.get('position')
  const positionParam = rawPositionParam ?? DEFAULT_POSITION
  // Accept `?world=` as an alias of `?realm=` so legacy share links emitted by
  // older clients keep resolving to the same world.
  const realmParam = searchParams.get('realm') ?? searchParams.get('world') ?? DEFAULT_REALM
  const idParam = searchParams.get('id')

  const parsedPosition = useMemo(() => parsePosition(positionParam), [positionParam])
  const realm = realmParam === DEFAULT_REALM ? undefined : realmParam

  // The live-event user_count enrichment reads from the Places API. Forward a
  // position only when one is explicitly present, or when there is no World
  // realm, so a World event WITHOUT a position keeps resolving to `/worlds`
  // (matching pre-fix behavior) instead of the per-scene `/places` lookup.
  const placesPosition = rawPositionParam !== null || !realm ? parsedPosition.coordinates : undefined

  const byIdQuery = useGetJumpEventByIdQuery({ id: idParam ?? '', address }, { skip: !idParam })
  const byPositionQuery = useGetJumpEventsQuery({ position: parsedPosition.coordinates, realm, address }, { skip: Boolean(idParam) })
  const placesQuery = useGetJumpPlacesQuery({ position: placesPosition, realm })

  const isLoading = byIdQuery.isLoading || byPositionQuery.isLoading
  const event = idParam ? byIdQuery.data : byPositionQuery.data?.[0]
  const isEventDeleted = Boolean(event?.deleted_by_user || event?.deleted_by_admin)

  const creatorQuery = useGetProfileCreatorQuery({ address: event?.user ?? '' }, { skip: !event?.user })

  useEffect(() => {
    const isInvalidPosition = !idParam && !parsedPosition.isValid
    if (isInvalidPosition || byIdQuery.isError || byPositionQuery.isError) {
      navigate('/jump/events/invalid')
      return
    }
    if (!isLoading && !event) {
      navigate('/jump/events/invalid')
    }
  }, [idParam, parsedPosition.isValid, byIdQuery.isError, byPositionQuery.isError, event, isLoading, navigate])

  const cardData: CardData | undefined = useMemo(() => {
    if (!event) return undefined
    const mapped = fromEvent(event)
    // A deleted hangout must not advertise itself as live nor as ended, even if the backend
    // still reports it: clearing `finish_at_iso` keeps the card on the plain date row.
    if (isEventDeleted) return { ...mapped, live: false, finish_at_iso: undefined }
    if (event.live && placesQuery.data) {
      const match = placesQuery.data.find(place => place.title === event.scene_name || place.base_position === event.coordinates.join(','))
      if (match) return { ...mapped, user_count: match.user_count || 0 }
    }
    return mapped
  }, [event, placesQuery.data, isEventDeleted])

  // Watson-style Remind Me: identity check, optimistic update, bell shake.
  // Cross-API cache invalidation (eventsClient → placesClient JumpEvent tag)
  // is handled by `createJumpEventsListenerMiddleware`, so the card refreshes
  // automatically when `toggleAttendee` fulfils.
  const {
    isReminded,
    isLoading: remindLoading,
    isShaking,
    handleToggle: handleRemindToggle
  } = useRemindMe(event?.id ?? '', Boolean(cardData?.attending))

  const handleAddToCalendar = useCallback(() => {
    if (!event) return
    const label = formatMessage('component.jump.events_page.calendar_label')
    window.open(buildGoogleCalendarUrl(event, label), '_blank', 'noopener,noreferrer')
  }, [event, formatMessage])

  const handleShare = useCallback(async () => {
    if (!event) return
    const title = event.name
    const text = event.description
    const url = buildJumpEventShareUrl(event)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url })
        return
      } catch {
        /* fallback to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
    } catch (error) {
      console.error('Share failed', error)
    }
  }, [event])

  const actions = useMemo(() => {
    if (!cardData || !cardData.start_at) return null

    // Soft-deleted hangouts stay reachable by URL but lose every action.
    if (isEventDeleted) {
      return (
        <EventActions isMobile={isMobile}>
          <DeletedNotice>
            {formatMessage('component.jump.events_page.deleted_notice_prefix')}{' '}
            <DeletedNoticeLink to="/whats-on">{formatMessage('component.jump.events_page.deleted_notice_link')}</DeletedNoticeLink>{' '}
            {formatMessage('component.jump.events_page.deleted_notice_suffix')}
          </DeletedNotice>
        </EventActions>
      )
    }

    const hasEnded = eventHasEnded(cardData)
    if (cardData.live) return null

    if (hasEnded) {
      return (
        <EventActions isMobile={isMobile}>
          <ExploreEventsButton variant="contained" color="secondary" href={getEnv('EVENTS_URL')} size="large" fullWidth>
            {formatMessage('component.jump.events_page.explore_events_button')}
          </ExploreEventsButton>
        </EventActions>
      )
    }

    return (
      <EventActions isMobile={isMobile}>
        <CalendarButton
          variant="outlined"
          startIcon={<CalendarAddIcon size={16} />}
          aria-label={formatMessage('component.jump.card.accessibility.add_to_calendar_button')}
          onClick={handleAddToCalendar}
        >
          {formatMessage('component.jump.card.event.add_to_calendar')}
        </CalendarButton>
        <WatsonRemindMeButton
          isReminded={isReminded}
          isLoading={remindLoading}
          isShaking={isShaking}
          label={formatMessage('component.jump.card.event.interested')}
          onClick={handleRemindToggle}
        />
        <ShareIconButton
          variant="outlined"
          aria-label={formatMessage('component.jump.card.accessibility.share_button')}
          onClick={handleShare}
        >
          <ShareIcon sx={{ fontSize: 16, color: '#FF2D55' }} />
        </ShareIconButton>
      </EventActions>
    )
  }, [
    cardData,
    isEventDeleted,
    isMobile,
    isReminded,
    remindLoading,
    isShaking,
    formatMessage,
    handleAddToCalendar,
    handleRemindToggle,
    handleShare
  ])

  const creator = creatorQuery.data ?? undefined

  return (
    <JumpPageContainer>
      <AnimatedBackground variant="fixed" />
      <JumpPageContent>
        <Card data={cardData} isLoading={isLoading} creator={creator}>
          {actions}
        </Card>
      </JumpPageContent>
    </JumpPageContainer>
  )
}

export { EventsPage }
