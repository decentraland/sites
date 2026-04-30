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

interface CalendarEventParams {
  name: string
  description?: string | null
  startAt: string | null
  finishAt?: string | null
  x: number
  y: number
  url: string
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
  parseCoordinates,
  resolveEventRealm
}
