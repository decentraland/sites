import { memo, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import { CircularProgress } from 'decentraland-ui2'
import { useWorldContext } from '../../../components/creators/CreatorWorldLayout'
import { useGetEventsQuery } from '../../../features/events'
import type { EventEntry } from '../../../features/events'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useBlogPageTracking } from '../../../hooks/useBlogPageTracking'
import { EventInfo, EventItem, EventList, EventMeta, EventName, EventThumb, LiveTag } from './EventsPage.styled'
import { GhostButton, Helper, PrimaryButton, SectionCard, SectionHeaderRow, SectionTitle, SpinnerBox } from './world.styled'

const SCHEDULE_URL = '/whats-on/new-hangout'

interface EventRowProps {
  event: EventEntry
  liveLabel: string
  attendeesLabel: (count: number) => string
}

// Memo'd list row (rule 11).
const EventRow = memo(function EventRow({ event, liveLabel, attendeesLabel }: EventRowProps) {
  const when = event.next_start_at || event.start_at
  return (
    <EventItem href={event.url} target="_blank" rel="noopener noreferrer">
      <EventThumb $image={event.image || undefined} />
      <EventInfo>
        <EventName>{event.name}</EventName>
        <EventMeta>
          {event.live ? <LiveTag>{liveLabel}</LiveTag> : null}
          <span>{when ? new Date(when).toLocaleString() : ''}</span>
          <span>· {attendeesLabel(event.total_attendees ?? 0)}</span>
        </EventMeta>
      </EventInfo>
    </EventItem>
  )
})

function EventsPage() {
  const t = useFormatMessage()
  const { worldName } = useWorldContext()

  // The events API has no per-world filter, so fetch active world events and
  // match the world name client-side (it lives on the `server` field).
  const { data, isLoading, isError } = useGetEventsQuery({ list: 'active', world: true })

  const worldEvents = useMemo(
    () =>
      (data ?? []).filter(event => (event.server ?? '').toLowerCase() === worldName).sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [data, worldName]
  )

  useBlogPageTracking({
    name: `${t('page.creators.world.nav.events')} · ${worldName}`,
    properties: { section: 'creators_world_events', world: worldName }
  })

  const attendeesLabel = (count: number) => t('page.creators.world.events_attendees', { count })

  return (
    <SectionCard>
      <Helmet>
        <title>{`${t('page.creators.world.nav.events')} · ${worldName}`}</title>
      </Helmet>
      <SectionHeaderRow>
        <SectionTitle>{t('page.creators.world.nav.events')}</SectionTitle>
      </SectionHeaderRow>
      <Helper>{t('page.creators.world.events_hint')}</Helper>

      {isLoading ? (
        <SpinnerBox>
          <CircularProgress size={24} />
        </SpinnerBox>
      ) : isError ? (
        <Helper>{t('page.creators.world.events_load_error')}</Helper>
      ) : worldEvents.length === 0 ? (
        <>
          <Helper>{t('page.creators.world.events_empty')}</Helper>
          <PrimaryButton disableRipple startIcon={<EventAvailableIcon />} href={SCHEDULE_URL}>
            {t('page.creators.world.events_schedule')}
          </PrimaryButton>
        </>
      ) : (
        <>
          <EventList>
            {worldEvents.map(event => (
              <EventRow key={event.id} event={event} liveLabel={t('page.creators.world.events_live')} attendeesLabel={attendeesLabel} />
            ))}
          </EventList>
          <GhostButton disableRipple startIcon={<EventAvailableIcon />} href={SCHEDULE_URL}>
            {t('page.creators.world.events_schedule')}
          </GhostButton>
        </>
      )}
    </SectionCard>
  )
}

export { EventsPage }
