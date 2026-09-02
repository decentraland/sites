/* eslint-disable @typescript-eslint/naming-convention -- Segment payload keys are snake_case */
import type { DiscoverPlace } from './discover.types'

// Canonical category set used by the EXPLORE tab. Order mirrors what the
// places-api exposes and what users expect from the standalone decentraland.social
// site this `/places` route absorbs. The leading 'social' is a CATEGORY
// value, unrelated to the route rename.
const DISCOVER_CATEGORIES = ['social', 'music', 'art', 'game', 'fashion', 'education', 'shop', 'sports', 'business'] as const

type DiscoverCategory = (typeof DISCOVER_CATEGORIES)[number]

// Place positions come back as "x,y" strings; the API expects the same shape.
// Negative coordinates are routine (Genesis Plaza is `-3,-2`).
function parsePositionParam(raw: string | undefined): [number, number] | undefined {
  if (!raw) return undefined
  const match = /^(-?\d+),(-?\d+)$/.exec(raw.trim())
  if (!match) return undefined
  return [Number(match[1]), Number(match[2])]
}

// Deep-link target for the jump-in launch: worlds resolve by realm (the
// lowercased world name), Genesis City places by parcel position. The single
// source for the routing decision — `launchDesktopApp` + the download-fallback
// tracking take this structured shape directly (so the "install first" flow
// carries the first-launch destination all the way to the client), and the
// chat-footer landing link below derives its query from it.
function discoverDeepLinkOptions(place: DiscoverPlace): { position?: string; realm?: string } {
  if (place.world && place.world_name) return { realm: place.world_name.toLowerCase() }
  const position = place.base_position ?? place.positions?.[0]
  return position ? { position } : {}
}

// The `/jump/` landing-page link used by the in-world chat footer's "Jump into
// <Scene>" anchor. Unlike the JUMP IN buttons (which go through the shared
// launcher + download modal), a plain text link can't raise the modal, so it
// points at the launcher landing page, which resolves the deep link AND offers
// a download when the client is absent — matching cast's chat footer, instead
// of a bare `decentraland://` that silently no-ops for a client-less visitor.
function buildJumpLandingHref(place: DiscoverPlace): string {
  const { realm, position } = discoverDeepLinkOptions(place)
  if (realm) return `https://decentraland.org/jump/?realm=${encodeURIComponent(realm)}`
  if (position) return `https://decentraland.org/jump/?position=${encodeURIComponent(position)}`
  return 'https://decentraland.org/jump/'
}

// In-app detail route for a place — worlds by name, parcels by base position.
// Single source for the card click-through and the modal's copy-link (which
// must share the canonical detail URL even when the modal opened in place
// over /discover without navigating).
function buildDetailPath(place: DiscoverPlace): string | null {
  if (place.world && place.world_name) {
    return `/places/world/${encodeURIComponent(place.world_name.toLowerCase())}`
  }
  const position = place.base_position ?? place.positions?.[0]
  if (position) return `/places/place/${position}`
  return null
}

// The places-api marks the curated "Featured Places" set with
// `highlighted: true` (the same flag `?only_highlighted=true` filters on) —
// a hand-picked handful, unlike the ~100-strong `poi` category.
function placeIsFeatured(place: DiscoverPlace): boolean {
  return place.highlighted === true
}

// Real-time presence count, normalized to 0 when absent. Only the LIVE feed
// populates this from hot-scenes / live-data; BROWSE entries are stripped to 0.
// A place counts as LIVE when at least this many people are in-world —
// product-tunable (5 per the current spec); a couple of stragglers doesn't
// make a scene "live".
const LIVE_MIN_USERS = 5

function placeIsLive(place: DiscoverPlace): boolean {
  return placePlayers(place) >= LIVE_MIN_USERS
}

// Presence per the 2026-09-01 product decision: anybody at all in the scene counts. This REPLACES
// LIVE_MIN_USERS on the new layout — the 5-user cut is only still consulted on the legacy path
// behind the flag. Answers two different questions from one place: whether a scene belongs in the
// LIVE section, and whether a card click opens the live viewer (people) or the JUMP IN modal (empty).
function placeHasPeople(place: DiscoverPlace): boolean {
  return placePlayers(place) > 0
}

// An event is running at the place right now, per the events API via `with_live_events`. This —
// never presence — is what the red LIVE badge means on the new layout. `undefined` (the request did
// not ask) reads as false so a card can never go red on a stale or partial row.
function placeHasLiveEvent(place: DiscoverPlace): boolean {
  return place.live === true
}

function placePlayers(place: DiscoverPlace): number {
  return place.user_count ?? 0
}

// Human label for the card's location pill: the world name for worlds, the
// base parcel (or first parcel) for Genesis City places.
function placeCoordsLabel(place: DiscoverPlace): string | undefined {
  if (place.world) return place.world_name || undefined
  return place.base_position ?? place.positions?.[0]
}

// The places-api returns a generic Genesis City map tile
// (`api.decentraland.org/v2/map.png`) as `image` for any parcel with no
// deployed scene thumbnail — roads, empty parcels, un-thumbnailed scenes. It's
// not a real screenshot, so we treat it (and an empty string) as "no image".
// Default artwork shipped by the scene templates — the same bytes deploy to
// the same content hash every time, so a hash match means "the creator never
// replaced the placeholder thumbnail". Found empirically: the SDK7 template
// cover appears on 24+ unrelated scenes, the empty-template cover on every
// "Empty" deploy.
const DEFAULT_THUMBNAIL_HASHES = new Set([
  'bafkreidj26s7aenyxfthfdibnqonzqm5ptc4iamml744gmcyuokewkr76y', // SDK7 scene template
  'bafkreiccptidkodtsbcmk7uw3afmuysu6eboocnr57dmwdg7voylyzg5hy' // empty scene template
])

function isMapPlaceholderImage(image?: string): boolean {
  if (!image || image.includes('/v2/map.png')) return true
  const hash = image.split('/').pop() ?? ''
  return DEFAULT_THUMBNAIL_HASHES.has(hash)
}

// Number of tracks in a resolved `grid-template-columns`. Used to size the
// Featured rail's collapsed height off the grid the browser actually laid out:
// its tracks come from an auto-fill formula with a px floor, which no
// breakpoint mirror can predict. Returns 0 when there is nothing to measure
// (jsdom, or before first layout), so callers can keep their own fallback.
function countGridTracks(gridTemplateColumns: string): number {
  return gridTemplateColumns.split(' ').filter(Boolean).length
}

// Real cover image for a card, or undefined when the place only has the
// map-tile placeholder — so the card renders its solid fallback instead of a
// blue Genesis City map square.
function placeCoverImage(place: DiscoverPlace): string | undefined {
  return isMapPlaceholderImage(place.image) ? undefined : place.image
}

// Auto-generated road/crossroad parcels: the places-api titles them
// "Road at x,y ..." AND returns an empty `categories` array. Require both so an
// artistic title like "Road at the Edge" on a real categorized scene isn't
// filtered.
function isRoad(place: DiscoverPlace): boolean {
  if (place.world) return false
  const titleMatches = place.title?.startsWith('Road at ') ?? false
  const noCategories = (place.categories?.length ?? 0) === 0
  return titleMatches && noCategories
}

// Junk hidden from every social surface: "interactive-text" test deploys,
// auto-generated roads, scenes literally titled "Empty", and anything whose
// cover is missing or still the template default (map tile / SDK7 template
// art / empty-template art) — i.e. nothing worth exploring. The one
// exception: live worlds keep their synthesized fallback card so real people
// in a world without places-api art still surface on the LIVE rail.
function isHiddenPlace(place: DiscoverPlace): boolean {
  if (place.title?.toLowerCase().includes('interactive-text')) return true
  if ((place.title ?? '').trim().toLowerCase() === 'empty') return true
  if (isRoad(place)) return true
  if (isMapPlaceholderImage(place.image) && !(place.world && (place.user_count ?? 0) > 0)) return true
  // No creator identity → junk, regardless of description or categories.
  // Identity = an owner address, or a real user_name / contact_name — the
  // sdk-commands default contact ("SDK") is template boilerplate and counts
  // as none. Identity-less PARCELS are junk even when someone happens to be
  // standing in them; identity-less WORLDS keep the presence exception
  // because the Live Now rail synthesizes exactly this shape when a live
  // world has no places-api metadata.
  const isJunkName = (name?: string | null) => !name || name.trim().toLowerCase() === 'sdk'
  const hasIdentity = Boolean(place.owner) || !isJunkName(place.user_name) || !isJunkName(place.contact_name)
  if (hasIdentity) return false
  return place.world ? (place.user_count ?? 0) === 0 : true
}

// Canonical Segment payload for a SOCIAL_* event about a place. snake_case
// keys per the tracking conventions; optional fields are omitted (not null) so
// warehouse rows stay clean. `place` (the UI-surface key) is intentionally NOT
// set here — callers add it when the same event can fire from several surfaces.
function discoverPlacePayload(place: DiscoverPlace): Record<string, string | number | boolean> {
  const position = place.base_position ?? place.positions?.[0]
  return {
    place_id: place.id,
    place_title: place.title,
    world: Boolean(place.world),
    ...(position ? { position } : {}),
    ...(place.world_name ? { world_name: place.world_name } : {}),
    ...(place.user_count != null ? { user_count: place.user_count } : {})
  }
}

export {
  DISCOVER_CATEGORIES,
  buildDetailPath,
  buildJumpLandingHref,
  countGridTracks,
  discoverDeepLinkOptions,
  discoverPlacePayload,
  isHiddenPlace,
  isMapPlaceholderImage,
  parsePositionParam,
  placeCoordsLabel,
  placeCoverImage,
  placeIsFeatured,
  placeHasLiveEvent,
  placeHasPeople,
  placeIsLive,
  placePlayers
}
export type { DiscoverCategory }
