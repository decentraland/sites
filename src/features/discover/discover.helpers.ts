import type { DiscoverPlace } from './discover.types'

// Canonical category set used by the EXPLORE tab. Order mirrors what the
// places-api exposes and what users expect from the standalone decentraland.social
// site this `/discover` route absorbs. The leading 'social' is a CATEGORY
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

// Direct `decentraland://` protocol launch into the installed desktop client.
// We intentionally skip the decentraland.org/jump landing page on /discover/*
// — users browsing here already know what Decentraland is; the landing page
// adds friction. If the client isn't installed the OS protocol-handler dialog
// is the right fallback (user can choose to download).
function buildJumpInHref(place: DiscoverPlace): string {
  if (place.world && place.world_name) {
    return `decentraland://?realm=${encodeURIComponent(place.world_name.toLowerCase())}`
  }
  const position = place.base_position ?? place.positions?.[0]
  if (position) return `decentraland://?position=${encodeURIComponent(position)}`
  return 'decentraland://'
}

export { DISCOVER_CATEGORIES, buildJumpInHref, parsePositionParam }
export type { DiscoverCategory }
