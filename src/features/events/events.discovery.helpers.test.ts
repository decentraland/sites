import { DCL_FOUNDATION_NAME, buildExploreCards, buildPlazaCard, coordsKey, findEventAtCoords } from './events.discovery.helpers'
import { ExploreCardType } from './events.discovery.types'
import type { EventEntry, HotScene } from './events.discovery.types'

const scene = (overrides: Partial<HotScene>): HotScene => ({
  id: overrides.id ?? 'scene',
  name: overrides.name ?? 'Scene',
  baseCoords: overrides.baseCoords ?? [0, 0],
  usersTotalCount: overrides.usersTotalCount ?? 10,
  parcels: overrides.parcels ?? [[0, 0]],
  thumbnail: overrides.thumbnail ?? 'thumb.png'
})

const event = (overrides: Partial<EventEntry>): EventEntry => ({
  id: overrides.id ?? 'event',
  name: overrides.name ?? 'Event',
  image: overrides.image ?? 'img.png',
  x: overrides.x ?? 0,
  y: overrides.y ?? 0,
  url: overrides.url ?? 'https://event.test',
  live: overrides.live ?? true,
  coordinates: overrides.coordinates ?? [overrides.x ?? 0, overrides.y ?? 0],
  user: overrides.user ?? '0xuser'
})

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

describe('buildPlazaCard', () => {
  describe('when a Genesis Plaza scene is in the list', () => {
    it('should use its metadata', () => {
      const plaza = scene({ id: 'plaza', name: 'Genesis Plaza Main', baseCoords: [-9, -9], usersTotalCount: 42, thumbnail: 'plaza.png' })
      const result = buildPlazaCard([plaza])
      expect(result).toEqual({
        type: ExploreCardType.PLACE,
        id: 'plaza',
        title: 'Genesis Plaza Main',
        users: 42,
        image: 'plaza.png',
        coordinates: '-9,-9',
        creatorName: DCL_FOUNDATION_NAME,
        isGenesisPlaza: true
      })
    })
  })

  describe('when there is no Genesis Plaza scene', () => {
    it('should return defaults pointing to 0,0', () => {
      const result = buildPlazaCard([scene({ name: 'Not the plaza' })])
      expect(result.id).toBe('genesis-plaza')
      expect(result.coordinates).toBe('0,0')
      expect(result.isGenesisPlaza).toBe(true)
    })
  })
})

describe('buildExploreCards', () => {
  describe('when a scene has fewer than MIN_USERS visitors', () => {
    it('should filter it out', () => {
      const cards = buildExploreCards([], [scene({ usersTotalCount: 1 })])
      expect(cards).toHaveLength(1)
      expect(cards[0].id).toBe('genesis-plaza')
    })
  })

  describe('when a scene matches a live event', () => {
    it('should emit an event card', () => {
      const matching = event({ id: 'evt-1', name: 'Live Show', x: 5, y: 5, image: 'evt.png', user: '0xcreator' })
      const sc = scene({ id: 's1', name: 'Stage', usersTotalCount: 100, parcels: [[5, 5]] })
      const cards = buildExploreCards([matching], [sc])
      expect(cards[0]).toEqual({
        type: ExploreCardType.EVENT,
        id: 'evt-1',
        title: 'Live Show',
        users: 100,
        image: 'evt.png',
        coordinates: '5,5',
        creatorAddress: '0xcreator',
        isGenesisPlaza: false
      })
    })

    it('should not reuse the same event across multiple scenes', () => {
      const matching = event({ id: 'evt-1', x: 5, y: 5 })
      const s1 = scene({ id: 's1', name: 'A', usersTotalCount: 30, parcels: [[5, 5]] })
      const s2 = scene({ id: 's2', name: 'B', usersTotalCount: 80, parcels: [[5, 5]] })
      const cards = buildExploreCards([matching], [s1, s2])
      const eventCards = cards.filter(c => c.type === ExploreCardType.EVENT)
      expect(eventCards).toHaveLength(1)
    })
  })

  describe('when no scenes match events', () => {
    it('should emit place cards sorted by users desc', () => {
      const s1 = scene({ id: 's1', name: 'Less', usersTotalCount: 20 })
      const s2 = scene({ id: 's2', name: 'More', usersTotalCount: 200, baseCoords: [1, 1] })
      const cards = buildExploreCards([], [s1, s2])
      expect(cards[0].id).toBe('s2')
      expect(cards[1].id).toBe('s1')
    })
  })

  describe('when a Genesis Plaza scene is among the place cards', () => {
    it('should tag it with the foundation name', () => {
      const plaza = scene({ id: 'plaza', name: 'Genesis Plaza', usersTotalCount: 50 })
      const cards = buildExploreCards([], [plaza])
      const plazaCard = cards.find(c => c.id === 'plaza')
      expect(plazaCard?.creatorName).toBe(DCL_FOUNDATION_NAME)
      expect(plazaCard?.isGenesisPlaza).toBe(true)
    })
  })

  describe('when the total card count is below MAX_CARDS', () => {
    it('should append a Genesis Plaza fallback', () => {
      const cards = buildExploreCards([], [scene({ id: 's1', name: 'Random', usersTotalCount: 10 })])
      const plaza = cards.find(c => c.id === 'genesis-plaza')
      expect(plaza).toBeDefined()
    })

    it('should not duplicate the plaza when it is already present', () => {
      const plaza = scene({ id: 'genesis-plaza', name: 'Genesis Plaza', usersTotalCount: 30 })
      const cards = buildExploreCards([], [plaza])
      const plazaCards = cards.filter(c => c.id === 'genesis-plaza')
      expect(plazaCards).toHaveLength(1)
    })
  })

  describe('when there are more than MAX_CARDS scenes', () => {
    it('should truncate to MAX_CARDS', () => {
      const scenes = Array.from({ length: 6 }, (_, i) => scene({ id: `s${i}`, baseCoords: [i, i], usersTotalCount: 50 - i }))
      const cards = buildExploreCards([], scenes)
      expect(cards).toHaveLength(3)
    })
  })
})
