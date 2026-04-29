import { assetUrl } from '../../utils/assetUrl'
import { resolveDeployers } from '../../utils/peerDeployers'
import { isSameLocalDay } from '../../utils/whatsOnDate'
import { DCL_FOUNDATION_NAME, coordsKey } from '../events/events.helpers'
import type { HotScene } from '../events/events.types'
import type { EventEntry, RecurrentFrequency } from './events.types'

interface LiveNowCard {
  id: string
  type: 'event' | 'place'
  title: string
  image: string
  users: number
  coordinates: string
  creatorAddress?: string
  creatorName?: string
  isGenesisPlaza: boolean
  description?: string | null
  categories?: string[]
  startAt?: string
  finishAt?: string
  recurrent?: boolean
  recurrentFrequency?: RecurrentFrequency | null
  recurrentDates?: string[]
  attending?: boolean
  world?: boolean
  server?: string | null
}

const DEFAULT_MIN_USERS = 5
const DCL_FOUNDATION_NAME_LOWER = DCL_FOUNDATION_NAME.toLowerCase()
const DCL_FOUNDATION_LOGO_URL = assetUrl('/dcl-logo.svg')

function isDclFoundationCreator(creatorName: string | null | undefined): boolean {
  return creatorName?.trim().toLowerCase() === DCL_FOUNDATION_NAME_LOWER
}

// Buckets events into one array per visible day, expanding recurrent events into one virtual entry
// per occurrence in `recurrent_dates` that falls on a visible day, and sorts each bucket ascending
// by start_at. For recurrent events `start_at` is the FIRST occurrence (often months in the past),
// so we override start_at/finish_at/live on each virtual entry. Non-recurrent events bucket by their
// own start_at. Tagged tuples cache the parsed start timestamp so the sort comparator skips re-parsing.
function bucketEventsByDay(events: EventEntry[], days: Date[], now: number = Date.now()): EventEntry[][] {
  const tagged: Array<[number, EventEntry]>[] = days.map(() => [])

  for (const event of events) {
    const hasRecurrence = event.recurrent && event.recurrent_dates && event.recurrent_dates.length > 0
    const dates = hasRecurrence ? event.recurrent_dates : [event.start_at]

    for (const dateStr of dates) {
      const start = new Date(dateStr)
      const dayIdx = days.findIndex(day => isSameLocalDay(start, day))
      if (dayIdx < 0) continue

      const startTs = start.getTime()
      let entry: EventEntry
      if (hasRecurrence) {
        const finishTs = startTs + event.duration
        /* eslint-disable @typescript-eslint/naming-convention */
        entry = {
          ...event,
          start_at: start.toISOString(),
          finish_at: new Date(finishTs).toISOString(),
          live: startTs <= now && now <= finishTs
        }
        /* eslint-enable @typescript-eslint/naming-convention */
      } else {
        entry = event
      }
      tagged[dayIdx].push([startTs, entry])
    }
  }

  return tagged.map(bucket => bucket.sort((a, b) => a[0] - b[0]).map(([, e]) => e))
}

function findEventInMap(eventsByCoord: Map<string, EventEntry>, parcels: Array<[number, number]>): EventEntry | undefined {
  for (const [px, py] of parcels) {
    const match = eventsByCoord.get(coordsKey(px, py))
    if (match) return match
  }
  return undefined
}

function isGenesisPlaza(name: string): boolean {
  return name.toLowerCase().includes('genesis plaza')
}

function buildPlazaCard(hotScenes: HotScene[]): LiveNowCard {
  const plaza = hotScenes.find(s => isGenesisPlaza(s.name))
  const plazaCoords = plaza ? coordsKey(plaza.baseCoords[0], plaza.baseCoords[1]) : '0,0'
  return {
    id: plaza?.id ?? 'genesis-plaza',
    type: 'place',
    title: plaza?.name ?? 'Genesis Plaza',
    image: plaza?.thumbnail ?? '',
    users: plaza?.usersTotalCount ?? 0,
    coordinates: plazaCoords,
    creatorName: DCL_FOUNDATION_NAME,
    isGenesisPlaza: true
  }
}

function buildLiveNowCards(liveEvents: EventEntry[], hotScenes: HotScene[], minUsers = DEFAULT_MIN_USERS): LiveNowCard[] {
  const filteredScenes = hotScenes.filter(s => s.usersTotalCount >= minUsers)
  const eventsByCoord = new Map(liveEvents.map(e => [coordsKey(e.x, e.y), e]))
  const cards: LiveNowCard[] = []
  const usedSceneIds = new Set<string>()
  const usedEventIds = new Set<string>()

  for (const scene of filteredScenes) {
    const matchedEvent = findEventInMap(eventsByCoord, scene.parcels)
    if (matchedEvent && !usedEventIds.has(matchedEvent.id)) {
      cards.push({
        id: matchedEvent.id,
        type: 'event',
        title: matchedEvent.name,
        image: matchedEvent.image || '',
        users: scene.usersTotalCount,
        coordinates: coordsKey(matchedEvent.x, matchedEvent.y),
        creatorAddress: matchedEvent.user,
        creatorName: matchedEvent.user_name || undefined,
        isGenesisPlaza: false,
        description: matchedEvent.description,
        categories: matchedEvent.categories,
        startAt: matchedEvent.start_at,
        finishAt: matchedEvent.finish_at,
        recurrent: matchedEvent.recurrent,
        recurrentFrequency: matchedEvent.recurrent_frequency,
        recurrentDates: matchedEvent.recurrent_dates,
        attending: matchedEvent.attending,
        world: matchedEvent.world,
        server: matchedEvent.server
      })
      usedSceneIds.add(scene.id)
      usedEventIds.add(matchedEvent.id)
    }
  }

  cards.sort((a, b) => b.users - a.users)

  const scenesWithoutEvents = filteredScenes.filter(s => !usedSceneIds.has(s.id)).sort((a, b) => b.usersTotalCount - a.usersTotalCount)

  for (const scene of scenesWithoutEvents) {
    const genesis = isGenesisPlaza(scene.name)
    cards.push({
      id: scene.id,
      type: 'place',
      title: scene.name,
      image: scene.thumbnail,
      users: scene.usersTotalCount,
      coordinates: coordsKey(scene.baseCoords[0], scene.baseCoords[1]),
      ...(genesis && { creatorName: DCL_FOUNDATION_NAME }),
      isGenesisPlaza: genesis
    })
  }

  if (cards.length === 0) {
    cards.push(buildPlazaCard(hotScenes))
  }

  return cards
}

// --- Place enrichment types ---

/* eslint-disable @typescript-eslint/naming-convention */
interface PlaceResponse {
  data: {
    description?: string
    categories?: string[]
    owner?: string | null
    contact_name?: string | null
    creator_address?: string | null
  }[]
}
/* eslint-enable @typescript-eslint/naming-convention */

interface EnrichmentConfig {
  placesUrl?: string
  peerUrl?: string
}

const WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/

async function fetchPlacePatch(placesUrl: string, card: LiveNowCard): Promise<Partial<LiveNowCard>> {
  const patch: Partial<LiveNowCard> = {}
  try {
    const qs = new URLSearchParams({ positions: card.coordinates }).toString()
    const res = await fetch(`${placesUrl}/places?${qs}`)
    if (!res.ok) return patch
    const data = (await res.json()) as PlaceResponse
    const place = data.data?.[0]
    if (!place) return patch

    patch.description = place.description || null
    patch.categories = place.categories || []

    const trimmedOwner = place.owner?.trim() || undefined
    const ownerIsWallet = !!trimmedOwner && WALLET_ADDRESS_REGEX.test(trimmedOwner)
    if (!card.creatorAddress) {
      const address = place.creator_address?.trim() || (ownerIsWallet ? trimmedOwner : undefined)
      if (address) patch.creatorAddress = address
    }
    if (!card.creatorName) {
      const name = place.contact_name?.trim() || (trimmedOwner && !ownerIsWallet ? trimmedOwner : undefined)
      if (name) patch.creatorName = name
    }
  } catch (err) {
    console.warn('[LiveNow] places lookup failed for', card.coordinates, err)
  }
  return patch
}

// Enriches place cards with metadata from the Places API and deployer addresses from the peer
// content service. Place metadata (description, categories, owner) still uses one HTTP request
// per card because the Places API's batch contract isn't documented here, but every card-level
// request runs in parallel. Deployer lookups, on the other hand, collapse into a single batched
// `entities/active` + `deployments` pair via the shared `resolveDeployers` helper — without
// this, ~10–20 place cards meant 20–40 sequential roundtrips on every Live Now refresh.
async function enrichPlaceCards(cards: LiveNowCard[], config: EnrichmentConfig): Promise<LiveNowCard[]> {
  const { placesUrl, peerUrl } = config
  const placeCards = cards.filter(c => c.type === 'place')
  if (placeCards.length === 0) return cards
  if (!placesUrl && !peerUrl) return cards

  const placePatchByCardId = new Map<string, Partial<LiveNowCard>>()

  const placeFetches: Promise<void> = placesUrl
    ? Promise.all(
        placeCards.map(async card => {
          const patch = await fetchPlacePatch(placesUrl, card)
          if (Object.keys(patch).length > 0) placePatchByCardId.set(card.id, patch)
        })
      ).then(() => undefined)
    : Promise.resolve()

  await placeFetches

  let deployerMap: Map<string, string> = new Map()
  if (peerUrl) {
    const cardsNeedingDeployer = placeCards.filter(card => {
      if (card.creatorAddress) return false
      const patch = placePatchByCardId.get(card.id)
      return !patch?.creatorAddress
    })
    const coordinates = cardsNeedingDeployer.map(card => card.coordinates)
    if (coordinates.length > 0) {
      try {
        deployerMap = await resolveDeployers(peerUrl, coordinates)
      } catch (err) {
        console.warn('[LiveNow] deployer lookup failed', err)
      }
    }
  }

  if (placePatchByCardId.size === 0 && deployerMap.size === 0) return cards

  return cards.map(card => {
    const patch = placePatchByCardId.get(card.id)
    const deployedBy = !card.creatorAddress && !patch?.creatorAddress ? deployerMap.get(card.coordinates) : undefined
    if (!patch && !deployedBy) return card
    const merged: LiveNowCard = patch ? { ...card, ...patch } : { ...card }
    if (deployedBy) merged.creatorAddress = deployedBy
    return merged
  })
}

export { bucketEventsByDay, buildLiveNowCards, DCL_FOUNDATION_LOGO_URL, DCL_FOUNDATION_NAME, enrichPlaceCards, isDclFoundationCreator }
export type { EnrichmentConfig, HotScene, LiveNowCard }
