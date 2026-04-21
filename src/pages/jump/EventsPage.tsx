/* eslint-disable @typescript-eslint/naming-convention */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CheckIcon from '@mui/icons-material/Check'
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import ShareIcon from '@mui/icons-material/Share'
import { Box, CircularProgress, Snackbar, Typography, useMobileMediaQuery } from 'decentraland-ui2'
import { ResponsiveCard } from '../../components/jump/ResponsiveCard'
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
  useGetProfileCreatorQuery,
  useToggleJumpAttendeeMutation
} from '../../features/jump'
import type { CardData, JumpEvent } from '../../features/jump/jump.types'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { redirectToAuth } from '../../utils/authRedirect'
import { CalendarButton, EventActions, ExploreEventsButton, RemindMeButton, ShareIconButton } from './EventsPage.styled'
import { JumpPageContainer } from './PageContainer.styled'

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

interface SnackbarState {
  open: boolean
  action: 'added' | 'removed' | 'error'
  title: string
}

const EventsPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const formatMessage = useFormatMessage()
  const isMobile = useMobileMediaQuery()
  const { identity, hasValidIdentity } = useAuthIdentity()

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

  const [attendingOverride, setAttendingOverride] = useState<boolean | null>(null)
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, action: 'added', title: '' })
  const [toggleAttendee, { isLoading: toggleLoading }] = useToggleJumpAttendeeMutation()

  const isAttending = attendingOverride ?? Boolean(cardData?.attending)

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

  const handleToggleAttendance = useCallback(async () => {
    if (!event) return
    if (!hasValidIdentity || !identity) {
      redirectToAuth(window.location.pathname, Object.fromEntries(searchParams.entries()))
      return
    }
    const nextAttending = !isAttending
    try {
      const result = await toggleAttendee({ eventId: event.id, attending: nextAttending, identity }).unwrap()
      if (result?.ok) {
        setAttendingOverride(nextAttending)
        setSnackbar({ open: true, action: nextAttending ? 'added' : 'removed', title: event.name })
      } else {
        setSnackbar({ open: true, action: 'error', title: event.name })
      }
    } catch (error) {
      console.error('Attendance toggle failed', error)
      setSnackbar({ open: true, action: 'error', title: event.name })
    }
  }, [event, hasValidIdentity, identity, isAttending, searchParams, toggleAttendee])

  const handleSnackbarClose = useCallback(() => setSnackbar(prev => ({ ...prev, open: false })), [])

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
          startIcon={<DateRangeRoundedIcon sx={{ fontSize: 16 }} />}
          aria-label={formatMessage('component.jump.card.accessibility.add_to_calendar_button')}
          onClick={handleAddToCalendar}
        >
          {formatMessage('component.jump.card.event.add_to_calendar')}
        </CalendarButton>
        <RemindMeButton
          variant="outlined"
          attending={isAttending}
          disabled={toggleLoading}
          startIcon={
            toggleLoading ? (
              <CircularProgress size={16} sx={{ color: isAttending ? '#FF2D55' : '#161518' }} />
            ) : isAttending ? (
              <NotificationsRoundedIcon sx={{ fontSize: 16 }} />
            ) : (
              <NotificationsNoneRoundedIcon sx={{ fontSize: 16 }} />
            )
          }
          aria-label={formatMessage('component.jump.card.accessibility.interested_button')}
          onClick={handleToggleAttendance}
        >
          {formatMessage('component.jump.card.event.interested')}
        </RemindMeButton>
        <ShareIconButton
          variant="outlined"
          aria-label={formatMessage('component.jump.card.accessibility.share_button')}
          onClick={handleShare}
        >
          <ShareIcon sx={{ fontSize: 16, color: '#FF2D55' }} />
        </ShareIconButton>
      </EventActions>
    )
  }, [cardData, isMobile, isAttending, toggleLoading, formatMessage, handleAddToCalendar, handleToggleAttendance, handleShare])

  const creator = creatorQuery.data ?? undefined

  return (
    <JumpPageContainer>
      <ResponsiveCard data={cardData} isLoading={isLoading} creator={creator}>
        {actions}
      </ResponsiveCard>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: isMobile ? 160 : undefined }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            backgroundColor: '#000000',
            color: '#ffffff',
            borderRadius: 1.5,
            px: 2,
            py: 1.5,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          <CheckIcon sx={{ fontSize: 20, color: '#ffffff' }} />
          <Typography variant="body2" sx={{ fontSize: 14, fontWeight: 600 }}>
            {formatMessage(
              snackbar.action === 'added'
                ? 'component.jump.event.snackbar.added_to_my_events'
                : snackbar.action === 'removed'
                  ? 'component.jump.event.snackbar.removed_from_my_events'
                  : 'component.jump.event.snackbar.attendance_error',
              { eventTitle: snackbar.title }
            )}
          </Typography>
        </Box>
      </Snackbar>
    </JumpPageContainer>
  )
}

export { EventsPage }
