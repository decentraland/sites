import type { CardData, DeepLinkOptions } from './places.types'

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

// Drops the values the explorer already defaults to, so a jump to Genesis City
// origin on the main realm produces a bare deep link. Input and output share one
// shape on purpose: re-normalizing an already-built object is a no-op, where an
// `env`-keyed input silently discarded `dclenv` on the way back through.
function buildDeepLinkOptions(input: DeepLinkOptions): DeepLinkOptions {
  const options: DeepLinkOptions = {}
  if (input.realm && input.realm !== DEFAULT_REALM) options.realm = input.realm
  if (input.position && input.position !== DEFAULT_POSITION) options.position = input.position
  if (input.dclenv) options.dclenv = input.dclenv
  if (input.sceneConsole) options.sceneConsole = input.sceneConsole
  if (input.multiInstance) options.multiInstance = input.multiInstance
  return options
}

// What a realm may look like on its way to the gateway: an ENS World name
// (`foo.dcl.eth`) or a plain catalyst name. Same character set `isEns` allows,
// without requiring the `.eth` suffix so a non-World realm still travels.
// Anything outside it (`<`, `&`, `/`, quotes, spaces) is a payload, not a realm.
const REALM_REGEX = /^[a-zA-Z0-9._-]{1,64}$/

/**
 * Collects the first-launch deep-link params (position/realm) from the given
 * source (defaults to the current URL's search params). Defaults and empty
 * values are filtered by `buildDeepLinkOptions`, so download URLs stay clean.
 * Used by the download surfaces to keep the params alive hop-by-hop until they
 * land on the file-origin URL the launcher parses on first run
 * (kMDItemWhereFroms / Zone.Identifier).
 *
 * Both values are validated here, not forwarded verbatim. This is the only
 * place a raw string from one of our URLs reaches the gateway (which bakes it
 * into the signed binary) and then the launcher and the explorer; the other
 * params on that URL (`referrer`, `anon_user_id`) are already validated before
 * they are forwarded, so these get the same treatment. `position` is re-emitted
 * as `x,y` from the parsed integers, so `10.20` or `10abc,20` never leave as-is
 * and anything that is not a coordinate pair is dropped; `realm` must match
 * `REALM_REGEX`.
 */
function collectDeepLinkParams(source?: URLSearchParams): { position?: string; realm?: string } {
  const params = source ?? new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const rawPosition = params.get('position')
  const rawRealm = params.get('realm')
  const parsedPosition = rawPosition ? parsePosition(rawPosition) : undefined
  const { position, realm } = buildDeepLinkOptions({
    position: parsedPosition?.isValid ? parsedPosition.coordinates.join(',') : undefined,
    realm: rawRealm && REALM_REGEX.test(rawRealm) ? rawRealm : undefined
  })
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
