import { coordsKey } from '../events/events.helpers'
import type { HotScene } from '../events/events.types'
import type { EventEntry } from './events.types'

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
}

const DEFAULT_MIN_USERS = 5

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
    creatorName: 'Decentraland Foundation',
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
        isGenesisPlaza: false
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
      ...(genesis && { creatorName: 'Decentraland Foundation' }),
      isGenesisPlaza: genesis
    })
  }

  if (cards.length === 0) {
    cards.push(buildPlazaCard(hotScenes))
  }

  return cards
}

// --- Place enrichment types ---

interface PlaceResponse {
  data: { description?: string; categories?: string[]; owner?: string }[]
}

interface EnrichmentConfig {
  placesUrl?: string
}

// TODO: N+1 optimization — Places API supports comma-separated `positions` param for batch lookups.
// Collapse all place-card requests into one batch call to /places?positions=a,b,c.
async function enrichPlaceCards(cards: LiveNowCard[], config: EnrichmentConfig): Promise<LiveNowCard[]> {
  const { placesUrl } = config
  const placeCards = cards.filter(c => c.type === 'place')
  if (placeCards.length === 0 || !placesUrl) return cards

  const enrichments = new Map<string, Partial<LiveNowCard>>()

  await Promise.all(
    placeCards.map(async card => {
      try {
        const res = await fetch(`${placesUrl}/places?positions=${card.coordinates}`)
        if (!res.ok) return
        const data = (await res.json()) as PlaceResponse
        const place = data.data?.[0]
        if (!place) return
        const patch: Partial<LiveNowCard> = {
          description: place.description || null,
          categories: place.categories || []
        }
        if (place.owner && !card.creatorAddress) {
          patch.creatorAddress = place.owner
        }
        enrichments.set(card.id, patch)
      } catch (err) {
        console.warn('[LiveNow] places lookup failed for', card.coordinates, err)
      }
    })
  )

  if (enrichments.size === 0) return cards

  return cards.map(card => {
    const patch = enrichments.get(card.id)
    return patch ? { ...card, ...patch } : card
  })
}

export { buildLiveNowCards, enrichPlaceCards }
export type { EnrichmentConfig, HotScene, LiveNowCard }
