import type { CardData } from './places.types'

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

// Resolve the position forwarded to the Places API for a jump. Shared by
// PlacesPage and EventsPage. A position is forwarded only when one is explicitly
// present in the URL, or when there is no World realm (a bare Genesis jump keeps
// the 0,0 default). For a World jump WITHOUT a position, omitting it lets
// buildPlacesUrl resolve to `/worlds` (the World-level card) instead of the
// per-scene `/places` lookup.
function resolvePlacesPosition(
  rawPositionParam: string | null,
  realm: string | undefined,
  coordinates: [number, number]
): [number, number] | undefined {
  return rawPositionParam !== null || !realm ? coordinates : undefined
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

/**
 * Collects the first-launch deep-link params (position/realm) from the given
 * source (defaults to the current URL's search params). Defaults and empty
 * values are filtered by `buildDeepLinkOptions`, so download URLs stay clean.
 * Used by the download surfaces to keep the params alive hop-by-hop until they
 * land on the file-origin URL the launcher parses on first run
 * (kMDItemWhereFroms / Zone.Identifier).
 */
function collectDeepLinkParams(source?: URLSearchParams): { position?: string; realm?: string } {
  const params = source ?? new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const { position, realm } = buildDeepLinkOptions(params.get('position') ?? undefined, params.get('realm') ?? undefined)
  return { ...(position ? { position } : {}), ...(realm ? { realm } : {}) }
}

function formatLocation(coordinates: [number, number]): string {
  return `${coordinates[0]}, ${coordinates[1]}`
}

export {
  DEFAULT_POSITION,
  DEFAULT_REALM,
  buildDeepLinkOptions,
  collectDeepLinkParams,
  eventHasEnded,
  formatDateForGoogleCalendar,
  formatLocation,
  parsePosition,
  resolvePlacesPosition
}
export type { ParsedPosition }
