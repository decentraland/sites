import { ExploreCardType } from './events.discovery.types'
import type { EventEntry, ExploreItem, HotScene } from './events.discovery.types'

const MIN_USERS = 5
const MAX_CARDS = 3
const DCL_FOUNDATION_NAME = 'Decentraland Foundation'

function isGenesisPlazaScene(scene: HotScene): boolean {
  return scene.name.toLowerCase().includes('genesis plaza')
}

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

function buildPlazaCard(scenesData: HotScene[]): ExploreItem {
  const plaza = scenesData.find(isGenesisPlazaScene)
  const plazaCoords = plaza ? coordsKey(plaza.baseCoords[0], plaza.baseCoords[1]) : '0,0'
  return {
    type: ExploreCardType.PLACE,
    id: plaza?.id ?? 'genesis-plaza',
    title: plaza?.name ?? 'Genesis Plaza',
    users: plaza?.usersTotalCount ?? 0,
    image: plaza?.thumbnail ?? '',
    coordinates: plazaCoords,
    creatorName: DCL_FOUNDATION_NAME,
    isGenesisPlaza: true
  }
}

function buildExploreCards(liveEvents: EventEntry[], hotScenes: HotScene[]): ExploreItem[] {
  const filteredScenes = hotScenes.filter(s => s.usersTotalCount >= MIN_USERS)
  const cards: ExploreItem[] = []
  const usedSceneIds = new Set<string>()
  const usedEventIds = new Set<string>()

  for (const scene of filteredScenes) {
    const matchedEvent = findEventAtCoords(liveEvents, scene.parcels)
    if (matchedEvent && !usedEventIds.has(matchedEvent.id)) {
      cards.push({
        type: ExploreCardType.EVENT,
        id: matchedEvent.id,
        title: matchedEvent.name,
        users: scene.usersTotalCount,
        image: matchedEvent.image,
        coordinates: coordsKey(matchedEvent.x, matchedEvent.y),
        creatorAddress: matchedEvent.user,
        isGenesisPlaza: false
      })
      usedSceneIds.add(scene.id)
      usedEventIds.add(matchedEvent.id)
    }
  }

  cards.sort((a, b) => b.users - a.users)

  const scenesWithoutEvents = filteredScenes.filter(s => !usedSceneIds.has(s.id)).sort((a, b) => b.usersTotalCount - a.usersTotalCount)

  for (const scene of scenesWithoutEvents) {
    const isGenesis = isGenesisPlazaScene(scene)
    cards.push({
      type: ExploreCardType.PLACE,
      id: scene.id,
      title: scene.name,
      users: scene.usersTotalCount,
      image: scene.thumbnail,
      coordinates: coordsKey(scene.baseCoords[0], scene.baseCoords[1]),
      ...(isGenesis && { creatorName: DCL_FOUNDATION_NAME }),
      isGenesisPlaza: isGenesis
    })
  }

  if (cards.length < MAX_CARDS) {
    const plazaCard = buildPlazaCard(hotScenes)
    const plazaAlreadyIncluded = cards.some(c => c.id === plazaCard.id)
    if (!plazaAlreadyIncluded) {
      cards.push(plazaCard)
    }
  }

  return cards.slice(0, MAX_CARDS)
}

export { buildExploreCards, buildPlazaCard, coordsKey, DCL_FOUNDATION_NAME, findEventAtCoords }
