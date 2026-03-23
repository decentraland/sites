import { WhatsOnCardType } from './events.types'
import type { EventEntry, HotScene, WhatsOnCard } from './events.types'

function coordsKey(x: number, y: number): string {
  return `${x},${y}`
}

function findEventAtCoords(events: EventEntry[], parcels: Array<[number, number]>): EventEntry | undefined {
  const eventCoords = new Set(events.map(e => coordsKey(e.x, e.y)))
  for (const [px, py] of parcels) {
    const key = coordsKey(px, py)
    if (eventCoords.has(key)) {
      return events.find(e => coordsKey(e.x, e.y) === key)
    }
  }
  return undefined
}

function buildPlazaCard(scenesData: HotScene[], jumpInUrl: string): WhatsOnCard {
  const plaza = scenesData.find(s => s.name.toLowerCase().includes('genesis plaza'))
  const plazaCoords = plaza ? coordsKey(plaza.baseCoords[0], plaza.baseCoords[1]) : '0,0'
  return {
    type: WhatsOnCardType.PLACE,
    id: plaza?.id ?? 'genesis-plaza',
    title: plaza?.name ?? 'Genesis Plaza',
    users: plaza?.usersTotalCount ?? 0,
    image: plaza?.thumbnail ?? '',
    coordinates: plazaCoords,
    url: `${jumpInUrl}?position=${plazaCoords}`,
    creatorName: 'Decentraland Foundation'
  }
}

export { buildPlazaCard, coordsKey, findEventAtCoords }
