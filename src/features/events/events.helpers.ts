import type { EventEntry } from './events.types'

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

export { coordsKey, findEventAtCoords }
