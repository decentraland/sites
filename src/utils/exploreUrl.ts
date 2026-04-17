function buildJumpInUrl(x: number, y: number): string {
  return `https://decentraland.org/jump?position=${x},${y}`
}

function buildEventJumpInUrl(x: number, y: number): string {
  return `https://decentraland.org/jump/event?position=${x},${y}`
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

export { buildCalendarUrl, buildEventJumpInUrl, buildJumpInUrl, parseCoordinates }
