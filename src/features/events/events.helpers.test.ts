import { coordsKey, findEventAtCoords } from './events.helpers'
import type { EventEntry } from './events.types'

describe('coordsKey', () => {
  describe('when called with positive and negative coordinates', () => {
    let result: string

    beforeEach(() => {
      result = coordsKey(10, -5)
    })

    it('should return a comma-separated string', () => {
      expect(result).toBe('10,-5')
    })
  })

  describe('when called with zero coordinates', () => {
    let result: string

    beforeEach(() => {
      result = coordsKey(0, 0)
    })

    it('should return 0,0', () => {
      expect(result).toBe('0,0')
    })
  })
})

describe('findEventAtCoords', () => {
  let events: EventEntry[]

  beforeEach(() => {
    events = [
      {
        id: 'event-1',
        name: 'Event One',
        image: 'img1.png',
        x: 10,
        y: 20,
        url: 'https://example.com/1',
        live: true,
        coordinates: [10, 20],
        user: '0x123'
      },
      {
        id: 'event-2',
        name: 'Event Two',
        image: 'img2.png',
        x: -5,
        y: 15,
        url: 'https://example.com/2',
        live: true,
        coordinates: [-5, 15],
        user: '0x456'
      }
    ]
  })

  afterEach(() => {
    events = []
  })

  describe('when a parcel matches an event coordinate', () => {
    let result: EventEntry | undefined

    beforeEach(() => {
      const parcels: Array<[number, number]> = [
        [0, 0],
        [10, 20],
        [30, 30]
      ]
      result = findEventAtCoords(events, parcels)
    })

    it('should return the matching event', () => {
      expect(result).toEqual(events[0])
    })
  })

  describe('when multiple parcels match different events', () => {
    let result: EventEntry | undefined

    beforeEach(() => {
      const parcels: Array<[number, number]> = [
        [-5, 15],
        [10, 20]
      ]
      result = findEventAtCoords(events, parcels)
    })

    it('should return the first matching event found by parcel order', () => {
      expect(result).toEqual(events[1])
    })
  })

  describe('when no parcels match any event', () => {
    let result: EventEntry | undefined

    beforeEach(() => {
      const parcels: Array<[number, number]> = [
        [100, 100],
        [200, 200]
      ]
      result = findEventAtCoords(events, parcels)
    })

    it('should return undefined', () => {
      expect(result).toBeUndefined()
    })
  })

  describe('when parcels array is empty', () => {
    let result: EventEntry | undefined

    beforeEach(() => {
      result = findEventAtCoords(events, [])
    })

    it('should return undefined', () => {
      expect(result).toBeUndefined()
    })
  })

  describe('when events array is empty', () => {
    let result: EventEntry | undefined

    beforeEach(() => {
      result = findEventAtCoords([], [[10, 20]])
    })

    it('should return undefined', () => {
      expect(result).toBeUndefined()
    })
  })
})
