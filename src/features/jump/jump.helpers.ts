import type { CardData } from './jump.types'

const ENS_REGEX = /^[a-zA-Z0-9.]+\.eth$/

function isEns(value: string | undefined): value is `${string}.eth` {
  return !!value?.match(ENS_REGEX)?.length
}

interface ParsedPosition {
  original: string
  coordinates: [number, number]
}

const DEFAULT_POSITION = '0,0'
const DEFAULT_REALM = 'main'

function parsePosition(value: string): ParsedPosition {
  const original = value
  const normalized = value.replace('.', ',')
  const [x, y] = normalized.split(',').map(coord => {
    const num = Number(coord)
    return Number.isNaN(num) ? 0 : num
  })
  return { original, coordinates: [x, y] }
}

function eventHasEnded(event?: CardData): boolean {
  if (!event?.finish_at_iso) return false
  const finishAt = new Date(event.finish_at_iso)
  if (Number.isNaN(finishAt.getTime())) return false
  return Date.now() > finishAt.getTime()
}

function formatDateForGoogleCalendar(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

function buildDeepLinkOptions(position?: string, realm?: string): { realm?: string; position?: string } {
  const options: { realm?: string; position?: string } = {}
  if (realm && realm !== DEFAULT_REALM) options.realm = realm
  if (position && position !== DEFAULT_POSITION) options.position = position
  return options
}

export { DEFAULT_POSITION, DEFAULT_REALM, buildDeepLinkOptions, eventHasEnded, formatDateForGoogleCalendar, isEns, parsePosition }
export type { ParsedPosition }
