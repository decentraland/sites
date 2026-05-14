import type { RecurrentFrequency } from '../types/recurrence.types'

function appendRealmParam(url: string, realm?: string | null): string {
  if (!realm) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}realm=${encodeURIComponent(realm)}`
}

function resolveEventRealm(world: boolean | undefined, server: string | null | undefined): string | undefined {
  return world && server ? server : undefined
}

function buildJumpInUrl(x: number, y: number, realm?: string | null): string {
  return appendRealmParam(`https://decentraland.org/jump?position=${x},${y}`, realm)
}

function buildEventJumpInUrl(x: number, y: number, realm?: string | null): string {
  return appendRealmParam(`https://decentraland.org/jump/event?position=${x},${y}`, realm)
}

const EVENT_ID_PARAM = 'id'
const PLACE_POSITION_PARAM = 'position'
const PLACE_WORLD_PARAM = 'world'

function buildEventShareUrl(eventId: string, isLive: boolean, href: string = window.location.href): string {
  const current = new URL(href)
  const url = new URL(isLive ? '/jump/events' : '/whats-on', current.origin)
  const env = current.searchParams.get('env')
  if (env) url.searchParams.set('env', env)
  url.searchParams.set(EVENT_ID_PARAM, eventId)
  return url.toString()
}

interface PlaceShareUrlArgs {
  position: string | null
  world: string | null
}

function buildPlaceShareUrl({ position, world }: PlaceShareUrlArgs, href: string = window.location.href): string {
  const current = new URL(href)
  const url = new URL('/whats-on', current.origin)
  const env = current.searchParams.get('env')
  if (env) url.searchParams.set('env', env)
  if (world) url.searchParams.set(PLACE_WORLD_PARAM, world)
  else if (position) url.searchParams.set(PLACE_POSITION_PARAM, position)
  return url.toString()
}

function parseCoordinates(coordinates: string): [number, number] {
  const [x, y] = coordinates.split(',').map(Number)
  if (Number.isNaN(x) || Number.isNaN(y)) {
    return [0, 0]
  }
  return [x, y]
}

interface NormalizedRecurrence {
  frequency: RecurrentFrequency | null
  interval: number
}

// Legacy events stored coarser recurrences as DAILY × N. Re-express DAILY intervals
// that are clean multiples of 365 as years, and multiples of 7 as weeks. Side effect:
// an intentional DAILY × 28 becomes WEEKLY × 4 — accepted tradeoff.
function normalizeRecurrence(frequency: RecurrentFrequency | null, interval: number | null | undefined): NormalizedRecurrence {
  const count = interval && interval > 1 ? interval : 1
  if (frequency === 'DAILY' && count > 1) {
    if (count % 365 === 0) return { frequency: 'YEARLY', interval: count / 365 }
    if (count % 7 === 0) return { frequency: 'WEEKLY', interval: count / 7 }
  }
  return { frequency, interval: count }
}

function formatRecurrenceUntil(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

interface RecurrenceRuleParams {
  frequency: RecurrentFrequency | null
  interval: number
  count: number | null
  until: string | null
}

function buildRecurrenceRule({ frequency, interval, count, until }: RecurrenceRuleParams): string | null {
  if (!frequency) return null
  // Sub-daily frequencies aren't surfaced in the UI; skip them in the calendar too for consistency.
  if (frequency === 'HOURLY' || frequency === 'MINUTELY' || frequency === 'SECONDLY') return null
  const parts = [`FREQ=${frequency}`]
  if (interval > 1) parts.push(`INTERVAL=${interval}`)
  if (until) {
    const formatted = formatRecurrenceUntil(until)
    if (formatted) parts.push(`UNTIL=${formatted}`)
  } else if (count && count > 0) {
    parts.push(`COUNT=${count}`)
  }
  return `RRULE:${parts.join(';')}`
}

interface CalendarEventParams {
  name: string
  description?: string | null
  startAt: string | null
  finishAt?: string | null
  x: number
  y: number
  url: string
  recurrent?: boolean
  recurrentFrequency?: RecurrentFrequency | null
  recurrentInterval?: number | null
  recurrentCount?: number | null
  recurrentUntil?: string | null
}

function buildCalendarUrl(event: CalendarEventParams): string | null {
  if (!event.startAt) return null
  const formatDate = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')
  const start = formatDate(event.startAt)
  const end = event.finishAt ? formatDate(event.finishAt) : start
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${start}/${end}`,
    details: `${event.description || ''}\n\n${event.url}`,
    location: `Decentraland ${event.x},${event.y}`
  })
  if (event.recurrent && event.recurrentFrequency) {
    const normalized = normalizeRecurrence(event.recurrentFrequency, event.recurrentInterval)
    const rrule = buildRecurrenceRule({
      frequency: normalized.frequency,
      interval: normalized.interval,
      count: event.recurrentCount ?? null,
      until: event.recurrentUntil ?? null
    })
    if (rrule) params.set('recur', rrule)
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export {
  EVENT_ID_PARAM,
  PLACE_POSITION_PARAM,
  PLACE_WORLD_PARAM,
  appendRealmParam,
  buildCalendarUrl,
  buildEventJumpInUrl,
  buildEventShareUrl,
  buildJumpInUrl,
  buildPlaceShareUrl,
  normalizeRecurrence,
  parseCoordinates,
  resolveEventRealm
}
