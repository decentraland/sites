import type { CardData } from './places.types'

const ENS_REGEX = /^[a-zA-Z0-9.]+\.eth$/

function isEns(value: string | undefined): value is `${string}.eth` {
  return !!value?.match(ENS_REGEX)?.length
}

interface ParsedPosition {
  original: string
  coordinates: [number, number]
  isValid: boolean
}

const DEFAULT_POSITION = '0,0'
const DEFAULT_REALM = 'main'

const POSITION_SEPARATORS = /[,.]/g

// Accepts "x,y" and "x.y" equivalently. The dot form is treated as a
// separator, not a decimal: "10.20" resolves to (10, 20) — same as "10,20".
// Returns isValid=false only when the value can't be split into two integers;
// the dot form stays valid so pages don't redirect to /invalid purely because
// of separator choice.
function parsePosition(value: string): ParsedPosition {
  const original = value
  const tokens = value.split(POSITION_SEPARATORS)
  if (tokens.length !== 2) {
    return { original, coordinates: [0, 0], isValid: false }
  }
  const x = Number.parseInt(tokens[0], 10)
  const y = Number.parseInt(tokens[1], 10)
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { original, coordinates: [0, 0], isValid: false }
  }
  return { original, coordinates: [x, y], isValid: true }
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

function buildDeepLinkOptions(position?: string, realm?: string, env?: string): { realm?: string; position?: string; dclenv?: string } {
  const options: { realm?: string; position?: string; dclenv?: string } = {}
  if (realm && realm !== DEFAULT_REALM) options.realm = realm
  if (position && position !== DEFAULT_POSITION) options.position = position
  if (env) options.dclenv = env
  return options
}

function formatLocation(coordinates: [number, number]): string {
  return `${coordinates[0]}, ${coordinates[1]}`
}

const INTEGER_TOKEN = /^-?\d+$/

// Display "<world> · X, Y" only when the user opened the jump with an explicit
// non-default parcel inside the world. Worlds visited at their entry point keep
// the bare world name. Rejects partial-number tokens like "26abc" so junk URL
// inputs never bleed into the visible card.
function formatRealmWithPosition(realm: string, position?: string): string {
  if (!position || position === DEFAULT_POSITION) return realm
  const tokens = position.split(POSITION_SEPARATORS)
  if (tokens.length !== 2 || !tokens.every(t => INTEGER_TOKEN.test(t))) return realm
  return `${realm} · ${formatLocation([Number(tokens[0]), Number(tokens[1])])}`
}

export {
  DEFAULT_POSITION,
  DEFAULT_REALM,
  buildDeepLinkOptions,
  eventHasEnded,
  formatDateForGoogleCalendar,
  formatLocation,
  formatRealmWithPosition,
  isEns,
  parsePosition
}
export type { ParsedPosition }
