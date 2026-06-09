import { createMockEvent, createMockPlaceCard, createMockScene } from '../../__test-utils__/factories'
import {
  bucketEventsByDay,
  buildLiveNowCards,
  enrichPlaceCards,
  expandRecurrentDates,
  isDclFoundationCreator,
  isDeleted,
  isPubliclyVisibleEvent
} from './events.helpers'
import type { HotScene, LiveNowCard } from './events.helpers'
import type { EventEntry } from './events.types'

describe('isDclFoundationCreator', () => {
  describe('when the creator name is exactly "Decentraland Foundation"', () => {
    it('should return true', () => {
      expect(isDclFoundationCreator('Decentraland Foundation')).toBe(true)
    })
  })

  describe('when the creator name matches case-insensitively', () => {
    it('should return true', () => {
      expect(isDclFoundationCreator('decentraland foundation')).toBe(true)
      expect(isDclFoundationCreator('DECENTRALAND FOUNDATION')).toBe(true)
    })
  })

  describe('when the creator name has surrounding whitespace', () => {
    it('should return true', () => {
      expect(isDclFoundationCreator('  Decentraland Foundation  ')).toBe(true)
    })
  })

  describe('when the creator name is a different value', () => {
    it('should return false', () => {
      expect(isDclFoundationCreator('BayBackner')).toBe(false)
      expect(isDclFoundationCreator('Foundation')).toBe(false)
    })
  })

  describe('when the creator name is empty, null, or undefined', () => {
    it('should return false', () => {
      expect(isDclFoundationCreator('')).toBe(false)
      expect(isDclFoundationCreator(null)).toBe(false)
      expect(isDclFoundationCreator(undefined)).toBe(false)
    })
  })
})

describe('isPubliclyVisibleEvent', () => {
  describe('when the event is approved and not rejected', () => {
    it('should return true', () => {
      expect(isPubliclyVisibleEvent({ approved: true, rejected: false })).toBe(true)
    })
  })

  describe('when the event is pending approval', () => {
    it('should return false', () => {
      expect(isPubliclyVisibleEvent({ approved: false, rejected: false })).toBe(false)
    })
  })

  describe('when the event has been rejected', () => {
    it('should return false even if approved is somehow also true', () => {
      expect(isPubliclyVisibleEvent({ approved: false, rejected: true })).toBe(false)
      expect(isPubliclyVisibleEvent({ approved: true, rejected: true })).toBe(false)
    })
  })

  describe('when the event has been deleted', () => {
    it('should return false even if approved and not rejected', () => {
      expect(isPubliclyVisibleEvent({ approved: true, rejected: false, deleted_by_user: true, deleted_by_admin: false })).toBe(false)
      expect(isPubliclyVisibleEvent({ approved: true, rejected: false, deleted_by_user: false, deleted_by_admin: true })).toBe(false)
    })
  })
})

describe('isDeleted', () => {
  describe('when deleted_by_user is true', () => {
    it('should return true', () => {
      expect(isDeleted({ deleted_by_user: true, deleted_by_admin: false })).toBe(true)
    })
  })

  describe('when deleted_by_admin is true', () => {
    it('should return true', () => {
      expect(isDeleted({ deleted_by_user: false, deleted_by_admin: true })).toBe(true)
    })
  })

  describe('when neither flag is set', () => {
    it('should return false', () => {
      expect(isDeleted({ deleted_by_user: false, deleted_by_admin: false })).toBe(false)
    })
  })

  describe('when the flags are undefined', () => {
    it('should return false', () => {
      expect(isDeleted({})).toBe(false)
    })
  })
})

describe('buildLiveNowCards', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when there are no events and no scenes', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      result = buildLiveNowCards([], [])
    })

    it('should return a Genesis Plaza fallback card', () => {
      expect(result).toHaveLength(1)
    })

    it('should have the default Genesis Plaza id', () => {
      expect(result[0].id).toBe('genesis-plaza')
    })

    it('should have the default Genesis Plaza title', () => {
      expect(result[0].title).toBe('Genesis Plaza')
    })

    it('should have Decentraland Foundation as creator', () => {
      expect(result[0].creatorName).toBe('Decentraland Foundation')
    })

    it('should be of type place', () => {
      expect(result[0].type).toBe('place')
    })

    it('should have 0,0 as coordinates', () => {
      expect(result[0].coordinates).toBe('0,0')
    })
  })

  describe('when there are no scenes above the min users threshold', () => {
    let result: LiveNowCard[]
    let genesisScene: HotScene

    beforeEach(() => {
      genesisScene = createMockScene({
        id: 'genesis',
        name: 'Genesis Plaza',
        baseCoords: [0, 0],
        usersTotalCount: 2,
        parcels: [[0, 0]]
      })
      result = buildLiveNowCards([], [genesisScene])
    })

    it('should return a Genesis Plaza fallback card', () => {
      expect(result).toHaveLength(1)
    })

    it('should use the actual Genesis Plaza scene data', () => {
      expect(result[0].id).toBe('genesis')
      expect(result[0].title).toBe('Genesis Plaza')
      expect(result[0].users).toBe(2)
    })
  })

  describe('when there are scenes above the min users threshold', () => {
    describe('and a scene has a matching live event', () => {
      let result: LiveNowCard[]
      let event: EventEntry
      let scene: HotScene

      beforeEach(() => {
        event = createMockEvent({ id: 'ev-1', name: 'Live Party', x: 10, y: 20, user: '0xABC', user_name: 'DJ Cool' })
        scene = createMockScene({ id: 'sc-1', usersTotalCount: 15, parcels: [[10, 20]] })
        result = buildLiveNowCards([event], [scene])
      })

      it('should return one card', () => {
        expect(result).toHaveLength(1)
      })

      it('should be of type event', () => {
        expect(result[0].type).toBe('event')
      })

      it('should use the event name as title', () => {
        expect(result[0].title).toBe('Live Party')
      })

      it('should use the scene user count', () => {
        expect(result[0].users).toBe(15)
      })

      it('should include the creator address', () => {
        expect(result[0].creatorAddress).toBe('0xABC')
      })

      it('should include the creator name', () => {
        expect(result[0].creatorName).toBe('DJ Cool')
      })
    })

    describe('and the matched event has description, schedule and categories', () => {
      let result: LiveNowCard[]

      beforeEach(() => {
        const event = createMockEvent({
          id: 'ev-1',
          x: 10,
          y: 20,
          description: 'Live jam',
          categories: ['music'],
          start_at: '2026-04-22T17:00:00Z',
          finish_at: '2026-04-22T18:00:00Z',
          recurrent: true,
          recurrent_frequency: 'WEEKLY',
          recurrent_interval: 2,
          recurrent_dates: ['2026-04-22T17:00:00Z'],
          attending: true
        })
        const scene = createMockScene({ id: 'sc-1', usersTotalCount: 15, parcels: [[10, 20]] })
        result = buildLiveNowCards([event], [scene])
      })

      it('should propagate the description', () => {
        expect(result[0].description).toBe('Live jam')
      })

      it('should propagate the categories', () => {
        expect(result[0].categories).toEqual(['music'])
      })

      it('should propagate the schedule', () => {
        expect(result[0].startAt).toBe('2026-04-22T17:00:00Z')
        expect(result[0].finishAt).toBe('2026-04-22T18:00:00Z')
      })

      it('should propagate the recurrence fields', () => {
        expect(result[0].recurrent).toBe(true)
        expect(result[0].recurrentFrequency).toBe('WEEKLY')
        expect(result[0].recurrentInterval).toBe(2)
        expect(result[0].recurrentDates).toEqual(['2026-04-22T17:00:00Z'])
      })

      it('should propagate the attending flag', () => {
        expect(result[0].attending).toBe(true)
      })
    })

    describe('and a scene has no matching event', () => {
      let result: LiveNowCard[]
      let scene: HotScene

      beforeEach(() => {
        scene = createMockScene({ id: 'sc-1', name: 'Cool Place', usersTotalCount: 10, baseCoords: [50, 60], parcels: [[50, 60]] })
        result = buildLiveNowCards([], [scene])
      })

      it('should return one card', () => {
        expect(result).toHaveLength(1)
      })

      it('should be of type place', () => {
        expect(result[0].type).toBe('place')
      })

      it('should use the scene name as title', () => {
        expect(result[0].title).toBe('Cool Place')
      })

      it('should not have a creator name', () => {
        expect(result[0].creatorName).toBeUndefined()
      })
    })

    describe('and the scene is Genesis Plaza', () => {
      let result: LiveNowCard[]

      beforeEach(() => {
        const scene = createMockScene({
          id: 'genesis',
          name: 'Genesis Plaza',
          baseCoords: [-7, -2],
          usersTotalCount: 20,
          parcels: [[-7, -2]]
        })
        result = buildLiveNowCards([], [scene])
      })

      it('should have Decentraland Foundation as creator', () => {
        expect(result[0].creatorName).toBe('Decentraland Foundation')
      })
    })
  })

  describe('when cards are sorted by user count', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      const event1 = createMockEvent({ id: 'ev-1', name: 'Small Event', x: 1, y: 1, user: '0x1' })
      const event2 = createMockEvent({ id: 'ev-2', name: 'Big Event', x: 2, y: 2, user: '0x2' })
      const scene1 = createMockScene({ id: 'sc-1', usersTotalCount: 5, parcels: [[1, 1]] })
      const scene2 = createMockScene({ id: 'sc-2', usersTotalCount: 50, parcels: [[2, 2]] })
      result = buildLiveNowCards([event1, event2], [scene1, scene2])
    })

    it('should return the card with more users first', () => {
      expect(result[0].title).toBe('Big Event')
      expect(result[1].title).toBe('Small Event')
    })
  })

  describe('when the same event matches multiple scenes', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      const event = createMockEvent({ id: 'ev-1', x: 10, y: 20 })
      const scene1 = createMockScene({ id: 'sc-1', usersTotalCount: 10, parcels: [[10, 20]] })
      const scene2 = createMockScene({ id: 'sc-2', usersTotalCount: 8, parcels: [[10, 20]] })
      result = buildLiveNowCards([event], [scene1, scene2])
    })

    it('should only include the event once', () => {
      const eventCards = result.filter(c => c.type === 'event')
      expect(eventCards).toHaveLength(1)
    })

    it('should include the second scene as a place', () => {
      const placeCards = result.filter(c => c.type === 'place')
      expect(placeCards).toHaveLength(1)
    })
  })

  describe('when a custom minUsers is provided', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      const scene = createMockScene({ id: 'sc-1', usersTotalCount: 3, parcels: [[10, 20]] })
      result = buildLiveNowCards([], [scene], 2)
    })

    it('should include scenes above the custom threshold', () => {
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('sc-1')
    })
  })

  describe('when a custom minUsers filters out all scenes', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      const scene = createMockScene({ id: 'sc-1', usersTotalCount: 3, parcels: [[10, 20]] })
      result = buildLiveNowCards([], [scene], 10)
    })

    it('should return the Genesis Plaza fallback', () => {
      expect(result).toHaveLength(1)
      expect(result[0].creatorName).toBe('Decentraland Foundation')
    })
  })

  describe('when an event has no image', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      const event = createMockEvent({ id: 'ev-1', image: null, x: 10, y: 20 })
      const scene = createMockScene({ id: 'sc-1', usersTotalCount: 10, parcels: [[10, 20]] })
      result = buildLiveNowCards([event], [scene])
    })

    it('should use an empty string as image', () => {
      expect(result[0].image).toBe('')
    })
  })

  describe('when an event has no user_name', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      const event = createMockEvent({ id: 'ev-1', user_name: null, x: 10, y: 20 })
      const scene = createMockScene({ id: 'sc-1', usersTotalCount: 10, parcels: [[10, 20]] })
      result = buildLiveNowCards([event], [scene])
    })

    it('should have undefined creatorName', () => {
      expect(result[0].creatorName).toBeUndefined()
    })
  })
})

function mockFetchResponses(responses: Record<string, unknown>): void {
  jest.spyOn(global, 'fetch').mockImplementation((url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    for (const [pattern, body] of Object.entries(responses)) {
      if (urlStr.includes(pattern)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response)
      }
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve(null) } as Response)
  })
}

describe('enrichPlaceCards', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when there are no place cards', () => {
    let cards: LiveNowCard[]
    let result: LiveNowCard[]

    beforeEach(async () => {
      cards = [{ ...createMockPlaceCard(), type: 'event', id: 'ev-1' }]
      result = await enrichPlaceCards(cards, { placesUrl: 'https://places.test' })
    })

    it('should return the original cards unchanged', () => {
      expect(result).toBe(cards)
    })
  })

  describe('when no config URLs are provided', () => {
    let cards: LiveNowCard[]
    let result: LiveNowCard[]

    beforeEach(async () => {
      cards = [createMockPlaceCard()]
      result = await enrichPlaceCards(cards, {})
    })

    it('should return the original cards unchanged', () => {
      expect(result).toBe(cards)
    })
  })

  describe('when placesUrl is provided', () => {
    describe('and the places API returns data', () => {
      let result: LiveNowCard[]

      beforeEach(async () => {
        mockFetchResponses({
          '/places': { data: [{ description: 'A cool place', categories: ['game', 'social'] }] }
        })
        result = await enrichPlaceCards([createMockPlaceCard()], { placesUrl: 'https://places.test' })
      })

      it('should enrich the card with description', () => {
        expect(result[0].description).toBe('A cool place')
      })

      it('should enrich the card with categories', () => {
        expect(result[0].categories).toEqual(['game', 'social'])
      })
    })

    describe('and the places API returns empty data', () => {
      let cards: LiveNowCard[]
      let result: LiveNowCard[]

      beforeEach(async () => {
        cards = [createMockPlaceCard()]
        mockFetchResponses({ '/places': { data: [] } })
        result = await enrichPlaceCards(cards, { placesUrl: 'https://places.test' })
      })

      it('should return the original cards unchanged', () => {
        expect(result).toBe(cards)
      })
    })

    describe('and the places API fails', () => {
      let cards: LiveNowCard[]
      let result: LiveNowCard[]

      beforeEach(async () => {
        cards = [createMockPlaceCard()]
        jest.spyOn(global, 'fetch').mockImplementation(() => Promise.reject(new Error('network error')))
        result = await enrichPlaceCards(cards, { placesUrl: 'https://places.test' })
      })

      it('should return the original cards unchanged', () => {
        expect(result).toBe(cards)
      })
    })
  })

  describe('when the places response includes a creator_address', () => {
    describe('and the card has no creatorAddress', () => {
      let result: LiveNowCard[]

      beforeEach(async () => {
        mockFetchResponses({
          '/places': {
            data: [{ description: 'Owned', categories: [], creator_address: '0x9E0f6f65a3E165Da6bd074BF62f2ca0A78cb7D2b' }]
          }
        })
        result = await enrichPlaceCards([createMockPlaceCard()], { placesUrl: 'https://places.test' })
      })

      it('should enrich the card with creatorAddress from the Places API creator_address field', () => {
        expect(result[0].creatorAddress).toBe('0x9E0f6f65a3E165Da6bd074BF62f2ca0A78cb7D2b')
      })
    })

    describe('and the card already has a creatorAddress', () => {
      let result: LiveNowCard[]

      beforeEach(async () => {
        mockFetchResponses({
          '/places': {
            data: [{ description: 'Owned', categories: [], creator_address: '0x9E0f6f65a3E165Da6bd074BF62f2ca0A78cb7D2b' }]
          }
        })
        result = await enrichPlaceCards([createMockPlaceCard({ creatorAddress: '0xExisting' })], { placesUrl: 'https://places.test' })
      })

      it('should keep the existing creatorAddress', () => {
        expect(result[0].creatorAddress).toBe('0xExisting')
      })
    })
  })

  describe('when the places response includes owner as a wallet address', () => {
    let result: LiveNowCard[]

    beforeEach(async () => {
      mockFetchResponses({
        '/places': {
          data: [{ description: 'Owned', categories: [], owner: '0x797066a17F83425C1B4C7a8Cca52D19095520a52', contact_name: 'MetaDoge' }]
        }
      })
      result = await enrichPlaceCards([createMockPlaceCard()], { placesUrl: 'https://places.test' })
    })

    it('should treat the wallet-shaped owner as creatorAddress', () => {
      expect(result[0].creatorAddress).toBe('0x797066a17F83425C1B4C7a8Cca52D19095520a52')
    })

    it('should use contact_name as creatorName', () => {
      expect(result[0].creatorName).toBe('MetaDoge')
    })
  })

  describe('when owner is a display name rather than a wallet', () => {
    let result: LiveNowCard[]

    beforeEach(async () => {
      mockFetchResponses({
        '/places': {
          data: [{ description: 'Owned', categories: [], owner: 'mgd                                       ', contact_name: null }]
        }
      })
      result = await enrichPlaceCards([createMockPlaceCard()], { placesUrl: 'https://places.test' })
    })

    it('should not set it as creatorAddress', () => {
      expect(result[0].creatorAddress).toBeUndefined()
    })

    it('should fall back to the trimmed owner as creatorName', () => {
      expect(result[0].creatorName).toBe('mgd')
    })
  })

  describe('when contact_name is present', () => {
    let result: LiveNowCard[]

    beforeEach(async () => {
      mockFetchResponses({
        '/places': { data: [{ description: 'Place', categories: [], contact_name: 'Pink Oasis' }] }
      })
      result = await enrichPlaceCards([createMockPlaceCard()], { placesUrl: 'https://places.test' })
    })

    it('should set creatorName from contact_name', () => {
      expect(result[0].creatorName).toBe('Pink Oasis')
    })
  })

  describe('when the card already has a creatorName', () => {
    let result: LiveNowCard[]

    beforeEach(async () => {
      mockFetchResponses({
        '/places': { data: [{ description: 'Place', categories: [], contact_name: 'From API' }] }
      })
      result = await enrichPlaceCards([createMockPlaceCard({ creatorName: 'Existing' })], { placesUrl: 'https://places.test' })
    })

    it('should keep the existing creatorName', () => {
      expect(result[0].creatorName).toBe('Existing')
    })
  })

  describe('when placesUrl is missing', () => {
    let cards: LiveNowCard[]
    let result: LiveNowCard[]
    let fetchSpy: jest.SpyInstance

    beforeEach(async () => {
      cards = [createMockPlaceCard()]
      fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(jest.fn())
      fetchSpy.mockClear()
      result = await enrichPlaceCards(cards, {})
    })

    it('should make no network calls', () => {
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should return the original cards unchanged', () => {
      expect(result).toBe(cards)
    })
  })

  describe('when enrichment returns new objects', () => {
    let cards: LiveNowCard[]
    let result: LiveNowCard[]

    beforeEach(async () => {
      cards = [createMockPlaceCard()]
      mockFetchResponses({
        '/places': { data: [{ description: 'Updated', categories: [] }] }
      })
      result = await enrichPlaceCards(cards, { placesUrl: 'https://places.test' })
    })

    it('should not mutate the original card', () => {
      expect(cards[0].description).toBeUndefined()
    })

    it('should return a new array', () => {
      expect(result).not.toBe(cards)
    })

    it('should return a new card object', () => {
      expect(result[0]).not.toBe(cards[0])
    })
  })
})

describe('bucketEventsByDay', () => {
  // Build days from local-date constructor so isSameLocalDay matches recurrent_dates regardless of test TZ.
  const days = [new Date(2026, 3, 29), new Date(2026, 4, 6), new Date(2026, 4, 13)]

  describe('when a non-recurrent event falls on a visible day', () => {
    it('should bucket the event into its matching day', () => {
      const event = createMockEvent({
        recurrent: false,
        recurrent_dates: [],
        start_at: '2026-04-29T10:00:00Z',
        finish_at: '2026-04-29T11:00:00Z'
      })

      const buckets = bucketEventsByDay([event], days, new Date('2026-04-29T00:00:00Z').getTime())

      expect(buckets[0]).toHaveLength(1)
      expect(buckets[0][0]).toBe(event)
      expect(buckets[1]).toHaveLength(0)
      expect(buckets[2]).toHaveLength(0)
    })
  })

  describe('when a non-recurrent event falls outside every visible day', () => {
    it('should leave every bucket empty', () => {
      const event = createMockEvent({ recurrent: false, recurrent_dates: [], start_at: '2026-08-01T10:00:00Z' })

      const buckets = bucketEventsByDay([event], days)

      expect(buckets.every(b => b.length === 0)).toBe(true)
    })
  })

  describe('when a recurrent event has empty recurrent_dates', () => {
    it('should fall back to start_at for bucketing', () => {
      const event = createMockEvent({
        recurrent: true,
        recurrent_dates: [],
        start_at: '2026-04-29T10:00:00Z',
        finish_at: '2026-04-29T11:00:00Z'
      })

      const buckets = bucketEventsByDay([event], days, new Date('2026-04-29T00:00:00Z').getTime())

      expect(buckets[0]).toHaveLength(1)
      expect(buckets[0][0]).toBe(event)
    })
  })

  describe('when a recurrent event has occurrences inside and outside the visible days', () => {
    it('should emit one virtual entry in each matching day bucket', () => {
      const event = createMockEvent({
        recurrent: true,
        duration: 5400000,
        start_at: '2026-01-28T14:00:00Z',
        finish_at: '2026-01-28T15:30:00Z',
        recurrent_dates: [
          '2026-01-28T14:00:00Z',
          '2026-04-29T14:00:00Z',
          '2026-05-06T14:00:00Z',
          '2026-05-13T14:00:00Z',
          '2026-05-20T14:00:00Z'
        ]
      })

      const buckets = bucketEventsByDay([event], days, new Date('2026-04-29T12:00:00Z').getTime())

      expect(buckets[0][0].start_at).toBe('2026-04-29T14:00:00.000Z')
      expect(buckets[1][0].start_at).toBe('2026-05-06T14:00:00.000Z')
      expect(buckets[2][0].start_at).toBe('2026-05-13T14:00:00.000Z')
    })

    it('should override finish_at to start + duration on each virtual entry', () => {
      const event = createMockEvent({ recurrent: true, duration: 5400000, recurrent_dates: ['2026-04-29T14:00:00Z'] })

      const buckets = bucketEventsByDay([event], days, new Date('2026-04-29T12:00:00Z').getTime())

      expect(buckets[0][0].finish_at).toBe('2026-04-29T15:30:00.000Z')
    })

    it('should mark live=true only when the occurrence overlaps now', () => {
      const event = createMockEvent({
        recurrent: true,
        duration: 5400000,
        recurrent_dates: ['2026-04-29T14:00:00Z', '2026-05-06T14:00:00Z']
      })

      const buckets = bucketEventsByDay([event], days, new Date('2026-04-29T14:30:00Z').getTime())

      expect(buckets[0][0].live).toBe(true)
      expect(buckets[1][0].live).toBe(false)
    })
  })

  describe('when an event on the today column has already finished', () => {
    it('should drop the passed occurrence while keeping later ones the same day', () => {
      const passed = createMockEvent({
        id: 'passed',
        start_at: '2026-04-29T08:00:00Z',
        finish_at: '2026-04-29T09:00:00Z',
        recurrent: false,
        recurrent_dates: []
      })
      const upcoming = createMockEvent({
        id: 'upcoming',
        start_at: '2026-04-29T18:00:00Z',
        finish_at: '2026-04-29T19:00:00Z',
        recurrent: false,
        recurrent_dates: []
      })

      const buckets = bucketEventsByDay([passed, upcoming], days, new Date('2026-04-29T12:00:00Z').getTime())

      expect(buckets[0].map(e => e.id)).toEqual(['upcoming'])
    })

    it('should keep an in-progress (live) occurrence whose finish is still in the future', () => {
      const live = createMockEvent({
        id: 'live',
        start_at: '2026-04-29T11:00:00Z',
        finish_at: '2026-04-29T13:00:00Z',
        recurrent: false,
        recurrent_dates: []
      })

      const buckets = bucketEventsByDay([live], days, new Date('2026-04-29T12:00:00Z').getTime())

      expect(buckets[0].map(e => e.id)).toEqual(['live'])
    })
  })

  describe('when several events fall on the same day in arbitrary API order', () => {
    it('should sort each day bucket ascending by start time', () => {
      const late = createMockEvent({
        id: 'late',
        start_at: '2026-04-29T18:00:00Z',
        finish_at: '2026-04-29T19:00:00Z',
        recurrent: false,
        recurrent_dates: []
      })
      const early = createMockEvent({
        id: 'early',
        start_at: '2026-04-29T09:00:00Z',
        finish_at: '2026-04-29T10:00:00Z',
        recurrent: false,
        recurrent_dates: []
      })

      const buckets = bucketEventsByDay([late, early], days, new Date('2026-04-29T00:00:00Z').getTime())

      expect(buckets[0].map(e => e.id)).toEqual(['early', 'late'])
    })
  })

  describe('when the visible range extends past the last materialized recurrent_dates entry', () => {
    // Regression for the issue reported as "recurring hangouts disappear after late July": the
    // events API materializes only ~10 future occurrences into recurrent_dates, so a weekly
    // event with recurrent_until a year out had nothing to bucket past mid-July.
    // bucketEventsByDay now extrapolates via expandRecurrentDates before bucketing.
    it('should synthesize occurrences from the rule and bucket them into far-future days', () => {
      const event = createMockEvent({
        recurrent: true,
        recurrent_frequency: 'WEEKLY',
        recurrent_interval: 1,
        recurrent_until: '2027-01-01T00:00:00Z',
        duration: 5400000,
        start_at: '2026-04-29T14:00:00Z',
        recurrent_dates: ['2026-04-29T14:00:00Z', '2026-05-06T14:00:00Z', '2026-05-13T14:00:00Z']
      })
      const farFutureDays = [new Date(2026, 6, 15), new Date(2026, 6, 22), new Date(2026, 6, 29)]

      const buckets = bucketEventsByDay([event], farFutureDays, new Date('2026-04-29T12:00:00Z').getTime())

      expect(buckets[0]).toHaveLength(1)
      expect(buckets[1]).toHaveLength(1)
      expect(buckets[2]).toHaveLength(1)
    })
  })
})

describe('expandRecurrentDates', () => {
  const baseRecurrent = {
    recurrent: true,
    recurrent_interval: 1,
    recurrent_count: null,
    recurrent_until: null as string | null
  }

  describe('when the event is not recurrent', () => {
    it('should return its recurrent_dates untouched', () => {
      const event = createMockEvent({ recurrent: false, recurrent_dates: ['2026-04-29T10:00:00Z'] })
      const result = expandRecurrentDates(event, new Date('2027-01-01'))
      expect(result).toEqual(['2026-04-29T10:00:00Z'])
    })
  })

  describe('when recurrent_dates is empty', () => {
    it('should return an empty array without attempting extrapolation', () => {
      const event = createMockEvent({ recurrent: true, recurrent_dates: [] })
      const result = expandRecurrentDates(event, new Date('2027-01-01'))
      expect(result).toEqual([])
    })
  })

  describe('when recurrent_count is set to an explicit value', () => {
    it('should honor the creator-set count and not synthesize beyond it', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'WEEKLY',
        recurrent_count: 10,
        recurrent_dates: ['2026-04-29T14:00:00Z', '2026-05-06T14:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2027-01-01'))
      expect(result).toEqual(['2026-04-29T14:00:00Z', '2026-05-06T14:00:00Z'])
    })
  })

  describe('when the materialized window already covers the visible range', () => {
    it('should return the existing recurrent_dates unchanged', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'WEEKLY',
        recurrent_until: '2027-01-01T00:00:00Z',
        recurrent_dates: ['2026-04-29T14:00:00Z', '2026-05-06T14:00:00Z', '2026-05-13T14:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2026-05-10'))
      expect(result).toEqual(['2026-04-29T14:00:00Z', '2026-05-06T14:00:00Z', '2026-05-13T14:00:00Z'])
    })
  })

  describe('when recurrent_until has already passed the last materialized entry', () => {
    it('should not synthesize beyond the rule', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'WEEKLY',
        recurrent_until: '2026-05-01T00:00:00Z',
        recurrent_dates: ['2026-04-22T14:00:00Z', '2026-04-29T14:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2027-01-01'))
      expect(result).toEqual(['2026-04-22T14:00:00Z', '2026-04-29T14:00:00Z'])
    })
  })

  describe('when the recurrence is WEEKLY on a single weekday', () => {
    it('should extend by 7-day steps up to the visible date', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'WEEKLY',
        recurrent_until: '2027-01-01T00:00:00Z',
        recurrent_dates: ['2026-04-29T14:00:00Z', '2026-05-06T14:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2026-06-10T00:00:00Z'))
      expect(result).toEqual([
        '2026-04-29T14:00:00Z',
        '2026-05-06T14:00:00Z',
        '2026-05-13T14:00:00.000Z',
        '2026-05-20T14:00:00.000Z',
        '2026-05-27T14:00:00.000Z',
        '2026-06-03T14:00:00.000Z'
      ])
    })
  })

  describe('when the recurrence is WEEKLY across multiple weekdays (MWF pattern)', () => {
    it('should detect the 3-entry cycle and replicate it', () => {
      // Mondays/Wednesdays/Fridays: deltas of 2d, 2d, 3d repeating.
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'WEEKLY',
        recurrent_until: '2027-01-01T00:00:00Z',
        recurrent_dates: [
          '2026-04-27T14:00:00Z', // Mon
          '2026-04-29T14:00:00Z', // Wed
          '2026-05-01T14:00:00Z', // Fri
          '2026-05-04T14:00:00Z', // Mon
          '2026-05-06T14:00:00Z', // Wed
          '2026-05-08T14:00:00Z' // Fri
        ]
      })
      const result = expandRecurrentDates(event, new Date('2026-05-15T23:59:59Z'))
      // Next week should continue Mon/Wed/Fri at May 11/13/15.
      expect(result.slice(-3)).toEqual(['2026-05-11T14:00:00.000Z', '2026-05-13T14:00:00.000Z', '2026-05-15T14:00:00.000Z'])
    })
  })

  describe('when the recurrence is WEEKLY with an interval greater than 1', () => {
    it('should extend by interval × 7 days per step', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'WEEKLY',
        recurrent_interval: 2,
        recurrent_until: '2027-01-01T00:00:00Z',
        recurrent_dates: ['2026-04-29T14:00:00Z', '2026-05-13T14:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2026-06-30T00:00:00Z'))
      expect(result.slice(-3)).toEqual(['2026-05-27T14:00:00.000Z', '2026-06-10T14:00:00.000Z', '2026-06-24T14:00:00.000Z'])
    })
  })

  describe('when the recurrence is DAILY', () => {
    it('should extend by 1 day per step', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'DAILY',
        recurrent_until: '2027-01-01T00:00:00Z',
        recurrent_dates: ['2026-04-29T10:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2026-05-03T00:00:00Z'))
      expect(result).toEqual(['2026-04-29T10:00:00Z', '2026-04-30T10:00:00.000Z', '2026-05-01T10:00:00.000Z', '2026-05-02T10:00:00.000Z'])
    })
  })

  describe('when the recurrence is MONTHLY', () => {
    it('should extend by calendar months', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'MONTHLY',
        recurrent_until: '2027-12-01T00:00:00Z',
        recurrent_dates: ['2026-01-15T10:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2026-05-01T00:00:00Z'))
      expect(result).toEqual(['2026-01-15T10:00:00Z', '2026-02-15T10:00:00.000Z', '2026-03-15T10:00:00.000Z', '2026-04-15T10:00:00.000Z'])
    })

    // Regression: setUTCMonth on Jan 31 silently overflows to Mar 3 because
    // Feb 31 doesn't exist. The anchor-and-clamp logic should land on Feb 28/29
    // instead, matching what RRule produces on the server.
    it('should clamp the anchor day when the target month is shorter', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'MONTHLY',
        recurrent_until: '2027-12-01T00:00:00Z',
        recurrent_dates: ['2026-01-31T10:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2026-06-01T00:00:00Z'))
      expect(result).toEqual([
        '2026-01-31T10:00:00Z',
        '2026-02-28T10:00:00.000Z',
        '2026-03-31T10:00:00.000Z',
        '2026-04-30T10:00:00.000Z',
        '2026-05-31T10:00:00.000Z'
      ])
    })
  })

  describe('when the recurrence is YEARLY', () => {
    it('should extend by calendar years', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'YEARLY',
        recurrent_until: '2030-01-01T00:00:00Z',
        recurrent_dates: ['2024-06-15T10:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2027-07-01T00:00:00Z'))
      expect(result).toEqual(['2024-06-15T10:00:00Z', '2025-06-15T10:00:00.000Z', '2026-06-15T10:00:00.000Z', '2027-06-15T10:00:00.000Z'])
    })

    // Regression: setUTCFullYear on Feb 29 2024 silently overflows to Mar 1
    // 2025 because Feb 29 doesn't exist outside leap years. The clamp lands
    // on Feb 28 of non-leap years and returns to Feb 29 when leap years come
    // back around — same behavior the server's RRule produces.
    it('should clamp the anchor day on non-leap years for a leap-day series', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'YEARLY',
        recurrent_until: '2030-01-01T00:00:00Z',
        recurrent_dates: ['2024-02-29T10:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2029-01-01T00:00:00Z'))
      expect(result).toEqual([
        '2024-02-29T10:00:00Z',
        '2025-02-28T10:00:00.000Z',
        '2026-02-28T10:00:00.000Z',
        '2027-02-28T10:00:00.000Z',
        '2028-02-29T10:00:00.000Z'
      ])
    })
  })

  describe('when the recurrence is HOURLY', () => {
    it('should extend by 1 hour per step', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'HOURLY',
        recurrent_until: '2027-01-01T00:00:00Z',
        recurrent_dates: ['2026-04-29T10:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2026-04-29T14:00:00Z'))
      expect(result).toEqual([
        '2026-04-29T10:00:00Z',
        '2026-04-29T11:00:00.000Z',
        '2026-04-29T12:00:00.000Z',
        '2026-04-29T13:00:00.000Z',
        '2026-04-29T14:00:00.000Z'
      ])
    })
  })

  describe('when the recurrence is capped by recurrent_until earlier than the visible day', () => {
    it('should stop synthesizing at recurrent_until', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'WEEKLY',
        recurrent_until: '2026-05-15T00:00:00Z',
        recurrent_dates: ['2026-04-29T14:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2027-01-01T00:00:00Z'))
      expect(result).toEqual(['2026-04-29T14:00:00Z', '2026-05-06T14:00:00.000Z', '2026-05-13T14:00:00.000Z'])
    })
  })

  describe('when recurrent_frequency is null (incomplete rule)', () => {
    it('should return materialized dates unchanged', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: null,
        recurrent_until: '2027-01-01T00:00:00Z',
        recurrent_dates: ['2026-04-29T14:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2026-06-01T00:00:00Z'))
      expect(result).toEqual(['2026-04-29T14:00:00Z'])
    })
  })

  describe('when recurrent_dates starts with start_at far in the past followed by a future window', () => {
    // The events API server prepends start_at to recurrent_dates in its response.
    // For an event running for months, recurrent_dates looks like
    // [start_at_in_january, future_date_1, future_date_2, ...]. The first delta
    // is a huge gap; the subsequent ones are the real cadence. Cycle detection
    // walks backwards so the leading gap is ignored.
    it('should ignore the leading gap and use the recent cadence', () => {
      const event = createMockEvent({
        ...baseRecurrent,
        recurrent_frequency: 'WEEKLY',
        recurrent_until: '2027-01-01T00:00:00Z',
        recurrent_dates: ['2026-01-15T14:00:00Z', '2026-04-29T14:00:00Z', '2026-05-06T14:00:00Z', '2026-05-13T14:00:00Z']
      })
      const result = expandRecurrentDates(event, new Date('2026-06-05T00:00:00Z'))
      expect(result.slice(-3)).toEqual(['2026-05-20T14:00:00.000Z', '2026-05-27T14:00:00.000Z', '2026-06-03T14:00:00.000Z'])
    })
  })
})
