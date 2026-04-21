/* eslint-disable @typescript-eslint/naming-convention */
import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ShareIcon from '@mui/icons-material/Share'
import { AnimatedBackground, useMobileMediaQuery } from 'decentraland-ui2'
import { ResponsiveCard } from '../../components/jump/ResponsiveCard'
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
} from '../../features/jump'
import type { CardData, JumpEvent } from '../../features/jump/jump.types'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useRemindMe } from '../../hooks/useRemindMe'
import { CalendarButton, EventActions, ExploreEventsButton, ShareIconButton } from './EventsPage.styled'
import { JumpPageContainer, JumpPageContent } from './PageContainer.styled'

function buildGoogleCalendarUrl(event: JumpEvent, label: string): string {
  const params = new URLSearchParams()
  params.set('text', event.name)
  const jumpInUrl = `${getEnv('JUMP_IN_URL') ?? 'https://decentraland.org/jump'}/events?position=${event.x ?? 0},${event.y ?? 0}`
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

  const positionParam = searchParams.get('position') ?? DEFAULT_POSITION
  const realmParam = searchParams.get('realm') ?? DEFAULT_REALM
  const idParam = searchParams.get('id')

  const parsedPosition = useMemo(() => parsePosition(positionParam), [positionParam])
  const realm = realmParam === DEFAULT_REALM ? undefined : realmParam

  const byIdQuery = useGetJumpEventByIdQuery({ id: idParam ?? '' }, { skip: !idParam })
  const byPositionQuery = useGetJumpEventsQuery({ position: parsedPosition.coordinates, realm }, { skip: Boolean(idParam) })
  const placesQuery = useGetJumpPlacesQuery({ position: parsedPosition.coordinates, realm })

  const isLoading = byIdQuery.isLoading || byPositionQuery.isLoading
  const event = idParam ? byIdQuery.data : byPositionQuery.data?.[0]

  const creatorQuery = useGetProfileCreatorQuery({ address: event?.user ?? '' }, { skip: !event?.user })

  useEffect(() => {
    if (byIdQuery.isError || byPositionQuery.isError) {
      navigate('/jump/events/invalid')
      return
    }
    if (!isLoading && !event) {
      navigate('/jump/events/invalid')
    }
  }, [byIdQuery.isError, byPositionQuery.isError, event, isLoading, navigate])

  const cardData: CardData | undefined = useMemo(() => {
    if (!event) return undefined
    const mapped = fromEvent(event)
    if (event.live && placesQuery.data) {
      const match = placesQuery.data.find(place => place.title === event.scene_name || place.base_position === event.coordinates.join(','))
      if (match) return { ...mapped, user_count: match.user_count || 0 }
    }
    return mapped
  }, [event, placesQuery.data])

  // Watson-style Remind Me: identity check, optimistic update, bell shake.
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
    const url = `${getEnv('JUMP_IN_URL') ?? 'https://decentraland.org/jump'}/events?position=${event.x ?? 0},${event.y ?? 0}`
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
  }, [cardData, isMobile, isReminded, remindLoading, isShaking, formatMessage, handleAddToCalendar, handleRemindToggle, handleShare])

  const creator = creatorQuery.data ?? undefined

  return (
    <JumpPageContainer>
      <AnimatedBackground variant="fixed" />
      <JumpPageContent>
        <ResponsiveCard data={cardData} isLoading={isLoading} creator={creator}>
          {actions}
        </ResponsiveCard>
      </JumpPageContent>
    </JumpPageContainer>
  )
}

export { EventsPage }
